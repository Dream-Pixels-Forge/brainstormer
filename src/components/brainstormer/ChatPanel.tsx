'use client'

import { useRef, useEffect, useState } from 'react'
import { ArrowUp, Mic, Sparkles } from 'lucide-react'
import { useBrainstormerStore, type ChatMessage } from '@/lib/brainstormer-store'
import { generateLocalChatResponse } from '@/lib/brainstormer-fallbacks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

export function ChatPanel() {
  const {
    messages,
    isChatLoading,
    promptConfig,
    addMessage,
    setChatLoading,
    setActiveTab,
    setGeneratedContent,
  } = useBrainstormerStore()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isChatLoading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isChatLoading) return

    setInput('')
    addMessage({ role: 'user', content: text })
    setChatLoading(true)

    try {
      const response = await fetch('/api/brainstorm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user' as const, content: text }], promptConfig }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      addMessage({ role: 'assistant', content: data.response })
    } catch {
      // Fallback to local generation
      const fallbackResponse = generateLocalChatResponse(
        text,
        promptConfig.persona,
        promptConfig.topic
      )
      addMessage({ role: 'assistant', content: fallbackResponse })
      toast.info('Using offline mode — local fallback response')
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleUseInGeneration = (content: string) => {
    setGeneratedContent(content)
    setActiveTab('export')
    toast.success('Content set for export')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="size-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Start brainstorming</p>
              <p className="text-xs text-white/40 mt-1">Ask questions, explore ideas, or refine concepts</p>
            </div>
          </div>
        )}

        {messages.map((msg: ChatMessage) => (
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
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            {msg.role === 'assistant' && (
              <button
                onClick={() => handleUseInGeneration(msg.content)}
                className="mt-1 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors px-1"
              >
                Use in generation
              </button>
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
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('voice')}
            className="flex size-9 items-center justify-center rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/5 transition-colors shrink-0"
            aria-label="Voice input"
          >
            <Mic className="size-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isChatLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={isChatLoading || !input.trim()}
            size="icon"
            className="size-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-black shrink-0"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
