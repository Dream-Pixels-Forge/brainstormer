'use client'

import { useState } from 'react'
import { Sparkles, RotateCcw, Zap } from 'lucide-react'
import { useBrainstormerStore } from '@/lib/brainstormer-store'
import { TEMPLATES, generateLocalBrainstorm } from '@/lib/brainstormer-fallbacks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const personas = ['Writer', 'Designer', 'Developer', 'Marketer', 'Educator', 'Strategist']
const platforms = ['Web', 'Mobile', 'Social', 'Print', 'Email', 'Presentation']
const tones = ['Professional', 'Casual', 'Creative', 'Authoritative', 'Empathetic', 'Humorous']
const formats = ['Blog Post', 'Social Campaign', 'Launch Plan', 'PRD', 'Course Syllabus', 'Technical Spec']

export function PromptBuilder() {
  const {
    promptConfig,
    setPromptConfig,
    resetPromptConfig,
    applyTemplate,
    isGenerating,
    setGenerating,
    setGeneratedContent,
  } = useBrainstormerStore()

  const [localError, setLocalError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!promptConfig.topic.trim()) {
      toast.error('Please enter a topic to brainstorm')
      return
    }

    setGenerating(true)
    setLocalError(null)

    try {
      const response = await fetch('/api/brainstorm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptConfig }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success('Brainstorm generated!')
    } catch {
      // Fallback to local generation
      const fallbackContent = generateLocalBrainstorm(promptConfig)
      setGeneratedContent(fallbackContent)
      toast.info('Using offline mode — AI API unavailable, local fallback applied')
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    resetPromptConfig()
    setLocalError(null)
    toast('Prompt reset')
  }

  const handleTemplateClick = (template: (typeof TEMPLATES)[number]) => {
    applyTemplate(template.config)
    toast.success(`Applied "${template.name}" template`)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Quick-Start Templates */}
        <div>
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            Quick-Start Templates
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.name}
                onClick={() => handleTemplateClick(template)}
                className="flex flex-col items-start gap-1 rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors group"
              >
                <span className="text-xs font-semibold text-white/90 group-hover:text-amber-400 transition-colors">
                  {template.name}
                </span>
                <span className="text-[10px] text-white/40 leading-tight line-clamp-2">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Persona</label>
            <Select
              value={promptConfig.persona}
              onValueChange={(v) => setPromptConfig({ persona: v })}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 text-xs h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {personas.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Platform</label>
            <Select
              value={promptConfig.platform}
              onValueChange={(v) => setPromptConfig({ platform: v })}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 text-xs h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Tone</label>
            <Select
              value={promptConfig.tone}
              onValueChange={(v) => setPromptConfig({ tone: v })}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 text-xs h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Format</label>
            <Select
              value={promptConfig.format}
              onValueChange={(v) => setPromptConfig({ format: v })}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/90 text-xs h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topic input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Topic</label>
          <Input
            value={promptConfig.topic}
            onChange={(e) => setPromptConfig({ topic: e.target.value })}
            placeholder="What do you want to brainstorm about?"
            className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 text-sm"
          />
        </div>

        {/* Custom instructions */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60">Custom Instructions</label>
          <Textarea
            value={promptConfig.customInstructions}
            onChange={(e) => setPromptConfig({ customInstructions: e.target.value })}
            placeholder="Any additional context or requirements..."
            rows={3}
            className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 text-sm resize-none"
          />
        </div>

        {/* Error display */}
        {localError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {localError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !promptConfig.topic.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="size-4" />
                Generate
              </span>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
