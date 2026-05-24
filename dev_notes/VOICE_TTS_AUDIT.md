# Voice & TTS Deep Audit

**Date:** 2026-05-24
**Scope:** Voice-to-text input, browser TTS, Kokoro TTS engine, and all related API routes + UI components
**Reviewer:** PRIDES Master Coordinator

---

## Files Reviewed

| # | File | Role |
|---|------|------|
| 1 | `src/components/brainstormer/SparkTab.tsx` | Voice input (SpeechRecognition + MediaRecorder fallback) |
| 2 | `src/components/brainstormer/ChatTab.tsx` | Voice input + TTS playback + replay |
| 3 | `src/components/brainstormer/SettingsTab.tsx` | Kokoro model download + TTS engine config |
| 4 | `src/lib/tts-service.ts` | Browser SpeechSynthesis API wrapper |
| 5 | `src/lib/kokoro/engine.ts` | Kokoro-js engine singleton (load, synthesize, WAV encode) |
| 6 | `src/app/api/kokoro/status/route.ts` | Kokoro engine status endpoint |
| 7 | `src/app/api/kokoro/download/route.ts` | Kokoro model download trigger |
| 8 | `src/app/api/kokoro/synthesize/route.ts` | Kokoro TTS synthesis endpoint |
| 9 | `src/app/api/brainstorm/transcribe/route.ts` | ASR transcription API endpoint |
| 10 | `src/lib/brainstormer-store.ts` | Zustand store (voice/TTS state) |

---

## Issue Summary

| Severity | Count | ID Range |
|----------|-------|----------|
| 🔴 Bug | 3 | B1–B3 |
| 🟠 Performance/UX | 3 | P1–P3 |
| 🔵 Architecture | 3 | A1–A3 |
| **Total** | **9** | |

---

## 🔴 Bugs

### B1 — `SpeechRecognitionEvent` type used but not defined in ChatTab

- **File:** `src/components/brainstormer/ChatTab.tsx` line 313
- **Severity:** 🔴 Bug (runtime type unsafety)

```ts
recognition.onresult = (event: SpeechRecognitionEvent) => {
```

`SpeechRecognitionEvent` is only defined in `SparkTab.tsx` (line 12). ChatTab neither imports it nor defines it locally. The `next.config.ts` has `ignoreBuildErrors: true`, so TypeScript silently resolves this as `any` — meaning `event.results[0][0].transcript` is completely unchecked. If the browser API shape differs from what the code expects, this will fail at runtime with no type-level warning.

**Fix:** Extract the `SpeechRecognitionEvent` and `SpeechRecognitionInstance` interfaces to a shared types file (e.g., `src/lib/speech-types.ts`) and import them in both components.

---

### B2 — Kokoro download + poll race condition

- **Files:** `src/components/brainstormer/SettingsTab.tsx:98-111`, `src/app/api/kokoro/download/route.ts:20`
- **Severity:** 🔴 Bug (UI shows incorrect state)

The `/api/kokoro/download` route fires `loadKokoroModel().catch(() => {})` **without awaiting it** and returns immediately (line 20 of download route). The client then starts a 2-second polling interval on `/api/kokoro/status`.

If the model is already cached on disk and loads in under 2 seconds, or fails immediately, the poll starts *after* the fact. The status already shows `ready: true` or `error: "..."`, but the UI shows "Downloading..." for a full 2 seconds before the first poll tick catches up. Conversely, if loading fails instantly, the `handleDownloadKokoro` function optimistically set `loading: true` before the poll starts, so the progress bar appears stuck.

**Fix:** The `/download` endpoint should run `loadKokoroModel()` synchronously (await it) and return the final status for the fast-path case. The client should also call `/status` immediately after the download POST resolves to check for fast completion, before starting the poll interval.

---

### B3 — `spoken` field on ChatMessage is dead code

- **File:** `src/lib/brainstormer-store.ts` line 21
- **Severity:** 🔴 Bug (unused feature, missing tracking)

