'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────

export type WidgetTab = 'spark' | 'chat' | 'export' | 'settings'
export type WorkflowStage = 'spark' | 'analyzing' | 'chat' | 'generating' | 'export'
export type LLMModel = 'cloud' | 'local'
export type TTSEngine = 'kokoro' | 'browser'

export type CloudModel = 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | 'claude-haiku-4-20250514' | 'gpt-4o' | 'gpt-4o-mini' | 'gemini-2.0-flash'
export type LocalModel = string

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  spoken?: boolean // whether TTS has spoken this message
}

export interface ProjectFile {
  filename: string
  content: string
  description: string
}

export interface GitHubConfig {
  repoUrl: string
  projectName: string
  description: string
  tags: string[]
  autoPopulate: boolean
}

export interface Settings {
  llmModel: LLMModel
  // Cloud model settings
  cloudApiKey: string
  cloudModel: CloudModel
  // Local model settings
  localApiKey: string          // optional — some local servers support API keys
  localModel: LocalModel
  localEndpoint: string        // e.g. http://localhost:11434 (Ollama default)
  localCustomModel: string     // custom model name when localModel is 'custom'
  // General
  questionCount: number        // how many Q&A rounds (default 5)
  researchMode: boolean        // LLM does web research before answering
  ttsEngine: TTSEngine
  ttsEnabled: boolean          // voice output on/off
  github: GitHubConfig
}

export interface Session {
  id: string
  idea: string
  createdAt: number
  messages: ChatMessage[]
  files: ProjectFile[]
  settings: Settings
}

// ── State Interface ─────────────────────────────────────

interface BrainstormerState {
  // Widget
  isOpen: boolean
  isMinimized: boolean
  activeTab: WidgetTab
  alwaysOnTop: boolean

  // Workflow
  stage: WorkflowStage
  idea: string                   // the raw idea from Spark
  ideaAnalysis: string           // LLM's initial analysis of the idea

  // Chat / Q&A
  messages: ChatMessage[]
  isChatLoading: boolean
  currentQuestionIndex: number   // which Q&A round we're on (0-based)
  qaComplete: boolean            // all questions answered?

  // Voice
  isRecording: boolean
  recordingDuration: number
  isSpeaking: boolean            // TTS currently speaking

  // Export
  projectFiles: ProjectFile[]
  isGeneratingFiles: boolean

  // Settings
  settings: Settings

  // Sessions
  sessions: Session[]

  // ── Actions ──

  // Widget
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setMinimized: (minimized: boolean) => void
  setActiveTab: (tab: WidgetTab) => void
  setAlwaysOnTop: (onTop: boolean) => void

  // Workflow
  setStage: (stage: WorkflowStage) => void
  setIdea: (idea: string) => void
  setIdeaAnalysis: (analysis: string) => void
  startWorkflow: (idea: string) => void
  resetWorkflow: () => void

  // Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setChatLoading: (loading: boolean) => void
  incrementQuestionIndex: () => void
  setQaComplete: (complete: boolean) => void

  // Voice
  setRecording: (recording: boolean) => void
  setRecordingDuration: (duration: number) => void
  setSpeaking: (speaking: boolean) => void

  // Export
  setProjectFiles: (files: ProjectFile[]) => void
  setGeneratingFiles: (generating: boolean) => void

  // Settings
  setSettings: (settings: Partial<Settings>) => void
  setGitHubConfig: (config: Partial<GitHubConfig>) => void

  // Sessions
  saveSession: () => void
  restoreSession: (id: string) => void
  deleteSession: (id: string) => void
}

// ── Defaults ────────────────────────────────────────────

const defaultSettings: Settings = {
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
}

// ── Store ───────────────────────────────────────────────

export const useBrainstormerStore = create<BrainstormerState>()(
  persist(
    (set, get) => ({
      // Widget
      isOpen: false,
      isMinimized: false,
      activeTab: 'spark',
      alwaysOnTop: false,

      // Workflow
      stage: 'spark',
      idea: '',
      ideaAnalysis: '',

      // Chat
      messages: [],
      isChatLoading: false,
      currentQuestionIndex: 0,
      qaComplete: false,

      // Voice
      isRecording: false,
      recordingDuration: 0,
      isSpeaking: false,

      // Export
      projectFiles: [],
      isGeneratingFiles: false,

      // Settings
      settings: { ...defaultSettings },

      // Sessions
      sessions: [],

      // ── Actions ──

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen, isMinimized: s.isOpen ? false : s.isMinimized })),
      setMinimized: (minimized) => set({ isMinimized: minimized }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setAlwaysOnTop: (onTop) => set({ alwaysOnTop: onTop }),

      // Workflow
      setStage: (stage) => set({ stage }),
      setIdea: (idea) => set({ idea }),
      setIdeaAnalysis: (analysis) => set({ ideaAnalysis: analysis }),
      startWorkflow: (idea) => {
        set({
          idea,
          stage: 'analyzing',
          messages: [],
          currentQuestionIndex: 0,
          qaComplete: false,
          projectFiles: [],
          ideaAnalysis: '',
        })
      },
      resetWorkflow: () => {
        set({
          stage: 'spark',
          idea: '',
          ideaAnalysis: '',
          messages: [],
          currentQuestionIndex: 0,
          qaComplete: false,
          projectFiles: [],
          isChatLoading: false,
          isGeneratingFiles: false,
          activeTab: 'spark',
        })
      },

      // Chat
      addMessage: (message) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...message,
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              timestamp: Date.now(),
            },
          ],
        })),
      clearMessages: () => set({ messages: [] }),
      setChatLoading: (loading) => set({ isChatLoading: loading }),
      incrementQuestionIndex: () =>
        set((s) => {
          const nextIndex = s.currentQuestionIndex + 1
          const isComplete = nextIndex >= s.settings.questionCount
          return {
            currentQuestionIndex: nextIndex,
            qaComplete: isComplete,
            ...(isComplete ? { stage: 'generating' as WorkflowStage, activeTab: 'export' as WidgetTab } : {}),
          }
        }),
      setQaComplete: (complete) => set({ qaComplete: complete }),

      // Voice
      setRecording: (recording) => set({ isRecording: recording }),
      setRecordingDuration: (duration) => set({ recordingDuration: duration }),
      setSpeaking: (speaking) => set({ isSpeaking: speaking }),

      // Export
      setProjectFiles: (files) => set({ projectFiles: files, stage: 'export' }),
      setGeneratingFiles: (generating) => set({ isGeneratingFiles: generating }),

      // Settings
      setSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),
      setGitHubConfig: (config) =>
        set((s) => ({
          settings: {
            ...s.settings,
            github: { ...s.settings.github, ...config },
          },
        })),

      // Sessions
      saveSession: () => {
        const state = get()
        const session: Session = {
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          idea: state.idea,
          createdAt: Date.now(),
          messages: [...state.messages],
          files: [...state.projectFiles],
          settings: { ...state.settings },
        }
        set((s) => ({ sessions: [session, ...s.sessions] }))
      },
      restoreSession: (id) => {
        const session = get().sessions.find((s) => s.id === id)
        if (session) {
          set({
            idea: session.idea,
            messages: [...session.messages],
            projectFiles: [...session.files],
            settings: { ...session.settings },
            stage: 'export',
            activeTab: 'export',
          })
        }
      },
      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
        })),
    }),
    {
      name: 'brainstormer-v2-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        settings: state.settings,
        alwaysOnTop: state.alwaysOnTop,
      }),
    }
  )
)
