'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, Copy, ChevronDown, ChevronUp, FileText,
  RefreshCw, Sparkles, Github, RotateCcw, Loader2,
} from 'lucide-react'
import { useBrainstormerStore, type ProjectFile } from '@/lib/brainstormer-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from 'sonner'

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

function buildLocalFallbackFiles(idea: string): ProjectFile[] {
  return [
    {
      filename: 'idea.md',
      description: 'Core idea and vision',
      content: `# ${idea}\n\n## Vision\nA comprehensive exploration of the core concept, its potential impact, and the value it brings to users.\n\n## Problem Statement\nThis project addresses key challenges in the domain, providing innovative solutions that simplify workflows and enhance user experience.\n\n## Goals\n1. Deliver measurable value to target users\n2. Build with scalability and maintainability in mind\n3. Create a delightful and intuitive user experience\n`,
    },
    {
      filename: 'tasks.md',
      description: 'Task breakdown and priorities',
      content: `# Tasks — ${idea}\n\n## Priority 1 — Foundation\n- [ ] Define core data models and schemas\n- [ ] Set up project structure and tooling\n- [ ] Implement authentication and authorization\n- [ ] Create base UI component library\n\n## Priority 2 — Core Features\n- [ ] Build primary user workflow end-to-end\n- [ ] Implement data persistence layer\n- [ ] Add real-time updates and notifications\n- [ ] Create dashboard and analytics views\n\n## Priority 3 — Polish & Launch\n- [ ] Write comprehensive tests\n- [ ] Performance optimization and caching\n- [ ] Documentation and onboarding flow\n- [ ] Deployment pipeline and monitoring\n`,
    },
    {
      filename: 'plan.md',
      description: 'Implementation roadmap',
      content: `# Implementation Plan — ${idea}\n\n## Phase 1: Discovery & Design (Week 1-2)\n- User research and competitive analysis\n- Wireframes and user flow diagrams\n- Technical architecture decisions\n- API contract definitions\n\n## Phase 2: MVP Development (Week 3-5)\n- Core feature implementation\n- Database setup and migrations\n- Frontend component development\n- Integration testing\n\n## Phase 3: Enhancement & Polish (Week 6-7)\n- Performance optimization\n- Error handling and edge cases\n- UX refinements based on feedback\n- Documentation\n\n## Phase 4: Launch & Iteration (Week 8+)\n- Deployment to production\n- Monitoring and analytics setup\n- User feedback collection\n- Iterative improvements\n`,
    },
    {
      filename: 'progress.md',
      description: 'Progress tracking template',
      content: `# Progress Tracker — ${idea}\n\n## Status Overview\n| Phase | Status | Completion |\n|-------|--------|------------|\n| Discovery | Not Started | 0% |\n| Design | Not Started | 0% |\n| Development | Not Started | 0% |\n| Testing | Not Started | 0% |\n| Launch | Not Started | 0% |\n\n## Daily Log\n### Day 1\n- [ ] Tasks completed today\n- [ ] Blockers encountered\n- [ ] Plan for tomorrow\n`,
    },
    {
      filename: 'design.md',
      description: 'Design decisions and guidelines',
      content: `# Design Decisions — ${idea}\n\n## Design Principles\n1. **Clarity** — Every element should communicate its purpose instantly\n2. **Consistency** — Uniform patterns reduce cognitive load\n3. **Feedback** — Every action gets a visible response\n4. **Efficiency** — Minimize steps to complete any task\n\n## Visual Language\n- **Color palette**: Amber/orange accent on dark backgrounds\n- **Typography**: System font stack for performance\n- **Spacing**: 4px base grid with consistent component padding\n- **Motion**: Subtle transitions (150-300ms) for state changes\n`,
    },
    {
      filename: 'architecture.md',
      description: 'Technical architecture overview',
      content: `# Technical Architecture — ${idea}\n\n## System Overview\nA modern web application built on proven, scalable technologies.\n\n## Tech Stack\n- **Frontend**: React/Next.js with TypeScript\n- **Backend**: Next.js API routes / Node.js services\n- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM\n- **Real-time**: WebSocket / Socket.io for live updates\n- **Deployment**: Docker containers with CI/CD pipeline\n\n## Data Flow\n1. User interacts with React components\n2. Client state managed by Zustand store\n3. API calls via fetch with error boundaries\n4. Server processes requests through API routes\n5. Database queries via Prisma ORM\n6. Real-time updates via WebSocket connection\n`,
    },
    {
      filename: 'agents.md',
      description: 'AI agent configurations',
      content: `# AI Agent Configurations — ${idea}\n\n## Agent: Code Reviewer\n- **Trigger**: On pull request creation\n- **Model**: Cloud LLM\n- **Instructions**: Review code for bugs, style, performance.\n\n## Agent: Documentation Writer\n- **Trigger**: On feature completion\n- **Model**: Cloud LLM\n- **Instructions**: Generate API docs and usage examples.\n\n## Agent: Test Generator\n- **Trigger**: On code change detection\n- **Model**: Cloud LLM\n- **Instructions**: Generate unit and integration tests.\n`,
    },
    {
      filename: 'claude.md',
      description: 'Claude Code instructions',
      content: `# Claude Code Instructions — ${idea}\n\n## Project Context\nThis project helps users explore and refine ideas through AI-powered Q&A sessions.\n\n## Code Style\n- TypeScript with strict mode enabled\n- Functional components with hooks\n- Named exports preferred\n- Use path aliases (@/ for src/)\n- shadcn/ui for UI components\n- Tailwind CSS for styling\n\n## Architecture\n- Next.js App Router with API routes\n- Zustand for client state management\n- Prisma ORM for database access\n\n## Conventions\n- File naming: kebab-case for files, PascalCase for components\n- Each API route in its own directory with route.ts\n- Conventional commits: feat:, fix:, docs:, chore:\n`,
    },
  ]
}