```ts
spoken?: boolean // whether TTS has spoken this message
```

This field is defined on `ChatMessage` but **never set or checked anywhere** in the codebase:
- Nothing sets `spoken = true` after TTS finishes speaking a message
- Nothing checks `spoken` before auto-speaking a message
- The "Replay" button can speak the same message repeatedly with no tracking
- No visual indicator distinguishes "already spoken" from "not yet spoken"

**Fix:** Wire `spoken` into the TTS flow:
1. Set `message.spoken = true` after `ttsService.speak()` resolves
2. Check `spoken` before auto-speaking new assistant messages
3. Optionally show a visual indicator (e.g., muted speaker icon for already-spoken messages)

---

## 🟠 Performance / UX

### P1 — `WaveformBars` uses `Math.random()` in render

- **File:** `src/components/brainstormer/SparkTab.tsx` lines 66–74
- **Severity:** 🟠 Performance (unnecessary re-render jitter)

```tsx
height: isActive ? `${12 + Math.random() * 24}px` : '4px',
backgroundColor: isActive
  ? `rgba(239, 68, 68, ${0.4 + Math.random() * 0.6})`
  : 'rgba(255,255,255,0.15)',
```

`Math.random()` is called on **every single render** of the component. The bars randomly change height and color on every state update, producing a jittery waveform that doesn't reflect actual voice activity. This creates visual noise and causes unnecessary style recalculations.

**Fix:** Drive the animation purely through CSS keyframes with staggered delays (the `animationDelay` pattern is already in place). Remove `Math.random()` from `height` and `backgroundColor` — use fixed base values and let the CSS animation handle the visual variation.

---

### P2 — SparkTab SpeechRecognition `onerror` discards error info

- **File:** `src/components/brainstormer/SparkTab.tsx` line 153
- **Severity:** 🟠 UX (poor error messaging)

```ts
recognition.onerror = () => {
  setIsRecordingLocal(false)
  setRecording(false)
  toast.error('Speech recognition failed. Try the mic button for recording.')
}
```

The `onerror` callback receives an `ErrorEvent` with an `error` field, but the parameter is omitted. Different errors should be handled differently:
- `no-speech` — user didn't speak, should not show an error toast
- `aborted` — intentional stop, no error message needed
- `audio-capture` — actual microphone problem, show error
- `not-allowed` — permission denied

**Fix:** Accept the event parameter and branch on `event.error`:
```ts
recognition.onerror = (event) => {
  if (event.error === 'aborted' || event.error === 'no-speech') return
  toast.error(`Speech recognition error: ${event.error}`)
}
```

---

### P3 — `requestFirstQuestion` stale closure

- **File:** `src/components/brainstormer/ChatTab.tsx` lines 83–95
- **Severity:** 🟠 Bug (stale data in API call)

```ts
useEffect(() => {
  if (!idea) return
  requestFirstQuestion()
}, [idea])  // only depends on `idea`
```

`requestFirstQuestion()` captures `ideaAnalysis`, `settings`, and `idea` from the render closure. The `useEffect` only lists `[idea]` as a dependency. If `ideaAnalysis` changes asynchronously (e.g., arrives from the Spark analysis API after the chat tab mounts), the first chat question will be sent with a stale/empty `ideaAnalysis`.

**Fix:** Either:
- Add `ideaAnalysis` and `settings` to the dependency array
- Or have `requestFirstQuestion` read directly from the zustand store via `useBrainstormerStore.getState()` to always get fresh values

---

## 🔵 Architecture / Maintainability

### A1 — Transcribe API uses unconfigured `ZAI.create()`

- **File:** `src/app/api/brainstorm/transcribe/route.ts` line 15
- **Severity:** 🔵 Architecture (production readiness)

```ts
const zai = await ZAI.create()
```

