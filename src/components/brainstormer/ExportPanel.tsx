'use client'

import { useState } from 'react'
import { Download, Copy, FileText, Code, Braces, FileCode, FileType, ClipboardList } from 'lucide-react'
import { useBrainstormerStore } from '@/lib/brainstormer-store'
import { generateLocalExport } from '@/lib/brainstormer-fallbacks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

const exportFormats = [
  { id: 'markdown', label: 'Markdown', icon: <FileText className="size-3.5" />, ext: 'md' },
  { id: 'html', label: 'HTML', icon: <Code className="size-3.5" />, ext: 'html' },
  { id: 'xml', label: 'XML', icon: <FileCode className="size-3.5" />, ext: 'xml' },
  { id: 'json', label: 'JSON (Figma)', icon: <Braces className="size-3.5" />, ext: 'json' },
  { id: 'txt', label: 'TXT', icon: <FileType className="size-3.5" />, ext: 'txt' },
  { id: 'prd', label: 'PRD', icon: <ClipboardList className="size-3.5" />, ext: 'md' },
]

export function ExportPanel() {
  const { generatedContent, promptConfig } = useBrainstormerStore()
  const [selectedFormat, setSelectedFormat] = useState('markdown')
  const [previewMode, setPreviewMode] = useState<'rendered' | 'raw'>('rendered')

  const topic = promptConfig.topic || 'Brainstorm'

  const getExportContent = (): string => {
    if (!generatedContent) return ''
    return generateLocalExport(generatedContent, selectedFormat, topic)
  }

  const handleCopyToClipboard = async () => {
    const content = getExportContent()
    if (!content) {
      toast.error('No content to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleDownload = () => {
    const content = getExportContent()
    if (!content) {
      toast.error('No content to download')
      return
    }

    const format = exportFormats.find((f) => f.id === selectedFormat)
    const ext = format?.ext || 'txt'
    const mimeType = selectedFormat === 'html' ? 'text/html' : selectedFormat === 'json' ? 'application/json' : 'text/plain'

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded as ${ext.toUpperCase()}`)
  }

  // Empty state
  if (!generatedContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="size-14 rounded-full bg-white/5 flex items-center justify-center">
          <Download className="size-7 text-white/20" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/50">No content to export</p>
          <p className="text-xs text-white/30 mt-1">Generate a brainstorm first, then come back to export it</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => useBrainstormerStore.getState().setActiveTab('prompt')}
          className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white mt-2"
        >
          Go to Spark
        </Button>
      </div>
    )
  }

  const exportContent = getExportContent()
  const isRenderableFormat = selectedFormat === 'markdown' || selectedFormat === 'prd'

  return (
    <div className="flex flex-col h-full">
      {/* Format selector */}
      <div className="border-b border-white/10 p-3">
        <div className="flex flex-wrap gap-1.5">
          {exportFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => {
                setSelectedFormat(format.id)
                setPreviewMode('rendered')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedFormat === format.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {format.icon}
              {format.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview toggle */}
      {isRenderableFormat && (
        <div className="flex border-b border-white/10 px-3 py-1.5 gap-1">
          <button
            onClick={() => setPreviewMode('rendered')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              previewMode === 'rendered'
                ? 'bg-white/10 text-white/90'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setPreviewMode('raw')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              previewMode === 'raw'
                ? 'bg-white/10 text-white/90'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Raw
          </button>
        </div>
      )}

      {/* Preview area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {previewMode === 'rendered' && isRenderableFormat ? (
            <div className="prose prose-invert prose-sm max-w-none text-white/85 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{exportContent}</ReactMarkdown>
            </div>
          ) : (
            <pre className="text-xs text-white/70 whitespace-pre-wrap break-words font-mono leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10 overflow-x-auto">
              {exportContent}
            </pre>
          )}
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="border-t border-white/10 p-3 flex gap-2">
        <Button
          onClick={handleCopyToClipboard}
          variant="outline"
          size="sm"
          className="flex-1 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Copy className="size-3.5" />
          Copy
        </Button>
        <Button
          onClick={handleDownload}
          size="sm"
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          <Download className="size-3.5" />
          Download
        </Button>
      </div>
    </div>
  )
}
