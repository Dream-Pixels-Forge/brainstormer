'use client'

import { WidgetShell } from '@/components/brainstormer/WidgetShell'
import { FloatingParticles } from '@/components/brainstormer/FloatingParticles'
import { Sparkles, Keyboard, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

      {/* Floating particles animation */}
      <FloatingParticles />

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse [animation-duration:4s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/3 rounded-full blur-3xl animate-pulse [animation-duration:6s]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-2xl">
        {/* Logo / Icon */}
        <div className="relative">
          <div className="size-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <img
              src="/brainstormer-icon.png"
              alt="Brainstormer"
              className="size-12 rounded-lg"
            />
          </div>
          <div className="absolute -top-1 -right-1 size-4 bg-amber-500 rounded-full animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Brainstormer
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            Your AI-powered brainstorming assistant. Generate ideas, explore concepts,
            and export your creativity in any format.
          </p>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Keyboard className="size-5 text-amber-400" />
            <span className="text-sm text-white/70">Press</span>
            <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-xs font-mono text-amber-400">
              Ctrl
            </kbd>
            <span className="text-white/40">+</span>
            <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-xs font-mono text-amber-400">
              Shift
            </kbd>
            <span className="text-white/40">+</span>
            <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-xs font-mono text-amber-400">
              B
            </kbd>
            <span className="text-sm text-white/70">to open</span>
          </div>

          <p className="text-xs text-white/30">or click the floating button in the bottom-right corner</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center space-y-2 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all duration-300 group">
            <Sparkles className="size-5 text-amber-400 mx-auto group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">Smart Prompts</p>
            <p className="text-[10px] text-white/40">AI-powered idea generation</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center space-y-2 hover:bg-orange-500/5 hover:border-orange-500/20 transition-all duration-300 group">
            <Zap className="size-5 text-orange-400 mx-auto group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">Multi-Format</p>
            <p className="text-[10px] text-white/40">Export as MD, HTML, PRD & more</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center space-y-2 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all duration-300 group">
            <Keyboard className="size-5 text-amber-400 mx-auto group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">Voice Input</p>
            <p className="text-[10px] text-white/40">Speak your ideas naturally</p>
          </div>
        </div>
      </div>

      {/* Widget */}
      <WidgetShell />
    </div>
  )
}
