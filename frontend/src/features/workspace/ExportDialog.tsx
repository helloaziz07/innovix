/**
 * Innovix — Export Dialog Component
 *
 * Modal dialog for exporting workspace contents to
 * different formats (Markdown, PDF).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileText,
  File,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import { api } from '@/lib/api'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  workspaceName: string
}

export default function ExportDialog({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'md' | 'pdf'>('md')
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/export`,
        null,
        {
          params: { format },
          responseType: 'blob',
        }
      )

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/markdown',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${workspaceName}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExported(true)
      setTimeout(() => {
        setExported(false)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative glass-card rounded-2xl w-full max-w-sm p-5 z-10
                     border border-white/10 shadow-xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground
                       hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Export Workspace</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {workspaceName}
              </p>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-2 mb-5">
            <p className="text-xs text-muted-foreground font-medium">Choose format:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('md')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                  ${format === 'md'
                    ? 'bg-violet-500/10 border-violet-500/30 text-foreground'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Markdown</p>
                  <p className="text-[10px] opacity-60">.md file</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                  ${format === 'pdf'
                    ? 'bg-violet-500/10 border-violet-500/30 text-foreground'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
              >
                <File className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">PDF</p>
                  <p className="text-[10px] opacity-60">.pdf file</p>
                </div>
              </button>
            </div>
          </div>

          {/* Info */}
          <p className="text-[10px] text-muted-foreground/60 mb-4">
            Exports all notes, annotations, and saved results from this workspace.
          </p>

          {/* Action */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm
                       font-medium hover:from-violet-500 hover:to-indigo-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {exported ? (
              <>
                <Check className="w-4 h-4" />
                Downloaded!
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
