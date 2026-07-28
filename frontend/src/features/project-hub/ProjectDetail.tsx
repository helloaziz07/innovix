/**
 * Innovix — Project Detail Page
 *
 * Full project view with tabs: Overview, Architecture, Tech Stack,
 * Timeline, Export. Shows "Generate Plan" button and "Listen" (TTS).
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Wrench,
  CalendarDays,
  Volume2,
  Loader2,
  Rocket,
  AlertTriangle,
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import PlanViewer from './PlanViewer'
import ArchitectureDiagram from './ArchitectureDiagram'
import TechStackCards from './TechStackCards'
import TimelineView from './TimelineView'
import ExportButton from './ExportButton'

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
  } = useProjectStore()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    fetchProject()
    return () => setActiveProject(null)
  }, [fetchProject, setActiveProject])

  const handleGeneratePlan = async () => {
    if (!id || isGeneratingPlan) return
    setGeneratingPlan(true)
    setError('')
    try {
      const _res = await projectsApi.generatePlan(id)
      // Refresh project to get the updated plan
      const updated = await projectsApi.get(id)
      setActiveProject(updated.data)
      updateProject(id, updated.data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Plan generation failed'
      setError(msg)
      console.error('Plan generation failed:', err)
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleNarrate = async () => {
    if (!id) return
    try {
      const res = await projectsApi.narrate(id)
      // Play the audio
      const blob = new Blob([res.data], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Narration failed:', err)
      alert('Narration is not available. Make sure SARVAM_API_KEY is configured.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
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
            className="mt-4 text-sm text-violet-400 hover:text-violet-300"
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
    <div className="min-h-full p-6 lg:p-8">
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
            <h1 className="text-2xl font-bold mb-1">{activeProject.title}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {activeProject.idea_text}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasPlan ? (
              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-violet-600 to-purple-600
                           text-white text-sm font-medium
                           hover:from-violet-500 hover:to-purple-500
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
                <button
                  onClick={handleNarrate}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-white/5 border border-white/10 text-sm
                             text-muted-foreground hover:bg-white/10
                             hover:text-foreground transition-colors"
                  title="Listen to plan summary (Sarvam AI TTS)"
                  id="narrate-btn"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen
                </button>
                <ExportButton projectId={activeProject.id} projectTitle={activeProject.title} />
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-white/5 border border-white/10 text-sm
                             text-muted-foreground hover:bg-white/10
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

      {/* Generating state */}
      {isGeneratingPlan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-8 text-center mb-6"
        >
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-4" />
          <h3 className="font-semibold mb-1">Generating Your Project Plan</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Our AI is analyzing your idea, designing the architecture,
            and building a development roadmap. This takes about 30–60 seconds.
          </p>
          <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Problem validation
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
              Architecture design
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400/30 animate-pulse" style={{ animationDelay: '0.6s' }} />
              Roadmap planning
            </span>
          </div>
        </motion.div>
      )}

      {/* Plan content */}
      {hasPlan && !isGeneratingPlan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all
                  ${
                    activeTab === tab.key
                      ? 'bg-violet-600/20 text-violet-300 font-medium border border-violet-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && <PlanViewer plan={plan as Record<string, unknown>} />}
            {activeTab === 'architecture' && (
              <ArchitectureDiagram
                architecture={(plan as Record<string, unknown>).architecture as Record<string, unknown> | undefined}
              />
            )}
            {activeTab === 'techstack' && (
              <TechStackCards
                techStack={
                  (((plan as Record<string, unknown>).tech_stack as Array<{ layer: string; technology: string; justification: string; alternatives?: string[] }>) || [])
                }
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
          className="glass-card rounded-xl p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-7 h-7 text-violet-400" />
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
    </div>
  )
}
