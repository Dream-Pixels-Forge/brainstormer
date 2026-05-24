/**
 * Kokoro TTS Engine — Singleton manager for Kokoro text-to-speech.
 *
 * Uses `kokoro-js` which wraps @huggingface/transformers + ONNX Runtime.
 * Model is cached in the HuggingFace cache directory after first download.
 */

import { KokoroTTS, type GenerateOptions } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const MODEL_DTYPE = 'q8' as const   // quantised 8-bit — good balance of speed/quality
const MODEL_DEVICE = 'cpu' as const  // Node.js backend uses CPU

// ── Singleton state ─────────────────────────────────────

let ttsInstance: KokoroTTS | null = null
let isLoading = false
let loadError: string | null = null
let downloadProgress = 0

// ── Model status ────────────────────────────────────────

export interface KokoroStatus {
  /** Is the model loaded and ready? */
  ready: boolean
  /** Is the model currently being loaded/downloaded? */
  loading: boolean
  /** Download / load progress 0-100 */
  progress: number
  /** Error message if loading failed */
  error: string | null
  /** Is the model downloaded in cache (checked without loading) */
  downloaded: boolean
}

/**
 * Get current Kokoro engine status.
 */
export function getKokoroStatus(): KokoroStatus {
  return {
    ready: ttsInstance !== null,
    loading: isLoading,
    progress: downloadProgress,
    error: loadError,
    downloaded: ttsInstance !== null, // if loaded, it's downloaded; otherwise we check on demand
  }
}

// ── Load / Download ─────────────────────────────────────

/**
 * Load (and download if needed) the Kokoro model.
 * This is a heavy operation — the model is ~86MB quantised.
 */
export async function loadKokoroModel(): Promise<KokoroStatus> {
  if (ttsInstance) return getKokoroStatus()
  if (isLoading) return getKokoroStatus()

  isLoading = true
  loadError = null
  downloadProgress = 0

  try {
    ttsInstance = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: MODEL_DTYPE,
      device: MODEL_DEVICE,
      progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
        if (progress.status === 'progress' && typeof progress.progress === 'number') {
          downloadProgress = Math.round(progress.progress)
        } else if (progress.status === 'done') {
          downloadProgress = 100
        }
      },
    })

    downloadProgress = 100
    isLoading = false
    return getKokoroStatus()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Kokoro model'
    loadError = message
    isLoading = false
    ttsInstance = null
    return getKokoroStatus()
  }
}

/**
 * Unload the model from memory.
 */
export function unloadKokoroModel(): void {
  ttsInstance = null
  isLoading = false
  loadError = null
  downloadProgress = 0
}

// ── Synthesis ───────────────────────────────────────────

export interface SynthesizeOptions {
  text: string
  voice?: GenerateOptions['voice']
  speed?: number
}

export interface SynthesizeResult {
  /** Base64-encoded WAV audio */
  audioBase64: string
  /** Sample rate */
  sampleRate: number
  /** Duration in seconds */
  duration: number
}

/**
 * Synthesize text to speech using Kokoro.
 * Returns a base64-encoded WAV audio buffer.
 */
export async function synthesize(options: SynthesizeOptions): Promise<SynthesizeResult> {
  if (!ttsInstance) {
    throw new Error('Kokoro model not loaded. Call loadKokoroModel() first.')
  }

  const { text, voice = 'af_heart', speed = 1.0 } = options

  const audio = await ttsInstance.generate(text, { voice, speed })

  // audio is a RawAudio object from @huggingface/transformers
  // It has .audio (Float32Array) and .sampling_rate (number)
  const float32Data = audio.audio as Float32Array
  const sampleRate = audio.sampling_rate as number

  // Convert Float32 PCM to 16-bit PCM WAV
  const wavBuffer = float32ToWav(float32Data, sampleRate)
  const base64 = Buffer.from(wavBuffer).toString('base64')
  const duration = float32Data.length / sampleRate

  return {
    audioBase64: base64,
    sampleRate,
    duration,
  }
}

/**
 * Get available voice names.
 */
export function getAvailableVoices(): string[] {
  if (!ttsInstance) return []
  return Object.keys(ttsInstance.voices)
}

// ── WAV encoder ─────────────────────────────────────────

/**
 * Encode Float32 PCM data into a 16-bit WAV file buffer.
 */
function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)             // chunk size
  view.setUint16(20, 1, true)              // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Write PCM samples
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF
    view.setInt16(offset, val | 0, true)
    offset += 2
  }

  return buffer
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
