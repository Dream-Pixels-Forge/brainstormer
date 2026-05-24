'use client'

import { useState, useCallback } from 'react'
import {
  Cloud, Monitor, FlaskConical, Volume2,
  Github, Link, Tag, FileText, Trash2, RotateCcw,
  Database, Plug, TestTube, Key, Eye, EyeOff, Server,
} from 'lucide-react'
import { useBrainstormerStore, type LLMModel, type TTSEngine, type CloudModel, type LocalModel } from '@/lib/brainstormer-store'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// ── Model options ──────────────────────────────────────────

const CLOUD_MODELS: { value: CloudModel; label: string; provider: string }[] = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', provider: 'Anthropic' },
  { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4', provider: 'Anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
]

const CUSTOM_VALUE = '__custom__'

export function SettingsTab() {
  const {
    settings,
    setSettings,
    setGitHubConfig,
    sessions,
    resetWorkflow,
  } = useBrainstormerStore()

  const [tagsInput, setTagsInput] = useState(settings.github.tags.join(', '))
  const [showCloudKey, setShowCloudKey] = useState(false)
  const [showLocalKey, setShowLocalKey] = useState(false)

  // ── Dynamic Ollama models ──
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [ollamaError, setOllamaError] = useState<string | null>(null)

  const fetchOllamaModels = useCallback(async (endpoint: string) => {
    setIsLoadingModels(true)
    setOllamaError(null)
    try {
      const res = await fetch(`/api/ollama/models?endpoint=${encodeURIComponent(endpoint)}`)
      const data = await res.json()
      if (data.error) {
        setOllamaError(data.error)
        setOllamaModels([])
      } else {
        setOllamaModels(data.models || [])
        setOllamaError(null)
      }
    } catch {
      setOllamaError('Failed to fetch models')
      setOllamaModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }, [])

  // Fetch models when local mode is active or endpoint changes
  const handleLocalEndpointChange = (value: string) => {
    setSettings({ localEndpoint: value })
    // Debounce: fetch after user stops typing (simple approach)
  }

  const handleRefreshModels = () => {
    fetchOllamaModels(settings.localEndpoint)
  }

  // Auto-fetch when switching to local mode
  const handleLLMModelChange = (value: string) => {
    setSettings({ llmModel: value as LLMModel })
    if (value === 'local' && ollamaModels.length === 0) {
      fetchOllamaModels(settings.localEndpoint)
    }
  }

  // Resolve the dropdown value: if model is a custom name not in ollamaModels, show as custom
  const localDropdownValue = (() => {
    if (!settings.localModel) return ''
    if (settings.localModel === CUSTOM_VALUE) return CUSTOM_VALUE
    if (ollamaModels.includes(settings.localModel)) return settings.localModel
    // If we have models loaded and current selection isn't among them → custom
    if (ollamaModels.length > 0) return CUSTOM_VALUE
    // No models loaded yet → show as-is (might be from persisted state)
    return settings.localModel
  })()

  // ── Handlers ──

  const handleCloudModelChange = (value: string) => {
    setSettings({ cloudModel: value as CloudModel })
  }

  const handleLocalModelChange = (value: string) => {
    if (value === CUSTOM_VALUE) {
      // Switch to custom mode — keep existing custom model name if any
      setSettings({ localModel: settings.localCustomModel || '' })
    } else {
      setSettings({ localModel: value })
    }
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

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance("Hello! I'm your brainstorming assistant.")
    utterance.rate = 1.0
    utterance.pitch = 1.0

    if (settings.ttsEngine === 'kokoro') {
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

    const githubPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/
    if (!githubPattern.test(url)) {
      toast.error('Invalid GitHub URL. Use format: https://github.com/user/repo')
      return
    }

    toast.success('GitHub repository connected')

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
    useBrainstormerStore.setState({ sessions: [] })
    toast.success('All sessions cleared')
  }

  const handleResetSettings = () => {
    useBrainstormerStore.setState({
      settings: {
        llmModel: 'cloud',
        cloudApiKey: '',
        cloudModel: 'claude-sonnet-4-20250514',
        localApiKey: '',
        localModel: '',
        localEndpoint: 'http://localhost:11434',
        localCustomModel: '',
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
    setOllamaModels([])
    setOllamaError(null)
    resetWorkflow()
    toast.success('All settings reset to defaults')
  }

  // ── Helper: model display name ──
  const getModelDisplay = () => {
    if (settings.llmModel === 'cloud') {
      return CLOUD_MODELS.find(m => m.value === settings.cloudModel)?.label ?? settings.cloudModel
    }
    if (localDropdownValue === CUSTOM_VALUE && settings.localCustomModel) {
      return settings.localCustomModel
    }
    return settings.localModel || 'No model selected'
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

          {/* Cloud / Local radio */}
          <RadioGroup
            value={settings.llmModel}
            onValueChange={handleLLMModelChange}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
              <RadioGroupItem value="cloud" id="llm-cloud" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
              <Label htmlFor="llm-cloud" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <Cloud className="size-3.5 text-amber-400" />
                  <span className="text-xs text-white/90">Cloud</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded bg-white/5 p-2 border border-white/5 hover:border-white/10 transition-colors">
              <RadioGroupItem value="local" id="llm-local" className="border-white/30 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500" />
              <Label htmlFor="llm-local" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <Monitor className="size-3.5 text-emerald-400" />
                  <span className="text-xs text-white/90">Local</span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Separator className="bg-white/10" />

          {/* ── Cloud settings (shown when cloud selected) ── */}
          {settings.llmModel === 'cloud' && (
            <div className="space-y-2">
              {/* Cloud model dropdown */}
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50 uppercase tracking-wider">Model</Label>
                <Select value={settings.cloudModel} onValueChange={handleCloudModelChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white/90 text-xs h-8 focus:border-amber-500/50 focus:ring-amber-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-white/10">
                    {CLOUD_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value} className="text-xs text-white/80 focus:bg-white/10 focus:text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40">{model.provider}</span>
                          <span>{model.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cloud API key */}
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Key className="size-2.5" />
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showCloudKey ? 'text' : 'password'}
                    value={settings.cloudApiKey}
                    onChange={(e) => setSettings({ cloudApiKey: e.target.value })}
                    placeholder="sk-ant-... or sk-..."
                    className="bg-white/5 border-white/10 text-white/90 text-xs h-8 pr-8 placeholder:text-white/20 focus:border-amber-500/50 focus:ring-amber-500/30"
                  />
                  <button
                    onClick={() => setShowCloudKey(!showCloudKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    type="button"
                  >
                    {showCloudKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-white/25">Required for Claude, GPT-4o, Gemini</p>
              </div>
            </div>
          )}

          {/* ── Local settings (shown when local selected) ── */}
          {settings.llmModel === 'local' && (
            <div className="space-y-2">
              {/* Local endpoint (shown first so models can be fetched) */}
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Server className="size-2.5" />
                  Endpoint
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={settings.localEndpoint}
                    onChange={(e) => handleLocalEndpointChange(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1 bg-white/5 border-white/10 text-white/90 text-xs h-8 placeholder:text-white/20 focus:border-amber-500/50 focus:ring-amber-500/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshModels}
                    disabled={isLoadingModels}
                    className="shrink-0 border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white h-8 px-2"
                  >
                    <RotateCcw className={`size-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-[9px] text-white/25">Ollama default: http://localhost:11434</p>
              </div>

              {/* Local model dropdown (dynamic from Ollama) */}
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50 uppercase tracking-wider">Model</Label>
                {ollamaError && (
                  <p className="text-[9px] text-red-400/70 flex items-center gap-1">
                    <span>⚠ {ollamaError}</span>
                  </p>
                )}
                {isLoadingModels ? (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md h-8 px-3">
                    <RotateCcw className="size-3 animate-spin text-white/40" />
                    <span className="text-xs text-white/40">Loading models...</span>
                  </div>
                ) : ollamaModels.length > 0 ? (
                  <Select value={localDropdownValue} onValueChange={handleLocalModelChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white/90 text-xs h-8 focus:border-amber-500/50 focus:ring-amber-500/30">
                      <SelectValue placeholder="Select a model..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-white/10 max-h-48">
                      {ollamaModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs text-white/80 focus:bg-white/10 focus:text-white">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="size-3 text-emerald-400/60" />
                            <span>{model}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_VALUE} className="text-xs text-amber-400/80 focus:bg-white/10 focus:text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <span>✏️</span>
                          <span>Custom...</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={settings.localModel}
                      onChange={(e) => setSettings({ localModel: e.target.value })}
                      placeholder="Model name (e.g. llama3.1)"
                      className="bg-white/5 border-white/10 text-white/90 text-xs h-8 placeholder:text-white/20 focus:border-amber-500/50 focus:ring-amber-500/30"
                    />
                    <p className="text-[9px] text-white/25">Click ↻ to fetch models from your Ollama server</p>
                  </div>
                )}
              </div>

              {/* Custom model name (when custom selected from dropdown) */}
              {ollamaModels.length > 0 && localDropdownValue === CUSTOM_VALUE && (
                <div className="space-y-1">
                  <Label className="text-[10px] text-white/50 uppercase tracking-wider">Custom Model Name</Label>
                  <Input
                    value={settings.localCustomModel}
                    onChange={(e) => {
                      setSettings({ localCustomModel: e.target.value, localModel: e.target.value })
                    }}
                    placeholder="my-model:latest"
                    className="bg-white/5 border-white/10 text-white/90 text-xs h-8 placeholder:text-white/20 focus:border-amber-500/50 focus:ring-amber-500/30"
                  />
                </div>
              )}

              {/* Local API key (optional) */}
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Key className="size-2.5" />
                  API Key
                  <span className="text-amber-400/50">(optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showLocalKey ? 'text' : 'password'}
                    value={settings.localApiKey}
                    onChange={(e) => setSettings({ localApiKey: e.target.value })}
                    placeholder="Only if your local server requires it"
                    className="bg-white/5 border-white/10 text-white/90 text-xs h-8 pr-8 placeholder:text-white/20 focus:border-amber-500/50 focus:ring-amber-500/30"
                  />
                  <button
                    onClick={() => setShowLocalKey(!showLocalKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    type="button"
                  >
                    {showLocalKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Model status indicator */}
          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <div className={`size-2 rounded-full ${settings.llmModel === 'cloud' ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>Active: {getModelDisplay()}</span>
            {settings.llmModel === 'cloud' && !settings.cloudApiKey && (
              <span className="text-red-400/70">⚠ No API key</span>
            )}
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
