'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Brain, Mic, MicOff, Sparkles, RotateCcw, Loader2, History, LayoutTemplate, X } from 'lucide-react'
import { useBrainstormerStore } from '@/lib/brainstormer-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ── Types for Web Speech API ─────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

// ── Simple fallback analysis when API is unavailable ──────

function generateLocalAnalysis(idea: string): string {
  return `# Idea Analysis: ${idea}

## Initial Assessment
Your idea has potential! Here's a structured breakdown to help you explore it further.

## Key Questions to Consider
1. **Problem**: What specific problem does this solve?
2. **Audience**: Who is the primary user or beneficiary?
3. **Differentiation**: How is this different from existing solutions?
4. **Feasibility**: What are the main technical or resource challenges?
5. **Value Proposition**: What's the core value in one sentence?

## Suggested Directions
- Start by validating the core assumption with potential users
- Identify the minimum viable version of your idea
- Map out the key features vs nice-to-have features
- Consider potential risks and mitigation strategies

## Next Steps
Let's discuss these questions one by one to refine your idea into something actionable.
`
}

// ── Waveform Animation Component ─────────────────────────

function WaveformBars({ isActive }: { isActive: boolean }) {
  const barCount = 18

  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            height: isActive ? `${12 + Math.random() * 24}px` : '4px',
            backgroundColor: isActive
              ? `rgba(239, 68, 68, ${0.4 + Math.random() * 0.6})`
              : 'rgba(255,255,255,0.15)',
            animation: isActive
              ? `waveformBar ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`
              : 'none',
            animationDelay: isActive ? `${i * 0.05}s` : '0s',
          }}
        />
      ))}
    </div>
  )
}

// ── Get SpeechRecognition constructor ────────────────────

function getSpeechRecognitionAPI(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as Record<string, unknown>
  const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionInstance)
    | undefined
  return SR ?? null
}

// ── SparkTab Component ───────────────────────────────────

