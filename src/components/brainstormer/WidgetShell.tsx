'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, MessageCircle, Mic, Download, Clock,
  Minus, X, Brain, Settings, Pin, PinOff,
} from 'lucide-react'
import { useBrainstormerStore, type WidgetTab } from '@/lib/brainstormer-store'
import { PromptBuilder } from './PromptBuilder'
import { ChatPanel } from './ChatPanel'
import { VoiceRecorder } from './VoiceRecorder'
import { ExportPanel } from './ExportPanel'
import { HistoryPanel } from './HistoryPanel'

const tabs: { id: WidgetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'prompt', label: 'Spark', icon: <Sparkles className="size-4" /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="size-4" /> },
  { id: 'voice', label: 'Voice', icon: <Mic className="size-4" /> },
  { id: 'export', label: 'Export', icon: <Download className="size-4" /> },
  { id: 'history', label: 'History', icon: <Clock className="size-4" /> },
]

/**
 * Tauri-aware window management helpers.
 * These call Tauri APIs when available, fallback to browser APIs otherwise.
 */
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function tauriInvoke(command: string, args?: Record<string, unknown>) {
  if (!isTauri()) return null
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke(command, args)
  } catch {
    return null
  }
}

async function tauriHideWindow() {
  if (!isTauri()) return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().hide()
  } catch {
    // fallback: do nothing in browser
  }
}

async function tauriSetAlwaysOnTop(onTop: boolean) {
  if (!isTauri()) return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().setAlwaysOnTop(onTop)
  } catch {
    // fallback: do nothing in browser
  }
}

export function WidgetShell() {
  const {
    isOpen,
    isMinimized,
    activeTab,
    setActiveTab,
    setOpen,
    setMinimized,
  } = useBrainstormerStore()

  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
  const [isCompact, setIsCompact] = useState(false)

  // Auto-open on mount (Tauri launches with widget visible)
  useEffect(() => {
    setOpen(true)
    // Mount-only effect: auto-show widget
  }, [])

  // Window control handlers — defined before useEffect that references them
  const handleMinimize = useCallback(() => {
    if (isTauri()) {
      tauriHideWindow()
    } else {
      setMinimized(true)
    }
  }, [setMinimized])

  const handleClose = useCallback(() => {
    if (isTauri()) {
      // In Tauri, close hides to system tray instead of quitting
      tauriHideWindow()
    } else {
      setOpen(false)
    }
  }, [setOpen])

  // Keyboard shortcut: Ctrl+Shift+B to toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        if (isTauri()) {
          tauriInvoke('toggle_window')
        } else {
          setOpen(!isOpen)
        }
      }
      // Escape to minimize
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        handleMinimize()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isMinimized, setOpen, handleMinimize])

  const handleAlwaysOnTop = useCallback(async () => {
    const newState = !isAlwaysOnTop
    setIsAlwaysOnTop(newState)
    await tauriSetAlwaysOnTop(newState)
  }, [isAlwaysOnTop])

  const handleRestore = useCallback(() => {
    setMinimized(false)
  }, [setMinimized])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prompt': return <PromptBuilder />
      case 'chat': return <ChatPanel />
      case 'voice': return <VoiceRecorder />
      case 'export': return <ExportPanel />
      case 'history': return <HistoryPanel />
      default: return <PromptBuilder />
    }
  }

  // Collapsed/tray state — show a floating FAB to restore
  if (!isOpen) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="flex size-16 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:shadow-amber-400/40 transition-all duration-200 group"
          aria-label="Open Brainstormer"
        >
          <Brain className="size-8 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-4 rounded-full bg-amber-300" />
          </span>
        </motion.button>
      </div>
    )
  }

  // Minimized state — show compact titlebar with restore button
  if (isMinimized) {
    return (
      <div className="h-screen w-screen flex items-start justify-center bg-transparent pt-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-xl cursor-pointer group"
          onClick={handleRestore}
          data-tauri-drag-region
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/20">
            <img src="/brainstormer-icon.png" alt="" className="size-4 rounded" />
          </div>
          <span className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">
            Brainstormer
          </span>
          <div className="flex items-center gap-0.5 ml-2">
            <Sparkles className="size-3 text-amber-400/50" />
            <span className="text-[10px] text-white/30">Click to restore</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // Full widget — this IS the Tauri window content
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-950/95 p-3">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`flex flex-col w-full h-full max-w-[440px] rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden widget-focused ${
          isCompact ? 'max-h-[400px]' : ''
        }`}
      >
        {/* Custom Titlebar — acts as Tauri drag region */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 select-none shrink-0"
          data-tauri-drag-region
        >
          {/* App icon + title */}
          <div className="flex items-center gap-2 flex-1 min-w-0" data-tauri-drag-region>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 shrink-0">
              <img
                src="/brainstormer-icon.png"
                alt="Brainstormer"
                className="size-4 rounded"
              />
            </div>
            <span className="font-semibold text-white text-sm tracking-wide">
              Brainstormer
            </span>
          </div>

          {/* Window controls */}
          <div className="flex items-center gap-0.5">
            {/* Always on top toggle */}
            <button
              onClick={handleAlwaysOnTop}
              className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                isAlwaysOnTop
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isAlwaysOnTop ? 'Unpin from top' : 'Pin to top'}
              title={isAlwaysOnTop ? 'Unpin' : 'Pin on top'}
            >
              {isAlwaysOnTop ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>

            {/* Compact toggle */}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                isCompact
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isCompact ? 'Expand' : 'Compact mode'}
            >
              <Minus className="size-3.5" />
            </button>

            {/* Minimize (hide to tray in Tauri) */}
            <button
              onClick={handleMinimize}
              className="flex size-7 items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Minimize to tray"
              title="Minimize to tray"
            >
              <Minus className="size-4" />
            </button>

            {/* Close (hide to tray in Tauri, toggle off in browser) */}
            <button
              onClick={handleClose}
              className="flex size-7 items-center justify-center rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Hide to tray"
              title="Hide to tray"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-white/10 px-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-amber-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-amber-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex-1 overflow-hidden"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-white/30">
              {isTauri() ? 'Desktop' : 'Web'} · AI Ready
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAlwaysOnTop && (
              <span className="text-[10px] text-amber-400/60 flex items-center gap-1">
                <Pin className="size-2.5" /> Pinned
              </span>
            )}
            <span className="text-[10px] text-white/20">
              Ctrl+Shift+B
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
