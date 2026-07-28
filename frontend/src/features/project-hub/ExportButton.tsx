/**
 * Innovix — Export Button
 *
 * Export dialog with format selection (PDF / Markdown).
 * Triggers download via the backend export API.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, FileDown, Loader2, X } from 'lucide-react'
import { projectsApi } from '@/lib/api'

interface ExportButtonProps {
  projectId: string
  projectTitle: string
}

export default function ExportButton({ projectId, projectTitle }: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'md' | 'pdf'>('md')

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await projectsApi.export(projectId, exportFormat)

      // Create blob and trigger download
      const blob = new Blob(
        [response.data],
        {
          type: exportFormat === 'pdf' ? 'application/pdf' : 'text/markdown',
        }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle.replace(/\s+/g, '_')}_plan.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setShowDialog(false)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-white/5 border border-white/10 text-sm
                   text-muted-foreground hover:bg-white/10
                   hover:text-foreground transition-colors"
        id="export-btn"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-sm border border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Export Plan</h3>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Format Selection */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-medium text-muted-foreground block">
                  Select Format
                </label>

                <button
                  onClick={() => setExportFormat('md')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                    ${
                      exportFormat === 'md'
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                >
                  <FileText className={`w-5 h-5 ${exportFormat === 'md' ? 'text-violet-400' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium block">Markdown</span>
                    <span className="text-[10px] text-muted-foreground">
                      Plain text with formatting — great for docs and GitHub
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                    ${
                      exportFormat === 'pdf'
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                >
                  <FileDown className={`w-5 h-5 ${exportFormat === 'pdf' ? 'text-violet-400' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium block">PDF</span>
                    <span className="text-[10px] text-muted-foreground">
                      Styled document — great for presentations and submissions
                    </span>
                  </div>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                             text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600
                             text-white text-sm font-medium hover:from-violet-500 hover:to-purple-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all
                             flex items-center justify-center gap-2"
                  id="confirm-export-btn"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