export function SparkTab() {
  const {
    idea,
    setIdea,
    startWorkflow,
    setIdeaAnalysis,
    setActiveTab,
    setStage,
    setRecording,
    settings,
    sessions,
    restoreSession,
    deleteSession,
  } = useBrainstormerStore()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRecordingLocal, setIsRecordingLocal] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // ── Voice Input: SpeechRecognition / MediaRecorder ──────

  const startVoiceRecording = useCallback(async () => {
    // Try browser SpeechRecognition API first (better transcription)
    const SpeechRecognitionAPI = getSpeechRecognitionAPI()

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setIdea(transcript)
        }

        recognition.onerror = () => {
          setIsRecordingLocal(false)
          setRecording(false)
          toast.error('Speech recognition failed. Try the mic button for recording.')
        }

        recognition.onend = () => {
          setIsRecordingLocal(false)
          setRecording(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        setIsRecordingLocal(true)
        setRecording(true)
        toast.info('Listening... Speak your idea')
        return
      } catch {
        // Fall through to MediaRecorder approach
      }
    }

    // Fallback: MediaRecorder API
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
      setIsRecordingLocal(true)
      setRecording(true)
      toast.info('Recording... Tap again to stop')
    } catch {
      toast.error('Microphone access denied')
      setIsRecordingLocal(false)
      setRecording(false)
    }
  }, [setIdea, setRecording])

  const stopVoiceRecording = useCallback(async () => {
    // Stop browser SpeechRecognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setIsRecordingLocal(false)
      setRecording(false)
      return
    }

    // Stop MediaRecorder and transcribe
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsRecordingLocal(false)
    setRecording(false)

    // Transcribe the recorded audio
    if (audioChunksRef.current.length === 0) return

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
          if (data.text) {
            setIdea(data.text)
            toast.success('Transcription complete')
          }
        } catch {
          toast.info('Transcription unavailable — type your idea instead')
        } finally {
          setIsTranscribing(false)
        }
      }

      reader.readAsDataURL(blob)
    } catch {
      setIsTranscribing(false)
      toast.error('Failed to process audio')
    }
  }, [setIdea, setRecording])

  // ── Spark It! ──────────────────────────────────────────

  const handleSparkIt = useCallback(async () => {
    const trimmedIdea = idea.trim()
    if (!trimmedIdea) return

    setIsAnalyzing(true)
    startWorkflow(trimmedIdea)

    try {
      const response = await fetch('/api/brainstorm/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: trimmedIdea, settings }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setIdeaAnalysis(data.analysis || data.content || '')
      setStage('chat')
      setActiveTab('chat')
      toast.success('Idea analyzed! Let\'s brainstorm.')
    } catch {
      // Fallback to local analysis
      const localAnalysis = generateLocalAnalysis(trimmedIdea)
      setIdeaAnalysis(localAnalysis)
      setStage('chat')
      setActiveTab('chat')
      toast.info('Using offline analysis — AI unavailable')
    } finally {
      setIsAnalyzing(false)
    }
  }, [idea, settings, startWorkflow, setIdeaAnalysis, setStage, setActiveTab])

  // ── Reset ──────────────────────────────────────────────

  const handleNewIdea = useCallback(() => {
    useBrainstormerStore.getState().resetWorkflow()
    toast('Starting fresh!')
  }, [])

  const isIdeaEmpty = idea.trim().length === 0

  // ── Quick-start templates ──────────────────────────────
  const templates = [
    { label: 'SaaS App', idea: 'A SaaS application that solves [problem] for [audience] with [key feature] as the core value proposition' },
    { label: 'Mobile App', idea: 'A mobile app for [audience] to [action], featuring [key feature] and [secondary feature]' },
    { label: 'API Service', idea: 'A REST/GraphQL API service that provides [capability] with [integration] support and [scaling approach]' },
    { label: 'AI Tool', idea: 'An AI-powered tool that uses [model/approach] to [action] for [audience], differentiating by [unique value]' },
    { label: 'Open Source', idea: 'An open-source [type] project for [community] that improves on [existing solution] by [key advantage]' },
    { label: 'E-commerce', idea: 'An e-commerce platform for [niche] with [unique feature], targeting [market] through [channel]' },
  ]

  const handleTemplate = (tpl: typeof templates[number]) => {
    setIdea(tpl.idea)
    setShowTemplates(false)
    toast.info(`Template applied: ${tpl.label}`)
  }

  const handleRestoreSession = (id: string) => {
    restoreSession(id)
    setShowHistory(false)
    toast.success('Session restored')
  }

  const handleDeleteSession = (id: string) => {
    deleteSession(id)
    toast.success('Session deleted')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 gap-3">
      {/* Glowing brain icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl scale-150" />
        <Brain className="size-10 text-amber-500 relative z-10" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <div className="text-center space-y-0.5">
        <h2 className="text-lg font-bold text-white">What&apos;s your idea?</h2>
        <p className="text-[11px] text-white/50">
          Type or speak your idea to start brainstorming
        </p>
      </div>

      {/* Text input area */}
      <div className="w-full max-w-md space-y-3">
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="I want to build..."
          rows={3}
          className="bg-white/5 border-white/10 text-white/90 text-sm placeholder:text-white/25 resize-none focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
          disabled={isAnalyzing}
        />

        {/* Action row: New | History | Mic | Template | Spark */}
        <div className="flex items-center gap-2">
          {/* New — far left */}
          <button
            onClick={handleNewIdea}
            className="flex flex-col items-center justify-center gap-1 w-11 shrink-0 group"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
              <RotateCcw className="size-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
            </div>
            <span className="text-[9px] text-white/30 group-hover:text-white/60 transition-colors leading-none">New</span>
          </button>

          {/* History — left of mic */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => { setShowHistory(!showHistory); setShowTemplates(false) }}
              className={`flex flex-col items-center justify-center gap-1 w-11 shrink-0 group ${showHistory ? 'z-30' : ''}`}
            >
              <div className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                showHistory
                  ? 'bg-white/10 border-white/20 text-white/80'
                  : 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20'
              }`}>
                <History className={`size-3.5 transition-colors ${showHistory ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'}`} />
              </div>
              <span className={`text-[9px] leading-none transition-colors ${showHistory ? 'text-amber-400' : 'text-white/30 group-hover:text-white/60'}`}>History</span>
            </button>

            {/* History popover */}
            {showHistory && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowHistory(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-30 rounded-lg bg-zinc-800 border border-white/10 shadow-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/10">
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Saved Sessions</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin">
                    {sessions.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <p className="text-[10px] text-white/30">No saved sessions yet</p>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors group/item">
                          <button
                            onClick={() => handleRestoreSession(session.id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-[11px] text-white/80 truncate">{session.idea}</p>
                            <p className="text-[9px] text-white/30">{new Date(session.createdAt).toLocaleDateString()}</p>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="size-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover/item:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mic — center, big and prominent */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <button
              onClick={isRecordingLocal ? stopVoiceRecording : startVoiceRecording}
              className={`relative size-14 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 ${
                isRecordingLocal
                  ? 'bg-red-500 hover:bg-red-400 shadow-red-500/40'
                  : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/30'
              }`}
              aria-label={isRecordingLocal ? 'Stop recording' : 'Start voice input'}
              disabled={isAnalyzing || isTranscribing}
            >
              {/* Pulse ring when recording */}
              {isRecordingLocal && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
              )}
              {isTranscribing ? (
                <Loader2 className="size-6 text-white animate-spin relative z-10" />
              ) : isRecordingLocal ? (
                <MicOff className="size-6 text-white relative z-10" />
              ) : (
                <Mic className="size-6 text-white relative z-10" />
              )}
            </button>
            {isRecordingLocal ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-red-400 font-medium leading-none">Recording</span>
                <WaveformBars isActive />
              </div>
            ) : isTranscribing ? (
              <span className="text-[9px] text-amber-400/70 leading-none">Transcribing...</span>
            ) : (
              <span className="text-[9px] text-white/25 leading-none">Speak</span>
            )}
          </div>

          {/* Template — right of mic */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => { setShowTemplates(!showTemplates); setShowHistory(false) }}
              className={`flex flex-col items-center justify-center gap-1 w-11 shrink-0 group ${showTemplates ? 'z-30' : ''}`}
            >
              <div className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                showTemplates
                  ? 'bg-white/10 border-white/20 text-white/80'
                  : 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20'
              }`}>
                <LayoutTemplate className={`size-3.5 transition-colors ${showTemplates ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'}`} />
              </div>
              <span className={`text-[9px] leading-none transition-colors ${showTemplates ? 'text-amber-400' : 'text-white/30 group-hover:text-white/60'}`}>Template</span>
            </button>

            {/* Templates popover */}
            {showTemplates && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowTemplates(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-30 rounded-lg bg-zinc-800 border border-white/10 shadow-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/10">
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Quick Start Templates</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.label}
                        onClick={() => handleTemplate(tpl)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-[11px] text-white/80 font-medium">{tpl.label}</p>
                        <p className="text-[9px] text-white/30 truncate">{tpl.idea}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Spark — far right */}
          <button
            onClick={handleSparkIt}
            disabled={isIdeaEmpty || isAnalyzing}
            className="flex flex-col items-center justify-center gap-1 w-11 shrink-0 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 group-hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20">
              {isAnalyzing ? (
                <Loader2 className="size-3.5 text-black animate-spin" />
              ) : (
                <Sparkles className="size-3.5 text-black" />
              )}
            </div>
            <span className="text-[9px] text-amber-400/80 group-hover:text-amber-300 transition-colors leading-none font-medium">
              {isAnalyzing ? 'Wait' : 'Spark'}
            </span>
          </button>
        </div>
      </div>

      {/* Waveform animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes waveformBar {
          0% { height: 4px; }
          100% { height: 32px; }
        }
      ` }} />
    </div>
  )
}
