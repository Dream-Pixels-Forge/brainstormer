'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageCircle, Mic, Download, Clock, Minus, X, Brain } from 'lucide-react'
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

export function WidgetShell() {
  const {
    isOpen,
    isMinimized,
    activeTab,
    position,
    toggleOpen,
    setOpen,
    setMinimized,
    setActiveTab,
    setPosition,
  } = useBrainstormerStore()

  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Initialize default position on mount if store has no position.
  // setPosition is a zustand action (stable reference) and position is only read
  // for the initial check — intentionally omitting from deps to run only on mount.
  useEffect(() => {
    if (position.x === 0 && position.y === 0) {
      setPosition({
        x: Math.max(16, window.innerWidth - 440),
        y: Math.max(16, window.innerHeight - 580),
      })
    }
    // Mount-only: setPosition is stable, position is read for initial check only
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        toggleOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleOpen])

  // Drag handlers - update store position directly during drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      e.preventDefault()
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: position.x,
        posY: position.y,
      }
    },
    [position]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const newX = Math.max(0, Math.min(window.innerWidth - 420, dragRef.current.posX + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.posY + dy))
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setPosition])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prompt':
        return <PromptBuilder />
      case 'chat':
        return <ChatPanel />
      case 'voice':
        return <VoiceRecorder />
      case 'export':
        return <ExportPanel />
      case 'history':
        return <HistoryPanel />
      default:
        return <PromptBuilder />
    }
  }

  // FAB trigger button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:shadow-amber-400/40 transition-all duration-200 group"
        aria-label="Open Brainstormer"
      >
        <Brain className="size-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 flex size-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex size-4 rounded-full bg-amber-300" />
        </span>
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={widgetRef}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
          height: isMinimized ? 'auto' : undefined,
        }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: 'fixed',
          zIndex: 50,
        }}
        className={`w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 ${
          isFocused
            ? 'border border-amber-400/40 widget-focused'
            : 'border border-white/10'
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={-1}
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDown}
          className={`flex items-center gap-3 px-4 py-3 border-b border-white/10 cursor-grab select-none ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 shrink-0">
              <img
                src="/brainstormer-icon.png"
                alt="Brainstormer"
                className="size-5 rounded"
              />
            </div>
            <span className="font-semibold text-white text-sm tracking-wide">
              Brainstormer
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!isMinimized)}
              className="flex size-7 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab navigation - visible when not minimized */}
        {!isMinimized && (
          <div className="flex border-b border-white/10 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-amber-400'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-amber-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <AnimatePresence mode="wait">
          {!isMinimized && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-[480px] sm:h-[480px] overflow-hidden"
            >
              {renderTabContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
