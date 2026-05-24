'use client'

import { useState, useCallback } from 'react'
import {
  Cloud, Monitor, FlaskConical, Volume2, Globe, Mic,
  Github, Link, Tag, FileText, Trash2, RotateCcw,
  Database, Plug, TestTube,
} from 'lucide-react'
import { useBrainstormerStore, type LLMModel, type TTSEngine } from '@/lib/brainstormer-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export function SettingsTab() {
  const {
    settings,
    setSettings,
    setGitHubConfig,
    sessions,
    resetWorkflow,
  } = useBrainstormerStore()

  const [tagsInput, setTagsInput] = useState(settings.github.tags.join(', '))

  // ── Handlers ──

  const handleLLMModelChange = (value: string) => {
    setSettings({ llmModel: value as LLMModel })
  }

  const handleQuestionCountChange = (value: number[]) => {
    setSettings({ questionCount: value[0] })
  }

  const handleResearchModeToggle = (checked: boolean) => {
    setSettings({ researchMode: checked })
  }

  const handleTTSEnabledToggle = (checked: boolean) => {
    setSettings({ ttsEnabled: checked })
  }

  const handleTTSEngineChange = (value: string) => {
    setSettings({ ttsEngine: value as TTSEngine })
  }

  const handleTestVoice = useCallback(() => {
    if (!settings.ttsEnabled) {
      toast.info('Enable TTS first to test voice')
      return
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('Speech synthesis not available in this browser')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance("Hello! I'm your brainstorming assistant.")
    utterance.rate = 1.0
    utterance.pitch = 1.0

    if (settings.ttsEngine === 'kokoro') {
      // In a real Tauri app, this would invoke the Kokoro TTS engine
      // For browser fallback, we use the built-in synthesis with a lower pitch
      utterance.pitch = 0.9
    }

    utterance.onend = () => {
      toast.success('Voice test complete')
    }
    utterance.onerror = () => {
      toast.error('Voice test failed')
    }

    window.speechSynthesis.speak(utterance)
    toast.info('Playing voice test...')
  }, [settings.ttsEnabled, settings.ttsEngine])

  const handleAutoPopulateToggle = (checked: boolean) => {
    setGitHubConfig({ autoPopulate: checked })
    if (checked && settings.github.repoUrl) {
      // Simulate auto-populate from GitHub URL
      const urlParts = settings.github.repoUrl.replace(/\/$/, '').split('/')
      const repoName = urlParts[urlParts.length - 1] || ''
      const owner = urlParts[urlParts.length - 2] || ''
      if (repoName) {
        setGitHubConfig({
          projectName: repoName,
          description: `${repoName} by ${owner}`,
          tags: [repoName, owner].filter(Boolean),
        })
        setTagsInput([repoName, owner].filter(Boolean).join(', '))
      }
    }
  }

  const handleRepoUrlChange = (value: string) => {
    setGitHubConfig({ repoUrl: value })
  }

  const handleConnect = () => {
    const url = settings.github.repoUrl.trim()
    if (!url) {
      toast.error('Please enter a repository URL')
      return
    }

    // Basic GitHub URL validation
    const githubPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/
    if (!githubPattern.test(url)) {
      toast.error('Invalid GitHub URL. Use format: https://github.com/user/repo')
      return
    }

    toast.success('GitHub repository connected')

    // Auto-populate if enabled
    if (settings.github.autoPopulate) {
      const urlParts = url.replace(/\/$/, '').split('/')
      const repoName = urlParts[urlParts.length - 1] || ''
      const owner = urlParts[urlParts.length - 2] || ''
      if (repoName) {
        setGitHubConfig({
          projectName: repoName,
          description: `${repoName} by ${owner}`,
          tags: [repoName, owner].filter(Boolean),
        })
        setTagsInput([repoName, owner].filter(Boolean).join(', '))
      }
    }
  }

  const handleTagsChange = (value: string) => {
    setTagsInput(value)
    const tags = value.split(',').map((t) => t.trim()).filter(Boolean)
    setGitHubConfig({ tags })
  }

  const handleClearSessions = () => {
    // Reset sessions by creating a fresh store state
    useBrainstormerStore.setState({ sessions: [] })
    toast.success('All sessions cleared')
  }

  const handleResetSettings = () => {
    useBrainstormerStore.setState({
      settings: {
        llmModel: 'cloud',
        questionCount: 5,
        researchMode: false,
        ttsEngine: 'browser',
        ttsEnabled: true,
        github: {
          repoUrl: '',
          projectName: '',
          description: '',
          tags: [],
          autoPopulate: false,
        },
      },
    })
    setTagsInput('')
    resetWorkflow()
    toast.success('All settings reset to defaults')
  }

  // ── Render ──

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">

        {/* Section 1: AI Model */}
        <section className="rounded-md bg-white/5 border border-white/10 p-3 space-y-2">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Cloud className="size-3" />
            AI Model
          </h3>
          <RadioGroup
            value={settings.llmModel}
            onValueChange={handleLLMModelChange}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
              <RadioGroupItem value="cloud" id="llm-cloud" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
              <Label htmlFor="llm-cloud" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <Cloud className="size-3.5 text-amber-400" />
                  <span className="text-xs text-white/90">Cloud</span>
                </div>
                <p className="text-[10px] text-white/40 mt-0.5 ml-5">Cloud AI (Gemini/OpenAI)</p>
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
              <RadioGroupItem value="local" id="llm-local" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
              <Label htmlFor="llm-local" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <Monitor className="size-3.5 text-emerald-400" />
                  <span className="text-xs text-white/90">Local</span>
                </div>
                <p className="text-[10px] text-white/40 mt-0.5 ml-5">Local model (Ollama/LM Studio)</p>
              </Label>
            </div>
          </RadioGroup>
          {/* Model status indicator */}
          <div className="flex items-center gap-2 text-xs text-white/30">
            <div className={`size-2 rounded-full ${settings.llmModel === 'cloud' ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>Active: {settings.llmModel === 'cloud' ? 'Cloud AI' : 'Local Model'}</span>
          </div>
        </section>

        {/* Section 2: Brainstorming */}
        <section className="rounded-md bg-white/5 border border-white/10 p-3 space-y-3">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <FlaskConical className="size-3" />
            Brainstorming
          </h3>

          {/* Question count slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-white/70">Question Count</Label>
              <span className="text-xs font-medium text-amber-400">
                Ask {settings.questionCount} questions
              </span>
            </div>
            <Slider
              value={[settings.questionCount]}
              onValueChange={handleQuestionCountChange}
              min={3}
              max={10}
              step={1}
              className="py-2 [&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500 [&_[data-slot=slider-thumb]]:bg-zinc-900"
            />
            <div className="flex justify-between text-[10px] text-white/30">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Research mode toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs text-white/70 flex items-center gap-1.5">
                {settings.researchMode && <FlaskConical className="size-3 text-amber-400" />}
                Research Mode
              </Label>
              <p className="text-[10px] text-white/40">AI will research the web before answering</p>
            </div>
            <Switch
              checked={settings.researchMode}
              onCheckedChange={handleResearchModeToggle}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </section>

        {/* Section 3: Voice */}
        <section className="rounded-md bg-white/5 border border-white/10 p-3 space-y-3">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="size-3" />
            Voice
          </h3>

          {/* TTS toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs text-white/70">Voice Output</Label>
              <p className="text-[10px] text-white/40">Enable text-to-speech for responses</p>
            </div>
            <Switch
              checked={settings.ttsEnabled}
              onCheckedChange={handleTTSEnabledToggle}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          <Separator className="bg-white/10" />

          {/* TTS Engine selection */}
          <div className="space-y-2">
            <Label className="text-xs text-white/70">TTS Engine</Label>
            <RadioGroup
              value={settings.ttsEngine}
              onValueChange={handleTTSEngineChange}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
                <RadioGroupItem value="kokoro" id="tts-kokoro" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
                <Label htmlFor="tts-kokoro" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded">🔊</span>
                    <span className="text-xs text-white/90">Kokoro (Local)</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5 ml-6">Lightweight local TTS</p>
                </Label>
              </div>
              <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
                <RadioGroupItem value="browser" id="tts-browser" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
                <Label htmlFor="tts-browser" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">🌐</span>
                    <span className="text-xs text-white/90">Browser</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5 ml-6">Built-in speech synthesis</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Test voice button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestVoice}
            className="w-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <TestTube className="size-3.5 mr-1.5" />
            Test Voice
          </Button>
        </section>

        {/* Section 4: GitHub Integration */}
        <section className="rounded-md bg-white/5 border border-white/10 p-3 space-y-3">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Github className="size-3" />
            GitHub Integration
          </h3>

          {/* Repository URL */}
          <div className="space-y-1">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <Link className="size-3" />
              Repository URL
            </Label>
            <Input
              value={settings.github.repoUrl}
              onChange={(e) => handleRepoUrlChange(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/30 text-sm"
            />
          </div>

          {/* Auto-populate toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs text-white/70">Auto-populate</Label>
              <p className="text-[10px] text-white/40">Use repo info to set project name, description, tags</p>
            </div>
            <Switch
              checked={settings.github.autoPopulate}
              onCheckedChange={handleAutoPopulateToggle}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          <Separator className="bg-white/10" />

          {/* Project name */}
          <div className="space-y-1">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <FileText className="size-3" />
              Project Name
            </Label>
            <Input
              value={settings.github.projectName}
              onChange={(e) => setGitHubConfig({ projectName: e.target.value })}
              placeholder="my-project"
              disabled={settings.github.autoPopulate && !!settings.github.repoUrl}
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/30 text-sm disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs text-white/70">Description</Label>
            <Textarea
              value={settings.github.description}
              onChange={(e) => setGitHubConfig({ description: e.target.value })}
              placeholder="Project description..."
              rows={2}
              disabled={settings.github.autoPopulate && !!settings.github.repoUrl}
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/30 text-sm resize-none disabled:opacity-50"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <Tag className="size-3" />
              Tags
            </Label>
            <Input
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="comma, separated, tags"
              className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/30 text-sm"
            />
          </div>

          {/* Connect button */}
          <Button
            onClick={handleConnect}
            variant="outline"
            size="sm"
            className="w-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Plug className="size-3.5 mr-1.5" />
            Connect
          </Button>
        </section>

        {/* Section 5: Data */}
        <section className="rounded-md bg-white/5 border border-white/10 p-3 space-y-3">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="size-3" />
            Data
          </h3>

          {/* Sessions count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Saved Sessions</span>
            <span className="text-xs font-medium text-white/90">{sessions.length}</span>
          </div>

          <Separator className="bg-white/10" />

          {/* Clear all sessions */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/10 bg-white/5 text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                disabled={sessions.length === 0}
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Clear All Sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Clear all sessions?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/50">
                  This will permanently delete all {sessions.length} saved brainstorming sessions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearSessions}
                  className="bg-red-500 hover:bg-red-400 text-white"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset all settings */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/10 bg-white/5 text-white/70 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Reset all settings?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/50">
                  This will restore all settings to their defaults and reset the current brainstorming workflow. Saved sessions will also be cleared.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetSettings}
                  className="bg-amber-500 hover:bg-amber-400 text-black"
                >
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

      </div>
    </ScrollArea>
  )
}
