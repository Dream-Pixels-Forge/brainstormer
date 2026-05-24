'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  MessageCircle, Mic, MicOff, Volume2, VolumeX,
  Send, Loader2, Search,
} from 'lucide-react'
import { useBrainstormerStore, type ChatMessage } from '@/lib/brainstormer-store'
import { ttsService } from '@/lib/tts-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// ── Waveform bars for recording animation ──────────────

function RecordingWaveform() {
  return (
    <div className="flex items-center gap-[2px] h-5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-amber-400"
          style={{
            animation: `waveform-bar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
            height: '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform-bar {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

// ── Main ChatTab component ─────────────────────────────

export function ChatTab() {
  const {
    idea,
    ideaAnalysis,
    messages,
    isChatLoading,
    currentQuestionIndex,
    qaComplete,
    settings,
    isRecording,
    isSpeaking,
    addMessage,
    setChatLoading,
    incrementQuestionIndex,
    setRecording,
    setSpeaking,
    setActiveTab,
    setSettings,
  } = useBrainstormerStore()

  const [input, setInput] = useState('')
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [showCompletionMsg, setShowCompletionMsg] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const initRanRef = useRef(false)

  // ── Auto-scroll to bottom on new messages ────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isChatLoading])

  // ── Auto-generate first question when tab opens ──────
  useEffect(() => {
    if (initRanRef.current) return
    if (hasInitialized) return
    if (!idea) return

    initRanRef.current = true
    setHasInitialized(true)

    // Only generate the first question if there are no messages yet
    if (messages.length === 0) {
      requestFirstQuestion()
    }
  }, [idea])

  const requestFirstQuestion = async () => {
    setChatLoading(true)
    try {
      const response = await fetch('/api/brainstorm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          idea,
          ideaAnalysis,
          settings,
          questionIndex: 0,
        }),
      })

      if (!response.ok) throw new Error('Chat API failed')

      const data = await response.json()
      addMessage({ role: 'assistant', content: data.response })

      // Speak if TTS enabled
      if (settings.ttsEnabled) {
        await speakText(data.response)
      }
    } catch {
      // Fallback question
      const fallback = generateFallbackQuestion(0, idea)
      addMessage({ role: 'assistant', content: fallback })
      toast.info('Using offline mode — local fallback')
    } finally {
      setChatLoading(false)
    }
  }

  // ── Speak helper ─────────────────────────────────────
  const speakText = async (text: string, messageId?: string): Promise<void> => {
    if (!ttsService.isAvailable()) return
    try {
      setSpeaking(true)
      if (messageId) setSpeakingMessageId(messageId)
      await ttsService.speak(text)
    } catch {
      // Silently fail — TTS is optional
    } finally {
      setSpeaking(false)
      setSpeakingMessageId(null)
    }
  }

  // ── Send user message ────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isChatLoading) return

    setInput('')
    addMessage({ role: 'user', content: text })

    // Increment question index
    incrementQuestionIndex()

    // Check if Q&A is complete
    const state = useBrainstormerStore.getState()
    if (state.qaComplete) {
      // Show completion message briefly, then switch to export
      setShowCompletionMsg(true)
      setTimeout(() => {
        setShowCompletionMsg(false)
        setActiveTab('export')
      }, 2000)
      return
    }

    // Request next question
    setChatLoading(true)
    try {
      const updatedMessages = [
        ...state.messages,
        { id: `msg-${Date.now()}`, role: 'user' as const, content: text, timestamp: Date.now() },
      ]
      const response = await fetch('/api/brainstorm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          idea: state.idea,
          ideaAnalysis: state.ideaAnalysis,
          settings: state.settings,
          questionIndex: state.currentQuestionIndex,
        }),
      })

      if (!response.ok) throw new Error('Chat API failed')

      const data = await response.json()
      const assistantMsg = { role: 'assistant' as const, content: data.response }
      addMessage(assistantMsg)

      // Speak if TTS enabled
      if (state.settings.ttsEnabled) {
        const msgId = `msg-${Date.now()}-speak`
        await speakText(data.response, msgId)
      }
    } catch {
      // Fallback
      const state2 = useBrainstormerStore.getState()
      const fallback = generateFallbackQuestion(state2.currentQuestionIndex, state2.idea)
      addMessage({ role: 'assistant', content: fallback })
      toast.info('Using offline mode — local fallback')
    } finally {
      setChatLoading(false)
      inputRef.current?.focus()
    }
  }, [input, isChatLoading, addMessage, incrementQuestionIndex, setChatLoading, setActiveTab, speakText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Voice recording ──────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100)
      setRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    useBrainstormerStore.getState().setRecording(false)
  }, [])

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

      const transcription = await new Promise<string>((resolve, reject) => {
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
            resolve(data.text)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('FileReader error'))
        reader.readAsDataURL(blob)
      })

      setInput(transcription)
      toast.success('Transcription complete')
    } catch {
      // Try browser SpeechRecognition as fallback
      tryBrowserSpeechRecognition()
    } finally {
      setIsTranscribing(false)
    }
  }

  const tryBrowserSpeechRecognition = () => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Voice transcription unavailable — try typing instead')
      return
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      toast.success('Transcription complete (browser)')
    }

    recognition.onerror = () => {
      toast.error('Voice transcription failed — try typing instead')
    }

    recognition.start()
    toast.info('Listening... Speak now')
  }

  // ── Toggle TTS ───────────────────────────────────────
  const handleToggleTTS = () => {
    const newValue = !settings.ttsEnabled
    setSettings({ ttsEnabled: newValue })
    if (!newValue) {
      ttsService.stop()
      setSpeaking(false)
      setSpeakingMessageId(null)
    }
    toast.success(newValue ? 'Voice output enabled' : 'Voice output disabled')
  }

  // ── Replay TTS for a specific message ────────────────
  const handleReplay = async (message: ChatMessage) => {
    if (isSpeaking) {
      ttsService.stop()
      setSpeaking(false)
      setSpeakingMessageId(null)
      return
    }
    await speakText(message.content, message.id)
  }

  // ── Progress calculation ─────────────────────────────
  const progressPercent = settings.questionCount > 0
    ? ((currentQuestionIndex) / settings.questionCount) * 100
    : 0

  // ── Cleanup on unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      ttsService.stop()
    }
  }, [])

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ── Top: Progress indicator ── */}
      <div className="px-4 pt-3 pb-2 space-y-2 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">
            Question {Math.min(currentQuestionIndex + 1, settings.questionCount)} of {settings.questionCount}
          </span>
          <div className="flex items-center gap-1.5">
            {settings.researchMode && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-amber-500/30 text-amber-400 bg-amber-500/10"
              >
                <Search className="size-2.5 mr-0.5" />
                Research
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 border-white/10 text-white/60 bg-white/5"
            >
              {settings.llmModel === 'cloud' ? '☁️ Cloud' : '💻 Local'}
            </Badge>
          </div>
        </div>
        <Progress
          value={progressPercent}
          className="h-1.5 bg-white/10 [&>[data-slot=progress-indicator]]:bg-amber-500"
        />
      </div>

      {/* ── Middle: Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && !isChatLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <MessageCircle className="size-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Ready to brainstorm</p>
              <p className="text-xs text-white/40 mt-1">
                {idea
                  ? 'The AI will start asking you questions about your idea'
                  : 'Enter your idea in the Spark tab first'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-black rounded-br-md'
                  : 'bg-white/10 text-white/90 rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>

            {/* Assistant message controls */}
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mt-1 px-1">
                <button
                  onClick={() => handleReplay(msg)}
                  className="flex items-center gap-1 text-[10px] text-white/40 hover:text-amber-400 transition-colors"
                  aria-label={speakingMessageId === msg.id ? 'Stop speaking' : 'Replay with TTS'}
                >
                  {speakingMessageId === msg.id ? (
                    <>
                      {/* Pulsing speaker icon when speaking */}
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-50" />
                        <Volume2 className="size-3 relative" />
                      </span>
                      Speaking...
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3" />
                      Replay
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isChatLoading && (
          <div className="flex items-start">
            <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
              <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
              <span className="size-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Completion message */}
        {showCompletionMsg && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 className="size-4 text-amber-400 animate-spin" />
            <span className="text-xs text-amber-400 font-medium">Generating project files...</span>
          </div>
        )}
      </div>

      {/* ── Bottom: Input area ── */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Microphone / recording button */}
          {isRecording ? (
            <button
              onClick={handleTranscribe}
              className="flex size-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
              aria-label="Stop recording"
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MicOff className="size-4" />
              )}
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex size-9 items-center justify-center rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/5 transition-colors shrink-0"
              aria-label="Start voice recording"
              disabled={isChatLoading || isTranscribing}
            >
              <Mic className="size-4" />
            </button>
          )}

          {/* Recording waveform indicator */}
          {isRecording && <RecordingWaveform />}

          {/* Text input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening...'
                : isTranscribing
                  ? 'Transcribing...'
                  : 'Type your answer...'
            }
            disabled={isChatLoading || isRecording || isTranscribing || qaComplete}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors disabled:opacity-50"
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isChatLoading || !input.trim() || qaComplete}
            size="icon"
            className="size-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-black shrink-0"
          >
            <Send className="size-4" />
          </Button>

          {/* TTS toggle */}
          <button
            onClick={handleToggleTTS}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors shrink-0 ${
              settings.ttsEnabled
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            aria-label={settings.ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
          >
            {settings.ttsEnabled ? (
              <Volume2 className="size-4" />
            ) : (
              <VolumeX className="size-4" />
            )}
          </button>
        </div>

        {/* Transcription indicator */}
        {isTranscribing && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <Loader2 className="size-3 text-amber-400 animate-spin" />
            <span className="text-[10px] text-white/50">Transcribing voice...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Fallback question generator ────────────────────────

function generateFallbackQuestion(index: number, idea: string): string {
  const questions = [
    `Let's explore your idea: "${idea || 'your project'}". What problem does it solve, and who is the primary audience?`,
    `Great start! What makes your approach to "${idea || 'this'}" different from existing solutions?`,
    `Interesting. What are the biggest technical or logistical challenges you foresee?`,
    `Let's think about scope. What would the minimum viable version look like?`,
    `Finally, how will you measure success? What key outcomes are you aiming for?`,
    `If you had to pitch this in 30 seconds, what would you say?`,
    `What resources or partnerships would you need to make this happen?`,
    `How does this fit into the broader landscape of similar projects?`,
    `What's the timeline you're envisioning? Are there any hard deadlines?`,
    `What would make you consider this project a failure? What risks worry you most?`,
  ]

  return questions[index % questions.length]
}
