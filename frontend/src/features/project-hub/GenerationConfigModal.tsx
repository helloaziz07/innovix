import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Wand2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerationConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetPhase: string) => void
}

export default function GenerationConfigModal({ isOpen, onClose, onConfirm }: GenerationConfigModalProps) {
  const [mode, setMode] = useState<'full' | 'scoped'>('full')
  const [targetPhase, setTargetPhase] = useState<string>('main_plan')

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg"
        >
          <Card className="border-slate-800 bg-slate-900 shadow-2xl overflow-hidden relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-6 border-b border-slate-800 bg-slate-900/50">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Generate Project Plan</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Configure how much of the project plan you want the AI to generate right now. You can always build the rest later.
              </p>
            </div>

            <CardContent className="p-8 pt-6 space-y-6">
              {/* Option 1: Full Plan */}
              <div
                onClick={() => setMode('full')}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden",
                  mode === 'full' 
                    ? "border-blue-500 bg-blue-500/10" 
                    : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    mode === 'full' ? "border-blue-500 bg-blue-500 text-white" : "border-slate-600"
                  )}>
                    {mode === 'full' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={cn("font-semibold mb-1", mode === 'full' ? "text-blue-400" : "text-slate-200")}>
                      Want to build Full plan
                    </h3>
                    <p className="text-sm text-slate-400">
                      Generates the entire project specification including the main plan, system architecture, and development roadmap.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Scoped Plan */}
              <div
                onClick={() => setMode('scoped')}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden",
                  mode === 'scoped' 
                    ? "border-emerald-500 bg-emerald-500/10" 
                    : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    mode === 'scoped' ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600"
                  )}>
                    {mode === 'scoped' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("font-semibold mb-1", mode === 'scoped' ? "text-emerald-400" : "text-slate-200")}>
                      Select till which phase
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">
                      Stop generation early if you only need the high-level plan or architecture.
                    </p>

                    <AnimatePresence>
                      {mode === 'scoped' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pt-2"
                        >
                          <select
                            value={targetPhase}
                            onChange={(e) => setTargetPhase(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          >
                            <option value="main_plan">Up to Main Plan (Problem, Features, Tech Stack)</option>
                            <option value="architecture">Up to Architecture (Main Plan + System Diagram)</option>
                            <option value="roadmap">Up to Roadmap (Everything)</option>
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(mode === 'full' ? 'full' : targetPhase)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              >
                Start Generation
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
