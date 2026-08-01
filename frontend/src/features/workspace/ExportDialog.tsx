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
  Presentation,
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
  const [format, setFormat] = useState<'md' | 'pdf' | 'pptx'>('md')
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (format === 'pdf') {
        const { marked } = await import('marked')
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default

        // Fetch markdown content
        const response = await api.post(
          `/workspaces/${workspaceId}/export`,
          null,
          {
            params: { format: 'md' },
            responseType: 'text',
          }
        )
        const mdContent = response.data
        const parsedHtml = await marked.parse(mdContent)

        const printContent = `
          <div style="font-family: 'Inter', -apple-system, sans-serif; padding: 20px; color: #1a1a2e; max-width: 800px; margin: 0 auto; line-height: 1.6;">
            <style>
              h1 { color: #6d28d9; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-top: 0; font-size: 28px; }
              h2 { color: #7c3aed; margin-top: 24px; font-size: 22px; }
              h3 { color: #4c1d95; margin-top: 20px; font-size: 18px; }
              p { margin-bottom: 12px; }
              ul, ol { margin-bottom: 16px; padding-left: 24px; }
              li { margin-bottom: 6px; }
              pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; border: 1px solid #e5e7eb; }
              code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.9em; }
              pre code { background: transparent; padding: 0; border-radius: 0; }
              blockquote { border-left: 4px solid #8b5cf6; padding-left: 16px; color: #4b5563; font-style: italic; margin: 16px 0; background: #f5f3ff; padding: 12px 16px; border-radius: 0 8px 8px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
              th { background-color: #f9fafb; font-weight: 600; color: #374151; }
              hr { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
              strong { color: #111827; }
            </style>
            ${parsedHtml}
          </div>
        `

        const opt = {
          margin: 15,
          filename: `${workspaceName.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        }

        await html2pdf().set(opt).from(printContent).save()
      } else {
        const response = await api.post(
          `/workspaces/${workspaceId}/export`,
          null,
          {
            params: { format },
            responseType: format === 'pptx' ? 'blob' : 'text',
          }
        )
        const type = format === 'pptx' 
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'text/markdown'
          
        const blob = new Blob([response.data], { type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${workspaceName.replace(/\s+/g, '_')}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      setExported(true)
      setTimeout(() => {
        setExported(false)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
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
          className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-sm p-5 z-10
                     border border-slate-200 dark:border-slate-700 shadow-xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground
                       hover:text-foreground hover:bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
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
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-foreground'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-100 dark:bg-slate-800'
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
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-foreground'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-100 dark:bg-slate-800'
                  }`}
              >
                <File className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">PDF</p>
                  <p className="text-[10px] opacity-60">.pdf file</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('pptx')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left col-span-2
                  ${format === 'pptx'
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-foreground'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-100 dark:bg-slate-800'
                  }`}
              >
                <Presentation className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">PowerPoint (PPTX)</p>
                  <p className="text-[10px] opacity-60">AI-generated presentation slides</p>
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
