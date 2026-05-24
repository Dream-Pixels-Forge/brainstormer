'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, MessageCircle, Download, Settings2,
  Minus, X, Brain, Pin, PinOff,
} from 'lucide-react'
import { useBrainstormerStore, type WidgetTab } from '@/lib/brainstormer-store'
import { SparkTab } from './SparkTab'
import { ChatTab } from './ChatTab'
import { ExportTab } from './ExportTab'
import { SettingsTab } from './SettingsTab'

const tabs: { id: WidgetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'spark', label: 'Spark', icon: <Sparkles className="size-4" /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="size-4" /> },
  { id: 'export', label: 'Export', icon: <Download className="size-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings2 className="size-4" /> },
]

/**
 * Tauri-aware window management helpers.
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
    stage,
    setActiveTab,
    setOpen,
    setMinimized,
    setAlwaysOnTop: setStoreAlwaysOnTop,
    alwaysOnTop,
  } = useBrainstormerStore()

  const [isCompact, setIsCompact] = useState(false)

  // Auto-open on mount (Tauri launches with widget visible)
  useEffect(() => {
    setOpen(true)
  }, [])

  // Window control handlers
  const handleMinimize = useCallback(() => {
    if (isTauri()) {
      tauriHideWindow()
    } else {
      setMinimized(true)
    }
  }, [setMinimized])

  const handleClose = useCallback(() => {
    if (isTauri()) {
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
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        handleMinimize()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isMinimized, setOpen, handleMinimize])

  const handleAlwaysOnTop = useCallback(async () => {
    const newState = !alwaysOnTop
    setStoreAlwaysOnTop(newState)
    await tauriSetAlwaysOnTop(newState)
  }, [alwaysOnTop, setStoreAlwaysOnTop])

  const handleRestore = useCallback(() => {
    setMinimized(false)
  }, [setMinimized])

  // Stage-based tab indicator
  const stageLabel: Record<string, string> = {
    spark: 'New Idea',
    analyzing: 'Analyzing...',
    chat: 'Q&A Session',
    generating: 'Generating...',
    export: 'Ready',
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'spark': return <SparkTab />
      case 'chat': return <ChatTab />
      case 'export': return <ExportTab />
      case 'settings': return <SettingsTab />
      default: return <SparkTab />
    }
  }

  // Collapsed/tray state
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

  // Minimized state
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
          <div className="flex items-center gap-1 ml-2">
            <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-white/40">{stageLabel[stage] || 'Ready'}</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex items-end justify-center bg-zinc-950/95 pb-4 pt-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`flex flex-col w-full max-w-[400px] rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden widget-focused ${
          isCompact ? 'h-[340px]' : 'h-[480px]'
        }`}
      >
        {/* Custom Titlebar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 select-none shrink-0"
          data-tauri-drag-region
        >
          <div className="flex items-center gap-2 flex-1 min-w-0" data-tauri-drag-region>
            <div className="flex size-5 items-center justify-center rounded bg-amber-500/20 shrink-0">
              <img src="/brainstormer-icon.png" alt="Brainstormer" className="size-3 rounded" />
            </div>
            <span className="font-semibold text-white text-xs tracking-wide">Brainstormer</span>
            <span className="text-[9px] text-amber-400/60 font-medium ml-1">
              {stageLabel[stage] || ''}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleAlwaysOnTop}
              className={`flex size-5 items-center justify-center rounded transition-colors ${
                alwaysOnTop ? 'text-amber-400 bg-amber-500/10' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              aria-label={alwaysOnTop ? 'Unpin' : 'Pin on top'}
              title={alwaysOnTop ? 'Unpin' : 'Pin on top'}
            >
              {alwaysOnTop ? <PinOff className="size-3" /> : <Pin className="size-3" />}
            </button>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`flex size-5 items-center justify-center rounded transition-colors ${
                isCompact ? 'text-amber-400 bg-amber-500/10' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isCompact ? 'Expand' : 'Compact'}
            >
              <Minus className="size-3" />
            </button>
            <button
              onClick={handleMinimize}
              className="flex size-5 items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Minimize"
            >
              <Minus className="size-3" />
            </button>
            <button
              onClick={handleClose}
              className="flex size-5 items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Close"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-white/10 px-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors relative ${
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
        <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`size-1.5 rounded-full animate-pulse ${
              stage === 'analyzing' || stage === 'generating' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span className="text-[9px] text-white/30">
              {isTauri() ? 'Desktop' : 'Web'} · {stage === 'analyzing' || stage === 'generating' ? 'Working...' : 'AI Ready'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {alwaysOnTop && (
              <span className="text-[9px] text-amber-400/60 flex items-center gap-1">
                <Pin className="size-2" /> Pinned
              </span>
            )}
            <span className="text-[9px] text-white/20">⌘⇧B</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
