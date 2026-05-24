'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Mic, Square, Bookmark, Send, Trash2, Check } from 'lucide-react'
import { useBrainstormerStore, type VoiceBookmark } from '@/lib/brainstormer-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

export function VoiceRecorder() {
  const {
    isRecording,
    recordingDuration,
    bookmarks,
    setRecording,
    setRecordingDuration,
    addBookmark,
    removeBookmark,
    addMessage,
    setActiveTab,
  } = useBrainstormerStore()

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(0))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Update waveform visualization
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    // Sample 30 bars from the frequency data
    const barCount = 30
    const step = Math.floor(bufferLength / barCount)
    const bars: number[] = []
    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255
      bars.push(Math.max(0.05, value))
    }
    setWaveformData(bars)
    animationFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [])

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyser
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setRecording(true)
      setTranscription(null)

      // Start timer
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1
          return next
        })
      }, 1000)

      // Start waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  // Stop recording
  // Note: setRecording is a zustand action (stable reference), so we access the store
  // directly via getState() to keep this callback fully stable with an empty dep array.
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    useBrainstormerStore.getState().setRecording(false)
    setWaveformData(Array(30).fill(0))
    analyserRef.current = null
  }, [])

  // Transcribe audio
  const handleTranscribe = async () => {
    stopRecording()

    if (audioChunksRef.current.length === 0) {
      toast.error('No audio recorded')
      return
    }

    setIsTranscribing(true)

    try {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const reader = new FileReader()

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        try {
          const response = await fetch('/api/brainstorm/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio }),
          })

          if (!response.ok) throw new Error('Transcription failed')

          const data = await response.json()
          setTranscription(data.text)
          toast.success('Transcription complete')
        } catch {
          // Fallback transcription
          setTranscription(
            `[Local fallback] Voice note recorded (${formatTime(recordingDuration)}). ` +
            `Topic context: ${useBrainstormerStore.getState().promptConfig.topic || 'General brainstorming'}. ` +
            `Consider reviewing your recording and converting key points to chat.`
          )
          toast.info('Using offline mode — transcription unavailable')
        } finally {
          setIsTranscribing(false)
        }
      }

      reader.readAsDataURL(blob)
    } catch {
      setIsTranscribing(false)
      toast.error('Failed to process audio')
    }
  }

  // Add bookmark
  const handleBookmark = () => {
    const bookmark: VoiceBookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: recordingDuration,
      label: `Bookmark ${bookmarks.length + 1}`,
    }
    addBookmark(bookmark)
    toast.success('Bookmark added')
  }

  // Send transcription to chat
  const handleAddToChat = () => {
    if (!transcription) return
    addMessage({ role: 'user', content: `[Voice Note] ${transcription}` })
    setActiveTab('chat')
    toast.success('Transcription sent to chat')
  }

  // Edit bookmark label
  const startEditBookmark = (bookmark: VoiceBookmark) => {
    setEditingBookmarkId(bookmark.id)
    setEditLabel(bookmark.label)
  }

  const saveBookmarkLabel = (id: string) => {
    // We need to update the bookmark — remove and re-add with new label
    const bookmark = bookmarks.find((b) => b.id === id)
    if (bookmark) {
      removeBookmark(id)
      addBookmark({ ...bookmark, label: editLabel })
    }
    setEditingBookmarkId(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col items-center gap-4">
        {/* Timer */}
        <div className="text-3xl font-mono font-bold text-white/90 tracking-wider">
          {formatTime(recordingDuration)}
        </div>

        {/* Waveform visualization */}
        <div className="flex items-center justify-center gap-[3px] h-20 w-full px-4">
          {waveformData.map((value, i) => (
            <div
              key={i}
              className="w-2 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(4, value * 72)}px`,
                backgroundColor: isRecording
                  ? `rgba(245, 158, 11, ${0.3 + value * 0.7})`
                  : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="size-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all shadow-lg shadow-red-500/30 group"
              aria-label="Start recording"
            >
              <Mic className="size-7 text-white group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={handleBookmark}
                className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Add bookmark"
              >
                <Bookmark className="size-4 text-amber-400" />
              </button>
              <button
                onClick={handleTranscribe}
                className="size-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all shadow-lg shadow-red-500/30 animate-pulse"
                aria-label="Stop recording"
              >
                <Square className="size-7 text-white fill-white" />
              </button>
              <button
                onClick={stopRecording}
                className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Discard recording"
              >
                <Trash2 className="size-4 text-white/60" />
              </button>
            </>
          )}
        </div>

        {/* Recording hint */}
        {!isRecording && !transcription && recordingDuration === 0 && (
          <p className="text-xs text-white/40 text-center">
            Tap the red button to start recording
          </p>
        )}
        {isRecording && (
          <p className="text-xs text-amber-400/70 text-center">
            Recording... Tap stop to transcribe
          </p>
        )}

        {/* Transcription result */}
        {isTranscribing && (
          <div className="w-full rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <span className="size-3 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-xs text-white/60">Transcribing audio...</span>
            </div>
          </div>
        )}

        {transcription && !isTranscribing && (
          <div className="w-full rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
            <p className="text-xs font-semibold text-white/70">Transcription</p>
            <p className="text-sm text-white/90 leading-relaxed">{transcription}</p>
            <Button
              onClick={handleAddToChat}
              size="sm"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs"
            >
              <Send className="size-3" />
              Add to Chat
            </Button>
          </div>
        )}

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <div className="w-full space-y-2">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Bookmarks ({bookmarks.length})
            </h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                >
                  <Bookmark className="size-3 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-mono text-amber-400/70 shrink-0">
                    {formatTime(bookmark.timestamp)}
                  </span>
                  {editingBookmarkId === bookmark.id ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveBookmarkLabel(bookmark.id)}
                        className="h-5 text-xs bg-transparent border-white/10 text-white/90 px-1 py-0"
                        autoFocus
                      />
                      <button
                        onClick={() => saveBookmarkLabel(bookmark.id)}
                        className="text-green-400 hover:text-green-300 shrink-0"
                      >
                        <Check className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditBookmark(bookmark)}
                      className="text-xs text-white/60 hover:text-white/90 truncate flex-1 text-left"
                    >
                      {bookmark.label}
                    </button>
                  )}
                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    className="text-white/30 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
