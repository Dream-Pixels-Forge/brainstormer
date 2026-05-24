'use client'

import { useState } from 'react'
import { Save, RotateCcw, Trash2, Clock, MessageCircle, FileText, AlertTriangle } from 'lucide-react'
import { useBrainstormerStore, type Session } from '@/lib/brainstormer-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
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

export function HistoryPanel() {
  const {
    sessions,
    saveSession,
    restoreSession,
    deleteSession,
    promptConfig,
    messages,
    generatedContent,
  } = useBrainstormerStore()

  const [sessionName, setSessionName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showClearAll, setShowClearAll] = useState(false)

  const handleSave = () => {
    if (messages.length === 0 && !generatedContent) {
      toast.error('Nothing to save — generate or chat first')
      return
    }
    saveSession(sessionName || undefined)
    setSessionName('')
    setShowSaveInput(false)
    toast.success('Session saved')
  }

  const handleRestore = (session: Session) => {
    restoreSession(session.id)
    toast.success(`Restored "${session.name}"`)
  }

  const handleDelete = (id: string) => {
    deleteSession(id)
    setDeleteTarget(null)
    toast.success('Session deleted')
  }

  const handleClearAll = () => {
    sessions.forEach((s) => deleteSession(s.id))
    setShowClearAll(false)
    toast.success('All history cleared')
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Empty state
  if (sessions.length === 0 && !showSaveInput) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/10">
          <Button
            onClick={() => setShowSaveInput(true)}
            size="sm"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <Save className="size-3.5" />
            Save Current Session
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3">
          <div className="size-14 rounded-full bg-white/5 flex items-center justify-center">
            <Clock className="size-7 text-white/20" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50">No saved sessions</p>
            <p className="text-xs text-white/30 mt-1">Save your current brainstorm to revisit later</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Save section */}
      <div className="p-3 border-b border-white/10 space-y-2">
        {!showSaveInput ? (
          <Button
            onClick={() => setShowSaveInput(true)}
            size="sm"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <Save className="size-3.5" />
            Save Current Session
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name (optional)"
              className="h-8 text-xs bg-white/5 border-white/10 text-white/90 placeholder:text-white/30"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black shrink-0"
            >
              Save
            </Button>
            <Button
              onClick={() => { setShowSaveInput(false); setSessionName('') }}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white/60 shrink-0"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {session.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {formatDate(session.createdAt)}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <MessageCircle className="size-2.5" />
                      {session.messages.length} msgs
                    </span>
                    {session.promptConfig.topic && (
                      <span className="text-[10px] text-amber-400/60 flex items-center gap-1 truncate">
                        <FileText className="size-2.5 shrink-0" />
                        {session.promptConfig.topic}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  onClick={() => handleRestore(session)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="size-3" />
                  Restore
                </Button>
                <AlertDialog
                  open={deleteTarget === session.id}
                  onOpenChange={(open) => !open && setDeleteTarget(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={() => setDeleteTarget(session.id)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-white/10 bg-white/5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="size-5 text-amber-400" />
                        Delete Session
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        Are you sure you want to delete &quot;{session.name}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(session.id)}
                        className="bg-red-500 hover:bg-red-400 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Clear all button */}
      {sessions.length > 0 && (
        <div className="border-t border-white/10 p-3">
          <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-500/20 bg-red-500/5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
                Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-400" />
                  Clear All History
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  This will permanently delete all {sessions.length} saved sessions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-red-500 hover:bg-red-400 text-white"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