function FileCard({ file, onDownload, onCopy }: { file: ProjectFile; onDownload: (f: ProjectFile) => void; onCopy: (f: ProjectFile) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md bg-white/5 border border-white/10 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 p-2">
        <FileText className="size-3.5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/90 truncate">{file.filename}</p>
          <p className="text-[10px] text-white/40 truncate">{file.description}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onCopy(file)}
            className="flex size-6 items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={`Copy ${file.filename}`}
          >
            <Copy className="size-3" />
          </button>
          <button
            onClick={() => onDownload(file)}
            className="flex size-6 items-center justify-center rounded text-white/40 hover:text-amber-400 hover:bg-white/10 transition-colors"
            aria-label={`Download ${file.filename}`}
          >
            <Download className="size-3" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex size-6 items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>
      {/* Preview content */}
      {expanded && (
        <div className="border-t border-white/10 px-2 py-1.5">
          <pre className="text-[10px] text-white/60 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-40 overflow-y-auto">
            {file.content}
          </pre>
        </div>
      )}
    </div>
  )
}

export function ExportTab() {
  const {
    projectFiles,
    isGeneratingFiles,
    idea,
    messages,
    settings,
    setProjectFiles,
    setGeneratingFiles,
    setActiveTab,
    resetWorkflow,
  } = useBrainstormerStore()

  const [hasAutoGenerated, setHasAutoGenerated] = useState(false)

  // Auto-generate files when tab opens with messages but no files
  const generateFiles = useCallback(async () => {
    if (!idea || messages.length === 0) return

    setGeneratingFiles(true)
    try {
      const response = await fetch('/api/brainstorm/generate-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, messages, settings }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        setProjectFiles(data.files)
        if (data.fallback) {
          toast.info('Using local fallback — generated template files')
        } else {
          toast.success(`${data.files.length} project files generated`)
        }
      } else {
        throw new Error('Invalid response')
      }
    } catch {
      // Local fallback
      const fallbackFiles = buildLocalFallbackFiles(idea)
      setProjectFiles(fallbackFiles)
      toast.info('API unavailable — using local template files')
    } finally {
      setGeneratingFiles(false)
    }
  }, [idea, messages, settings, setProjectFiles, setGeneratingFiles])

  useEffect(() => {
    if (!hasAutoGenerated && projectFiles.length === 0 && messages.length > 0 && idea) {
      setHasAutoGenerated(true)
      generateFiles()
    }
  }, [hasAutoGenerated, projectFiles.length, messages.length, idea, generateFiles])

  const handleRegenerate = () => {
    setHasAutoGenerated(false)
    setProjectFiles([])
    // Small delay then regenerate
    setTimeout(() => {
      setHasAutoGenerated(true)
      generateFiles()
    }, 100)
  }

  const handleCopyFile = async (file: ProjectFile) => {
    try {
      await navigator.clipboard.writeText(file.content)
      toast.success(`Copied ${file.filename}`)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const browserDownloadFile = (file: ProjectFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadFile = async (file: ProjectFile) => {
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const savedPath = await invoke<string>('save_file', {
          content: file.content,
          filename: file.filename,
        })
        toast.success(`Saved to ${savedPath}`)
      } catch (err) {
        if (err === 'Cancelled') return
        browserDownloadFile(file)
      }
      return
    }
    browserDownloadFile(file)
  }

  const handleDownloadAll = async () => {
    if (projectFiles.length === 0) return

    if (isTauri()) {
      // In Tauri, save each file using native dialog
      for (const file of projectFiles) {
        await handleDownloadFile(file)
      }
      return
    }

    // Browser: download each file individually
    for (const file of projectFiles) {
      browserDownloadFile(file)
      // Small delay between downloads to prevent browser blocking
      await new Promise((r) => setTimeout(r, 200))
    }
    toast.success(`Downloaded ${projectFiles.length} files`)
  }

  const handlePushToGitHub = () => {
    if (!settings.github.repoUrl) {
      toast.error('GitHub repository not configured. Go to Settings to set it up.')
      return
    }
    toast.info('GitHub push is not yet implemented. Configure in Settings.')
  }

  // ── Render ──

  // Status section content
  const renderStatus = () => {
    if (isGeneratingFiles) {
      return (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Loader2 className="size-3.5 text-amber-400 animate-spin" />
          <span className="text-xs text-amber-300">Generating project files...</span>
        </div>
      )
    }

    if (projectFiles.length > 0) {
      return (
        <div className="flex items-center justify-between p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-300">✨ {projectFiles.length} files generated</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGeneratingFiles}
            className="text-white/50 hover:text-white hover:bg-white/10 h-7 px-2 text-xs"
          >
            <RefreshCw className="size-3 mr-1" />
            Regenerate
          </Button>
        </div>
      )
    }

    // No files and not generating
    return (
      <div className="flex items-center justify-between p-2.5 rounded-md bg-white/5 border border-white/10">
        <span className="text-xs text-white/50">Complete the Q&A first</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('spark')}
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2 text-xs"
        >
          <Sparkles className="size-3 mr-1" />
          Go to Spark
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top — Status */}
      <div className="px-3 pt-3 pb-1.5 shrink-0">
        {renderStatus()}
      </div>

      {/* Middle — File list */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 pb-3">
          {projectFiles.map((file) => (
            <FileCard
              key={file.filename}
              file={file}
              onDownload={handleDownloadFile}
              onCopy={handleCopyFile}
            />
          ))}

          {projectFiles.length === 0 && !isGeneratingFiles && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2 min-h-[180px]">
              <div className="size-9 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="size-4 text-white/20" />
              </div>
              <div>
                <p className="text-xs text-white/50">No project files yet</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  Complete the brainstorming Q&A to generate files
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom — Actions */}
      <div className="border-t border-white/10 p-2 flex gap-1.5 shrink-0">
        <Button
          onClick={handleDownloadAll}
          disabled={projectFiles.length === 0 || isGeneratingFiles}
          size="sm"
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50"
        >
          <Download className="size-3.5" />
          Download All
        </Button>

        {settings.github.repoUrl ? (
          <Button
            onClick={handlePushToGitHub}
            disabled={projectFiles.length === 0 || isGeneratingFiles}
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <Github className="size-3.5" />
            Push
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  disabled
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white/30 disabled:opacity-50"
                >
                  <Github className="size-3.5" />
                  Push
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-zinc-800 text-white/70 text-xs border-white/10">
              Configure GitHub repo in Settings
            </TooltipContent>
          </Tooltip>
        )}

        <Button
          onClick={resetWorkflow}
          variant="outline"
          size="sm"
          className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          New
        </Button>
      </div>
    </div>
  )
}
