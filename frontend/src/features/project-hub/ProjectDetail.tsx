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
  Activity,
  User
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  active_tab?: string;
}
import PlanViewer from './PlanViewer'
import ArchitectureDiagram from './ArchitectureDiagram'
import TechStackCards from './TechStackCards'
import TimelineView from './TimelineView'
import ExportButton from './ExportButton'
import GenerationConfigModal from './GenerationConfigModal'
import GenerationPipeline from './GenerationPipeline'
import TeamSettingsModal from './TeamSettingsModal'
import ActivityFeed from './ActivityFeed'
import ProjectSidekick from './ProjectSidekick'

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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

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

  const { user } = useAuthStore()
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  // TTS State
  const [isNarrating, setIsNarrating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await projectsApi.get(id)
      setActiveProject(res.data)
      
      // Mark project as viewed to clear unread badges
      try {
        await projectsApi.markViewed(id)
      } catch (err) {
        console.warn('Failed to mark project as viewed:', err)
      }
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

  // Realtime Presence and Sync
  useEffect(() => {
    if (!id || !user) return

    const channel = supabase.channel(`project-${id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = Object.values(newState).map((presence: any) => presence[0] as ActiveUser)
        setActiveUsers(users)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, () => {
        // Silently fetch the updated project to sync state
        fetchProject()
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: user.user_metadata?.full_name || user.email,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            active_tab: activeTab,
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, user, fetchProject]) // intentionally omitting activeTab to avoid re-subscribing the whole channel

  // Update presence when tab changes
  useEffect(() => {
    if (!channelRef.current || !user) return
    
    // Only track if channel is already active (to avoid errors before connection)
    channelRef.current.track({
      id: user.id,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url,
      active_tab: activeTab,
    }).catch(console.warn)
  }, [activeTab, user])

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

  // Auto-trigger pipeline for newly created projects (status = 'planning', no plan yet)
  useEffect(() => {
    if (
      activeProject &&
      activeProject.status === 'planning' &&
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

    // Safety checks for specific phases
    let hasDataForPhase = false;
    let phaseName = "";

    if (targetPhase === 'full') {
      hasDataForPhase = !!((activeProject?.project_plan && Object.keys(activeProject.project_plan).length > 0) || 
                        (activeProject?.architecture && Object.keys(activeProject.architecture).length > 0) || 
                        (activeProject?.timeline && Object.keys(activeProject.timeline).length > 0));
      phaseName = "project";
    } else if (targetPhase === 'main_plan') {
      hasDataForPhase = !!(activeProject?.project_plan && Object.keys(activeProject.project_plan).length > 0);
      phaseName = "Foundation (Overview)";
    } else if (targetPhase === 'architecture') {
      hasDataForPhase = !!(activeProject?.architecture && Object.keys(activeProject.architecture).length > 0);
      phaseName = "Blueprint (Architecture & Tech Stack)";
    } else if (targetPhase === 'roadmap') {
      const tl = activeProject?.timeline as Record<string, any> | undefined;
      hasDataForPhase = !!(tl && (
        (Array.isArray(tl.roadmap) && tl.roadmap.length > 0) ||
        (Array.isArray(tl.timeline) && tl.timeline.length > 0)
      ));
      phaseName = "Timeline & Roadmap";
    }

    if (hasDataForPhase) {
      const msg = targetPhase === 'full' 
        ? "You have already generated parts of this project. Building the full plan from scratch will overwrite all your manual edits. Are you sure you want to continue?"
        : `You have already generated the ${phaseName} for this project. Regenerating it will overwrite all your manual edits in this section. Are you sure you want to continue?`;
        
      const confirmed = window.confirm(msg);
      if (!confirmed) return;
    }

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
            onClick={() => navigate(window.location.pathname.startsWith('/shared-projects') ? '/shared-projects' : '/projects')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:text-blue-300"
          >
            ← Back to {window.location.pathname.startsWith('/shared-projects') ? 'Shared Projects' : 'Projects'}
          </button>
        </div>
      </div>
    )
  }

  const plan = activeProject.project_plan as Record<string, unknown> | null
  const hasPlan = !!(plan && !plan.error && Object.keys(plan).length > 0)

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-full p-6 lg:p-8 relative">
      {/* Config Modal */}
      <GenerationConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfirm={handleGeneratePlan}
        hasExistingPlan={hasPlan}
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
            <p className="text-sm text-muted-foreground max-w-2xl mb-3">
              {activeProject.idea_text}
            </p>
            {(activeProject as any).last_activity && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500/80 font-medium bg-slate-100/50 dark:bg-slate-800/30 w-fit px-2.5 py-1.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                {(activeProject as any).last_activity.user_avatar ? (
                  <img src={(activeProject as any).last_activity.user_avatar} alt="Avatar" className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>
                  Last edited by {(activeProject as any).last_activity.user_full_name?.split(' ')[0] || 'someone'} {formatRelativeTime((activeProject as any).last_activity.created_at)}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasPlan ? (
              activeProject.role !== 'viewer' ? (
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
              ) : null
            ) : (
              <>
                <ExportButton projectId={activeProject.id} projectTitle={activeProject.title} />
                {activeProject.role !== 'viewer' && (
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
                )}
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
                {/* Active Users */}
                {activeUsers.length > 0 && (
                  <div className="flex -space-x-2 mr-2">
                    {activeUsers.map((u) => (
                      <div key={u.id} className="relative group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-sm">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              {u.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-[1.5px] border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-1.5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1.5 rounded whitespace-nowrap z-50 pointer-events-none flex flex-col items-center leading-tight shadow-xl">
                          <span className="font-semibold">{u.name}</span>
                          {u.active_tab && (
                            <span className="text-slate-300 text-[10px] capitalize font-medium mt-0.5">
                              Viewing {u.active_tab.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setIsActivityOpen(!isActivityOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg
                             border text-sm font-medium transition-colors ${
                               isActivityOpen 
                                ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                             }`}
                  title="View Activity"
                >
                  <Activity className="w-4 h-4" />
                  Activity
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
      {(hasPlan || isGeneratingPlan) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-full md:w-fit border border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap hide-scrollbar max-w-full">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => !isGeneratingPlan && setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all
                  ${activeTab === tab.key
                    ? 'bg-violet-600/20 text-blue-500 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:bg-slate-800/50'
                  }
                  ${isGeneratingPlan ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={isGeneratingPlan}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {isGeneratingPlan ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="w-full bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8"
              >
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-11/12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-9/12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <PlanViewer 
                    plan={plan as Record<string, unknown>} 
                    onNarrate={handleNarrate} 
                    isNarrating={isNarrating} 
                    readOnly={activeProject.role === 'viewer'}
                    onUpdate={activeProject.role === 'viewer' ? undefined : async (newPlan) => {
                      if (!id || !activeProject) return
                      // Optimistically update the UI
                      updateProject(id, { project_plan: newPlan })
                      try {
                        // Send only changed fields to the backend to prevent concurrent editing overwrites
                        const project_plan_update = Object.keys(newPlan).reduce((acc: any, key) => {
                          if (JSON.stringify((newPlan as any)[key]) !== JSON.stringify((plan as any)[key])) {
                            acc[key] = (newPlan as any)[key]
                          }
                          return acc
                        }, {})
                        
                        if (Object.keys(project_plan_update).length > 0) {
                          await projectsApi.update(id, { project_plan_update })
                        }
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
                      onUpdate={activeProject.role === 'viewer' ? undefined : async (newMermaid) => {
                        if (!id || !activeProject) return
                        const currentArch = (plan as Record<string, unknown>).architecture as Record<string, unknown> || {}
                        const updatedArch = { ...currentArch, mermaid_diagram: newMermaid }
                        const updatedPlan = { ...plan, architecture: updatedArch }
                        
                        updateProject(id, { project_plan: updatedPlan })
                        try {
                          await projectsApi.update(id, { project_plan_update: { architecture: updatedArch } })
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
                    onUpdate={activeProject.role === 'viewer' ? undefined : async (newStack) => {
                      if (!id || !activeProject) return
                      const updatedPlan = { ...plan, tech_stack: newStack }
                      // Optimistically update the UI
                      updateProject(id, { project_plan: updatedPlan })
                      try {
                        // Update the backend safely using partial updates
                        await projectsApi.update(id, { project_plan_update: { tech_stack: newStack } })
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
              </>
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

      {/* Activity Feed Sidebar */}
      {isActivityOpen && (
        <ActivityFeed projectId={id!} />
      )}
      
      {/* AI Sidekick */}
      {id && <ProjectSidekick projectId={id} />}
    </div>
  )
}
