/**
 * Innovix — Generation Pipeline Tracker
 *
 * A premium visual stepper that shows real-time progress during
 * AI plan generation. Replaces the static spinner overlay.
 *
 * Displays 5 stages as a vertical pipeline with animated transitions,
 * a gradient progress bar, and a cancel button.
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Layers,
  CalendarDays,
  Database,
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  X,
} from 'lucide-react'
import type { PipelineStage } from '@/stores/projectStore'

interface PipelineStep {
  id: PipelineStage
  label: string
  description: string
  icon: React.ReactNode
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'fetching_research',
    label: 'Fetching Research',
    description: 'Gathering DeepSearch context and sources',
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: 'main_plan',
    label: 'Generating Plan',
    description: 'Problem validation, tech stack & opportunities',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'architecture',
    label: 'Designing Architecture',
    description: 'System diagram, components & patterns',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    id: 'roadmap',
    label: 'Building Roadmap',
    description: 'Timeline, milestones & risk assessment',
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    id: 'saving',
    label: 'Finalizing',
    description: 'Saving plan to database',
    icon: <Database className="w-5 h-5" />,
  },
]

// Map each stage to its index for comparison
const STAGE_ORDER: Record<string, number> = {}
PIPELINE_STEPS.forEach((step, idx) => {
  STAGE_ORDER[step.id] = idx
})
STAGE_ORDER['complete'] = PIPELINE_STEPS.length
STAGE_ORDER['error'] = -1
STAGE_ORDER['cancelled'] = -1
STAGE_ORDER['idle'] = -1

type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'cancelled'

function getStepStatus(
  stepId: PipelineStage,
  currentStage: PipelineStage
): StepStatus {
  if (currentStage === 'error' || currentStage === 'cancelled') {
    const stepIdx = STAGE_ORDER[stepId] ?? -1
    const currentIdx = STAGE_ORDER[currentStage] ?? -1
    // For error/cancelled, all steps up to the failed stage show completed,
    // and the stage that was active shows error/cancelled
    // We track by looking at which step was last active before failure
    if (stepIdx < currentIdx) return 'completed'
    return 'pending'
  }

  const stepIdx = STAGE_ORDER[stepId] ?? -1
  const currentIdx = STAGE_ORDER[currentStage] ?? -1

  if (currentStage === 'complete') return 'completed'
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

interface GenerationPipelineProps {
  currentStage: PipelineStage
  progress: number
  message: string
  onCancel: () => void
  error?: string
  targetPhase?: string
}

export default function GenerationPipeline({
  currentStage,
  progress,
  message,
  onCancel,
  error,
  targetPhase = 'full',
}: GenerationPipelineProps) {
  const isCancelled = currentStage === 'cancelled'
  const isError = currentStage === 'error'
  const isComplete = currentStage === 'complete'
  const isTerminal = isCancelled || isError || isComplete

  // Find the index of the current active step for error/cancel display
  const activeStepIdx = STAGE_ORDER[currentStage] ?? -1

  // Filter steps based on targetPhase
  const visibleSteps = PIPELINE_STEPS.filter((step) => {
    if (targetPhase === 'main_plan') {
      return ['fetching_research', 'main_plan', 'saving'].includes(step.id)
    }
    if (targetPhase === 'architecture') {
      return ['architecture', 'saving'].includes(step.id)
    }
    if (targetPhase === 'roadmap') {
      return ['roadmap', 'saving'].includes(step.id)
    }
    // 'full' includes everything
    return true
  }).map(step => {
    // Customize text for partial generation to make it clearer
    if (targetPhase === 'main_plan' && step.id === 'main_plan') {
      return { ...step, label: 'Generating Overview', description: 'Problem validation & opportunities' }
    }
    if (targetPhase === 'architecture' && step.id === 'architecture') {
      return { ...step, label: 'Designing Architecture & Tech Stack', description: 'System diagram, tech stack & patterns' }
    }
    if (targetPhase === 'roadmap' && step.id === 'roadmap') {
      return { ...step, label: 'Building Roadmap', description: 'Timeline & milestones' }
    }
    return step
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm
                 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-white dark:bg-[#0f1729] border border-slate-200 dark:border-slate-800
                   rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isComplete
                ? '✅ Plan Generated!'
                : isCancelled
                  ? '⏹ Generation Cancelled'
                  : isError
                    ? '⚠️ Generation Failed'
                    : targetPhase === 'main_plan'
                      ? 'Generating Overview'
                      : targetPhase === 'architecture'
                        ? 'Designing Architecture & Tech Stack'
                        : targetPhase === 'roadmap'
                          ? 'Building Roadmap'
                          : 'Generating Your Project Plan'}
            </h3>
            {!isTerminal && (
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500
                           hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                title="Cancel generation"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <motion.div
              className={`h-full rounded-full ${
                isError
                  ? 'bg-red-500'
                  : isCancelled
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {message || 'Initializing...'}
            </p>
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="px-6 pb-3">
          <div className="space-y-0">
            {visibleSteps.map((step, idx) => {
              let status: StepStatus

              if (isError || isCancelled) {
                // Steps before the failed step are completed
                // The step that was active when error/cancel happened
                if (idx < activeStepIdx) {
                  status = 'completed'
                } else if (idx === activeStepIdx) {
                  status = isError ? 'error' : 'cancelled'
                } else {
                  status = 'pending'
                }
              } else {
                status = getStepStatus(step.id, currentStage)
              }

              return (
                <div key={step.id} className="flex items-start gap-3 relative">
                  {/* Connector line */}
                  {idx < visibleSteps.length - 1 && (
                    <div
                      className={`absolute left-[17px] top-[36px] w-0.5 h-[28px] transition-colors duration-500 ${
                        status === 'completed'
                          ? 'bg-emerald-400 dark:bg-emerald-500'
                          : status === 'error'
                            ? 'bg-red-300 dark:bg-red-500/50'
                            : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}

                  {/* Step icon */}
                  <div
                    className={`w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center
                      transition-all duration-500 ${
                        status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : status === 'active'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-400/30 dark:ring-blue-500/30'
                            : status === 'error'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400'
                              : status === 'cancelled'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    <AnimatePresence mode="wait">
                      {status === 'completed' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', damping: 15 }}
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </motion.div>
                      ) : status === 'active' ? (
                        <motion.div
                          key="spinner"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        </motion.div>
                      ) : status === 'error' ? (
                        <motion.div
                          key="error"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <XCircle className="w-4.5 h-4.5" />
                        </motion.div>
                      ) : status === 'cancelled' ? (
                        <motion.div
                          key="cancelled"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <XCircle className="w-4.5 h-4.5" />
                        </motion.div>
                      ) : (
                        <motion.div key="pending">
                          <Circle className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-5 min-w-0">
                    <p
                      className={`text-sm font-semibold leading-tight transition-colors duration-300 ${
                        status === 'completed'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : status === 'active'
                            ? 'text-blue-700 dark:text-blue-300'
                            : status === 'error'
                              ? 'text-red-600 dark:text-red-400'
                              : status === 'cancelled'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-xs mt-0.5 transition-colors duration-300 ${
                        status === 'active'
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          {/* Error message */}
          {isError && error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/10
                         border border-red-200 dark:border-red-500/20
                         text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Cancel button (only while running) */}
          {!isTerminal && (
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-sm font-medium
                         border border-slate-200 dark:border-slate-700
                         text-slate-600 dark:text-slate-400
                         hover:bg-red-50 dark:hover:bg-red-500/10
                         hover:text-red-600 dark:hover:text-red-400
                         hover:border-red-200 dark:hover:border-red-500/30
                         transition-all"
            >
              Cancel Generation
            </button>
          )}

          {/* Dismiss button for terminal states */}
          {isComplete && (
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-emerald-500 to-teal-500
                         text-white shadow-lg shadow-emerald-500/20
                         hover:from-emerald-600 hover:to-teal-600
                         transition-all"
            >
              View Your Plan →
            </motion.button>
          )}

          {(isError || isCancelled) && (
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-sm font-medium
                         border border-slate-200 dark:border-slate-700
                         text-slate-600 dark:text-slate-400
                         hover:bg-slate-50 dark:hover:bg-slate-800
                         transition-all"
            >
              Dismiss
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
