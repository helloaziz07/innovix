/**
 * Innovix — Project Detail Page
 *
 * Full project view with tabs: Overview, Architecture, Tech Stack,
 * Timeline, Export. Shows "Generate Plan" button and "Listen" (TTS).
 */

import { useState, useEffect, useCallback, useRef, Component, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Wrench,
  CalendarDays,
  Loader2,
  Rocket,
  AlertTriangle,
  Pin,
  Users,
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import PlanViewer from './PlanViewer'
import ArchitectureDiagram from './ArchitectureDiagram'
import TechStackCards from './TechStackCards'
import TimelineView from './TimelineView'
import ExportButton from './ExportButton'
import GenerationConfigModal from './GenerationConfigModal'
import GenerationPipeline from './GenerationPipeline'
import TeamSettingsModal from './TeamSettingsModal'

/**
 * Error boundary for Mermaid diagram rendering.
 * Catches DOM conflicts (removeChild errors) and shows a graceful fallback.
 */
class MermaidErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('[MermaidErrorBoundary] Caught render error:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-2">Architecture Diagram</h3>
          <p className="text-xs text-muted-foreground mb-4">
            The diagram couldn't be rendered in the browser.
            The component breakdown and design patterns are still shown below.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-blue-500 dark:text-blue-300 text-xs hover:bg-violet-600/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

type TabKey = 'overview' | 'architecture' | 'techstack' | 'timeline'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'architecture', label: 'Architecture', icon: <Layers className="w-4 h-4" /> },
  { key: 'techstack', label: 'Tech Stack', icon: <Wrench className="w-4 h-4" /> },
  { key: 'timeline', label: 'Timeline', icon: <CalendarDays className="w-4 h-4" /> },
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    activeProject,
    setActiveProject,
    isGeneratingPlan,
    setGeneratingPlan,
    updateProject,
    pipelineStage,
    pipelineProgress,
    pipelineMessage,
    setPipelineStage,
    setPipelineProgress,
    setPipelineMessage,
    resetPipeline,
  } = useProjectStore()

  // TTS State
  const [isNarrating, setIsNarrating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await projectsApi.get(id)
      setActiveProject(res.data)
    } catch (err) {
      setError('Failed to load project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, setActiveProject])

  const [isConfigModalOpen, setConfigModalOpen] = useState(false)
  const [isTeamModalOpen, setTeamModalOpen] = useState(false)
  const [generationTarget, setGenerationTarget] = useState('full')

  useEffect(() => {
    fetchProject()
    return () => setActiveProject(null)
  }, [fetchProject, setActiveProject])

  const handleTogglePin = async () => {
    if (!activeProject || !id) return
    const newPinnedStatus = !activeProject.is_pinned
    try {
      // Optimistic update
      updateProject(id, { is_pinned: newPinnedStatus })
      await projectsApi.update(id, { is_pinned: newPinnedStatus })
      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent('project-pinned'))
    } catch (err) {
      console.error('Failed to toggle pin status:', err)
      // Revert on failure
      updateProject(id, { is_pinned: !newPinnedStatus })
    }
  }

  // Auto-trigger pipeline for newly created projects (status = 'ideation', no plan yet)
  useEffect(() => {
    if (
      activeProject &&
      activeProject.status === 'ideation' &&
      !activeProject.project_plan &&
      !isGeneratingPlan &&
      id
    ) {
      setConfigModalOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, activeProject?.status])

  const handleGeneratePlan = async (targetPhase: string = 'full') => {
    setConfigModalOpen(false)
    if (!id || isGeneratingPlan) return
    setGenerationTarget(targetPhase)
    setGeneratingPlan(true)
    setError('')
    setPipelineStage('fetching_research')
    setPipelineProgress(0)
    setPipelineMessage('Initializing...')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await projectsApi.generatePlanStream(id, abortController.signal, targetPhase)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              setPipelineStage(event.stage)
              setPipelineProgress(event.progress)
              setPipelineMessage(event.message)

              if (event.stage === 'error') {
                setError(event.message)
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      // Refresh project to get the updated plan data
      const currentStage = useProjectStore.getState().pipelineStage
      if (currentStage !== 'cancelled' && currentStage !== 'error') {
        const updated = await projectsApi.get(id)
        setActiveProject(updated.data)
        updateProject(id, updated.data)
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setPipelineStage('cancelled')
        setPipelineMessage('Generation cancelled.')
        return
      }
      const msg = (err as Error).message || 'Plan generation failed'
      setError(msg)
      setPipelineStage('error')
      setPipelineMessage(msg)
      console.error('Plan generation failed:', msg, err)
    } finally {
      abortControllerRef.current = null
      // Don't reset pipeline here — let the user see the final state
      // Pipeline resets when the overlay is dismissed
    }
  }

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setPipelineStage('cancelled')
    setPipelineProgress(pipelineProgress) // freeze at current
    setPipelineMessage('Generation cancelled by user.')
  }

  // Dismiss the pipeline overlay (after completion, error, or cancel)
  const handleDismissPipeline = async () => {
    const wasComplete = pipelineStage === 'complete'
    resetPipeline()
    // If generation completed, refresh the project
    if (wasComplete && id) {
      try {
        const updated = await projectsApi.get(id)
        setActiveProject(updated.data)
        updateProject(id, updated.data)
      } catch { /* ignore */ }
    }
  }

  const handleNarrate = async () => {
    if (!id) return
    
    if (isNarrating && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsNarrating(false)
      return
    }

    try {
      setIsNarrating(true)
      const res = await projectsApi.narrate(id)
      const blob = new Blob([res.data], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.onended = () => {
        setIsNarrating(false)
      }
      audio.onerror = () => {
        setIsNarrating(false)
      }
      
      audioRef.current = audio
      audio.play()
    } catch (err) {
      console.error('Narration failed:', err)
      setIsNarrating(false)
      alert('Narration is not available. Make sure SARVAM_API_KEY is configured.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-muted-foreground">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:text-blue-300"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const plan = activeProject.project_plan as Record<string, unknown> | null
  const hasPlan = plan && !plan.error

  return (
    <div className="min-h-full p-6 lg:p-8 relative">
      {/* Config Modal */}
      <GenerationConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfirm={handleGeneratePlan}
      />

      {/* Pipeline Tracker Overlay */}
      {(isGeneratingPlan || ['complete', 'error', 'cancelled'].includes(pipelineStage)) && pipelineStage !== 'idle' && (
        <GenerationPipeline
          currentStage={pipelineStage}
          progress={pipelineProgress}
          message={pipelineMessage}
          onCancel={
            ['complete', 'error', 'cancelled'].includes(pipelineStage)
              ? handleDismissPipeline
              : handleCancelGeneration
          }
          error={pipelineStage === 'error' ? error : undefined}
          targetPhase={generationTarget}
        />
      )}
      {/* Back + Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{activeProject.title}</h1>
              <button 
                onClick={handleTogglePin}
                className={`p-1.5 rounded-md transition-colors ${
                  activeProject.is_pinned 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                }`}
                title={activeProject.is_pinned ? "Unpin Project" : "Pin Project"}
              >
                <Pin className={`w-4 h-4 ${activeProject.is_pinned ? 'fill-current rotate-45' : ''}`} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {activeProject.idea_text}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasPlan ? (
              <button
                onClick={() => setConfigModalOpen(true)}
                disabled={isGeneratingPlan}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-violet-600 to-purple-600
                           text-white text-sm font-medium
                           hover:from-blue-600 hover:to-indigo-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-lg shadow-violet-500/20"
                id="generate-plan-btn"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Plan
                  </>
                )}
              </button>
            ) : (
              <>
                <ExportButton projectId={activeProject.id} projectTitle={activeProject.title} />
                <button
                  onClick={() => setConfigModalOpen(true)}
                  disabled={isGeneratingPlan}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm
                             text-muted-foreground hover:bg-slate-100 dark:bg-slate-800
                             hover:text-foreground transition-colors
                             disabled:opacity-50"
                  title="Re-generate plan"
                >
                  {isGeneratingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Regenerate
                </button>
                <button
                  onClick={() => setTeamModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm
                             text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800
                             transition-colors font-medium"
                  title="Share Project"
                >
                  <Users className="w-4 h-4" />
                  Share
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400"
        >
          ⚠️ {error}
        </motion.div>
      )}



      {/* Plan content */}
      {hasPlan && !isGeneratingPlan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all
                  ${activeTab === tab.key
                    ? 'bg-violet-600/20 text-blue-500 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:bg-slate-800/50'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <PlanViewer 
                plan={plan as Record<string, unknown>} 
                onNarrate={handleNarrate} 
                isNarrating={isNarrating} 
                onUpdate={async (newPlan) => {
                  if (!id || !activeProject) return
                  // Optimistically update the UI
                  updateProject(id, { project_plan: newPlan })
                  try {
                    // Update the backend
                    await projectsApi.update(id, { project_plan: newPlan })
                  } catch (err) {
                    console.error("Failed to update project plan:", err)
                    // Revert on error
                    updateProject(id, { project_plan: plan })
                  }
                }}
              />
            )}
            {activeTab === 'architecture' && (
              <MermaidErrorBoundary>
                <ArchitectureDiagram
                  architecture={(plan as Record<string, unknown>).architecture as Record<string, unknown> | undefined}
                  onUpdate={async (newMermaid) => {
                    if (!id || !activeProject) return
                    const currentArch = (plan as Record<string, unknown>).architecture as Record<string, unknown> || {}
                    const updatedArch = { ...currentArch, mermaid_diagram: newMermaid }
                    const updatedPlan = { ...plan, architecture: updatedArch }
                    
                    updateProject(id, { project_plan: updatedPlan })
                    try {
                      await projectsApi.update(id, { project_plan: updatedPlan })
                    } catch (err) {
                      console.error("Failed to update architecture:", err)
                      updateProject(id, { project_plan: plan })
                    }
                  }}
                />
              </MermaidErrorBoundary>
            )}
            {activeTab === 'techstack' && (
              <TechStackCards
                techStack={
                  (((plan as Record<string, unknown>).tech_stack as Array<{ layer: string; technology: string; justification: string; alternatives?: string[] }>) || [])
                }
                onUpdate={async (newStack) => {
                  if (!id || !activeProject) return
                  const updatedPlan = { ...plan, tech_stack: newStack }
                  // Optimistically update the UI
                  updateProject(id, { project_plan: updatedPlan })
                  try {
                    // Update the backend
                    await projectsApi.update(id, { project_plan: updatedPlan })
                  } catch (err) {
                    console.error("Failed to update tech stack:", err)
                    // Revert on error
                    updateProject(id, { project_plan: plan })
                  }
                }}
              />
            )}
            {activeTab === 'timeline' && (
              <TimelineView plan={plan as Record<string, unknown>} />
            )}
          </div>
        </motion.div>
      )}

      {/* No plan yet + not generating */}
      {!hasPlan && !isGeneratingPlan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 dark:from-blue-500/20 to-indigo-100 dark:to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to Generate Your Plan</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Click "Generate Plan" to have our AI create a comprehensive project plan
            including problem validation, system architecture, tech stack recommendations,
            and a development roadmap.
          </p>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Run a DeepSearch first to give the AI more context for better results.
          </p>
        </motion.div>
      )}

      {/* Team Settings Modal */}
      {id && (
        <TeamSettingsModal 
          projectId={id}
          isOpen={isTeamModalOpen}
          onClose={() => setTeamModalOpen(false)}
        />
      )}
    </div>
  )
}