The `z-ai-web-dev-sdk` is initialized with zero configuration. If the SDK requires environment variables (API keys, base URL, etc.) in production, this will always fail. Additionally, the error response returns `{ fallback: true }` but the client never acts on this flag — it just shows "Transcription unavailable — type your idea instead" without attempting the browser's built-in SpeechRecognition API as a secondary fallback.

**Fix:**
1. Verify the SDK's production configuration requirements and add env vars if needed
2. On the client side, use the `fallback: true` flag to trigger `tryBrowserSpeechRecognition()` as a secondary fallback before giving up

---

### A2 — ChatTab SpeechRecognition fallback missing abort ref

- **File:** `src/components/brainstormer/ChatTab.tsx` lines 298–325
- **Severity:** 🔵 Architecture (resource leak)

When `handleTranscribe` fails (MediaRecorder path), it calls `tryBrowserSpeechRecognition()` as a fallback. This creates a new `SpeechRecognition` instance but **never saves it to a ref**. If the component unmounts while listening, the cleanup effect (lines 356–363) won't abort it, leaving the microphone active.

In contrast, `SparkTab.tsx` correctly saves the recognition instance to `recognitionRef` and aborts it in cleanup (lines 118, 127).

**Fix:** Add a `recognitionRef` to ChatTab (similar to SparkTab), save the SpeechRecognition instance there, and abort it in the cleanup effect.

---

### A3 — Kokoro engine progress callback type may mismatch

- **File:** `src/lib/kokoro/engine.ts` line 67
- **Severity:** 🔵 Architecture (potential silent failure)

```ts
progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
  if (progress.status === 'progress' && typeof progress.progress === 'number') {
    downloadProgress = Math.round(progress.progress)
  } else if (progress.status === 'done') {
    downloadProgress = 100
  }
},
```

The actual callback signature from `kokoro-js` (which wraps HuggingFace `@huggingface/transformers`) may differ from this annotation:
- `progress` could be a float 0–1 instead of 0–100
- `status` values could be different strings (e.g., `'download'`, `'load'`, `'ready'`)
- The object shape may vary between model files

If the types mismatch, `downloadProgress` will never update and the UI progress bar will remain at 0.

**Fix:** Add a normalization step. Log the raw progress object in development to verify the actual shape. Handle both 0–1 and 0–100 ranges:
```ts
const p = progress.progress ?? 0
const normalized = p <= 1 ? Math.round(p * 100) : Math.round(p)
```

---

## Appendix: Component Data Flow

```
[SparkTab]
  SpeechRecognition ──→ onresult: setIdea(transcript) ──→ Zustand.idea
  MediaRecorder ──→ FileReader(base64) ──→ POST /api/brainstorm/transcribe ──→ text ──→ setIdea()

[ChatTab]
  MediaRecorder ──→ FileReader(base64) ──→ POST /api/brainstorm/transcribe ──→ text ──→ setInput()
    └─ fallback: tryBrowserSpeechRecognition() ──→ setInput(transcript)
  TTS: speakText() ──→ ttsService.speak() ──→ SpeechSynthesis API
  Replay: handleReplay(msg) ──→ ttsService.speak(msg.content)

[SettingsTab]
  Kokoro: Download ──→ POST /api/kokoro/download ──→ loadKokoroModel()
    └─ Poll: setInterval 2s ──→ GET /api/kokoro/status ──→ update UI
  Kokoro: Test Voice ──→ POST /api/kokoro/synthesize ──→ audio ──→ new Audio(data:audio/wav;base64,...).play()
  Browser TTS: Test Voice ──→ ttsService.speak(text)

[API Routes]
  /api/kokoro/status ──→ getKokoroStatus() (singleton state)
  /api/kokoro/download ──→ loadKokoroModel() (async, not awaited)
  /api/kokoro/synthesize ──→ synthesize() ──→ Float32 PCM ──→ WAV ──→ base64
  /api/brainstorm/transcribe ──→ ZAI.create().audio.asr.create()
```
