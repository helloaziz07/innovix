import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Wand2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerationConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetPhase: string, teamSize: number) => void
  hasExistingPlan?: boolean
}

export default function GenerationConfigModal({ isOpen, onClose, onConfirm, hasExistingPlan = false }: GenerationConfigModalProps) {
  const [mode, setMode] = useState<'full' | 'scoped'>('full')
  const [targetPhase, setTargetPhase] = useState<string>('main_plan')
  const [teamSize, setTeamSize] = useState<number>(4)

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
          <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto relative max-h-[90vh] flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generate Project Plan</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                Configure how much of the project plan you want the AI to generate right now. You can always build the rest later.
              </p>
            </div>

            <div className="overflow-y-auto">
              <CardContent className="p-8 pt-6 space-y-6">
                {/* Option 1: Full Plan */}
              <div
                onClick={() => setMode('full')}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden",
                  mode === 'full' 
                    ? "border-blue-500 bg-blue-500/10" 
                    : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    mode === 'full' ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 dark:border-slate-600"
                  )}>
                    {mode === 'full' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={cn("font-semibold mb-1", mode === 'full' ? "text-blue-500 dark:text-blue-400" : "text-gray-700 dark:text-slate-200")}>
                      Want to build the full plan from scratch
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
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
                    ? "border-blue-500 bg-blue-500/10" 
                    : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    mode === 'scoped' ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 dark:border-slate-600"
                  )}>
                    {mode === 'scoped' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("font-semibold mb-1", mode === 'scoped' ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-slate-200")}>
                      Select till which phase
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
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
                            className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-sm text-gray-900 dark:text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            <option value="main_plan">Option 1: Foundation (Overview Only)</option>
                            <option value="architecture">Option 2: Blueprint (Overview + Architecture + Tech Stack)</option>
                            {hasExistingPlan && (
                              <option value="roadmap">Option 3: Timeline & Roadmap Only</option>
                            )}
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </CardContent>

            {!hasExistingPlan && mode === 'full' && (
              <div className="px-8 pb-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 block">
                  Team Size
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTeamSize(n)}
                      className={`flex items-center justify-center min-w-[3rem] px-3 h-10 rounded-lg font-medium text-sm transition-all border ${
                        teamSize === n
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500 dark:text-blue-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Select the number of team members to automatically distribute and assign the generated tasks.
                </p>
              </div>
            )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
              <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(mode === 'full' ? 'full' : targetPhase, teamSize)}
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
