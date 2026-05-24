'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface PromptConfig {
  persona: string
  platform: string
  tone: string
  format: string
  topic: string
  customInstructions: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Session {
  id: string
  name: string
  createdAt: number
  promptConfig: PromptConfig
  messages: ChatMessage[]
  generatedContent: string
}

export type WidgetTab = 'prompt' | 'chat' | 'voice' | 'export' | 'history'

export interface VoiceBookmark {
  id: string
  timestamp: number
  label: string
}

interface BrainstormerState {
  // Widget shell state
  isOpen: boolean
  isMinimized: boolean
  activeTab: WidgetTab
  position: { x: number; y: number }

  // Prompt builder state
  promptConfig: PromptConfig

  // Chat state
  messages: ChatMessage[]
  isChatLoading: boolean

  // Generation state
  isGenerating: boolean
  generatedContent: string

  // Voice state
  isRecording: boolean
  recordingDuration: number
  bookmarks: VoiceBookmark[]

  // Sessions state
  sessions: Session[]
  currentSessionId: string | null

  // Actions
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setMinimized: (minimized: boolean) => void
  setActiveTab: (tab: WidgetTab) => void
  setPosition: (pos: { x: number; y: number }) => void

  setPromptConfig: (config: Partial<PromptConfig>) => void
  resetPromptConfig: () => void
  applyTemplate: (template: PromptConfig) => void

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setChatLoading: (loading: boolean) => void

  setGenerating: (generating: boolean) => void
  setGeneratedContent: (content: string) => void

  setRecording: (recording: boolean) => void
  setRecordingDuration: (duration: number) => void
  addBookmark: (bookmark: VoiceBookmark) => void
  removeBookmark: (id: string) => void

  saveSession: (name?: string) => void
  restoreSession: (id: string) => void
  deleteSession: (id: string) => void
  setCurrentSessionId: (id: string | null) => void
}

const defaultPromptConfig: PromptConfig = {
  persona: '',
  platform: '',
  tone: '',
  format: '',
  topic: '',
  customInstructions: '',
}

export const useBrainstormerStore = create<BrainstormerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isMinimized: false,
      activeTab: 'prompt',
      position: { x: 0, y: 0 },

      promptConfig: { ...defaultPromptConfig },

      messages: [],
      isChatLoading: false,

      isGenerating: false,
      generatedContent: '',

      isRecording: false,
      recordingDuration: 0,
      bookmarks: [],

      sessions: [],
      currentSessionId: null,

      // Actions
      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen, isMinimized: s.isOpen ? false : s.isMinimized })),
      setMinimized: (minimized) => set({ isMinimized: minimized }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPosition: (pos) => set({ position: pos }),

      setPromptConfig: (config) =>
        set((s) => ({ promptConfig: { ...s.promptConfig, ...config } })),
      resetPromptConfig: () => set({ promptConfig: { ...defaultPromptConfig } }),
      applyTemplate: (template) => set({ promptConfig: { ...template } }),

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

      setGenerating: (generating) => set({ isGenerating: generating }),
      setGeneratedContent: (content) => set({ generatedContent: content }),

      setRecording: (recording) => set({ isRecording: recording }),
      setRecordingDuration: (duration) => set({ recordingDuration: duration }),
      addBookmark: (bookmark) =>
        set((s) => ({ bookmarks: [...s.bookmarks, bookmark] })),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

      saveSession: (name) => {
        const state = get()
        const sessionName = name || `Session ${state.sessions.length + 1}`
        const session: Session = {
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: sessionName,
          createdAt: Date.now(),
          promptConfig: { ...state.promptConfig },
          messages: [...state.messages],
          generatedContent: state.generatedContent,
        }
        set((s) => ({
          sessions: [session, ...s.sessions],
          currentSessionId: session.id,
        }))
      },
      restoreSession: (id) => {
        const session = get().sessions.find((s) => s.id === id)
        if (session) {
          set({
            promptConfig: { ...session.promptConfig },
            messages: [...session.messages],
            generatedContent: session.generatedContent,
            currentSessionId: session.id,
            activeTab: 'prompt',
          })
        }
      },
      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          currentSessionId: s.currentSessionId === id ? null : s.currentSessionId,
        })),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
    }),
    {
      name: 'brainstormer-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        position: state.position,
      }),
    }
  )
)
