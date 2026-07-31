/**
 * Innovix — Dashboard Page
 *
 * The single entry point for the platform. Users type their idea in the
 * main search bar, which creates a project and redirects to Project Detail
 * where the full pipeline (DeepSearch → Plan → Architecture) runs automatically.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi, projectsApi } from '@/lib/api'
import {
  Search, Rocket, FolderOpen,
  Lightbulb, ArrowRight, Sparkles, BarChart3,
  Clock, Activity, FileText, Loader2,
  MessageSquare, Send,
} from 'lucide-react'

// ─── Sub-Components ────────────────────────────────

/** Project overview stat cards with live data */
function ProjectOverviewCards({ stats }: { stats: any }) {
  const cards = [
    { label: 'Projects', value: stats.total_projects || 0, icon: FolderOpen, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/20' },
    { label: 'In Planning', value: stats.projects_by_status?.planning || 0, icon: FileText, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20' },
    { label: 'Building', value: stats.projects_by_status?.building || 0, icon: Rocket, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
    { label: 'Completed', value: stats.projects_by_status?.completed || 0, icon: BarChart3, color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-500/20' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
        >
          <Card className="glass-card hover:scale-[1.02] transition-transform">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

/** Activity feed showing recent actions */
function ActivityFeed({ activities }: { activities: any[] }) {
  const navigate = useNavigate()

  const ICONS: Record<string, any> = {
    project: { icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    search: { icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  }

  if (!activities.length) {
    return (
      <div className="p-6 text-center">
        <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {activities.slice(0, 8).map((act, idx) => {
        const config = ICONS[act.type] || ICONS.project
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
            onClick={() => {
              if (act.type === 'project') navigate(`/projects/${act.entity_id}`)
            }}
          >
            <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">
                <span className="capitalize text-muted-foreground">{act.action}</span>
                {' '}
                <span className="font-medium">{act.title}</span>
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
              {act.timestamp ? formatRelativeTime(act.timestamp) : ''}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Progress chart showing project status distribution */
function ProgressChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const statuses = [
    { key: 'ideation', label: 'Ideation', color: '#a78bfa' },
    { key: 'researching', label: 'Researching', color: '#60a5fa' },
    { key: 'planning', label: 'Planning', color: '#34d399' },
    { key: 'building', label: 'Building', color: '#fbbf24' },
    { key: 'completed', label: 'Completed', color: '#f87171' },
  ]

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-2.5">
      {statuses.map((s) => {
        const count = statusCounts[s.key] || 0
        const pct = (count / total) * 100
        return (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground w-20">{s.label}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Utility ────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Main Dashboard ────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Researcher'

  const [stats, setStats] = useState<any>({})
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search bar state — this is the main entry point
  const [ideaText, setIdeaText] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, actRes] = await Promise.allSettled([
          dashboardApi.get(),
          dashboardApi.getActivity(),
        ])
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data)
        if (actRes.status === 'fulfilled') setActivities(actRes.value.data.activities || [])
      } catch (err) {
        console.error('Dashboard fetch failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  /** Main action: Create project from idea and redirect */
  const handleStartResearch = async () => {
    const trimmed = ideaText.trim()
    if (!trimmed || isCreating) return

    setIsCreating(true)
    try {
      // Generate a title from the idea (first 60 chars)
      const title = trimmed.length > 60
        ? trimmed.slice(0, 57) + '...'
        : trimmed

      const res = await projectsApi.create({ title, idea_text: trimmed })
      // Backend returns MessageResponse: { message, success, data: { id, ... } }
      // Axios wraps it: res.data = { message, success, data: { id, ... } }
      const projectId = res.data?.data?.id || res.data?.id
      if (projectId) {
        navigate(`/projects/${projectId}`)
      } else {
        console.error('No project ID in response:', res.data)
        setIsCreating(false)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      setIsCreating(false)
    }
  }

  const exampleIdeas = [
    'Build an AI solution to reduce food waste in college hostels',
    'Create a smart attendance system using face recognition',
    'Develop a mental health chatbot for university students',
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-1">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground">
          Enter your idea below and we'll handle everything — research, analysis, and planning.
        </p>
      </motion.div>

      {/* ── Main Search Bar (Entry Point) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <Card className="glass-card glow-purple overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Start Your Research</h2>
                  <p className="text-xs text-muted-foreground">Describe your idea — we'll research, analyze, and plan it for you</p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleStartResearch()
                    }
                  }}
                  placeholder='e.g. "Build an AI solution to reduce food waste in college hostels"'
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-14
                             text-sm placeholder:text-muted-foreground/50 resize-none
                             focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30
                             transition-all min-h-[56px] max-h-[120px]"
                  rows={2}
                  disabled={isCreating}
                />
                <button
                  onClick={handleStartResearch}
                  disabled={!ideaText.trim() || isCreating}
                  className="absolute right-3 bottom-3 w-9 h-9 rounded-lg
                             bg-gradient-to-br from-violet-500 to-indigo-500
                             flex items-center justify-center
                             hover:scale-105 active:scale-95 transition-transform
                             disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Example ideas */}
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              <span className="text-[10px] text-muted-foreground/50 self-center mr-1">Try:</span>
              {exampleIdeas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => setIdeaText(idea)}
                  className="text-[11px] px-2.5 py-1 rounded-full
                             bg-violet-500/10 text-violet-300/80
                             hover:bg-violet-500/20 hover:text-violet-200
                             transition-colors border border-violet-500/10"
                >
                  {idea.length > 45 ? idea.slice(0, 42) + '...' : idea}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="h-6 bg-white/10 rounded w-8" />
                  <div className="h-3 bg-white/5 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <ProjectOverviewCards stats={stats} />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — Recent Projects + Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Recent Projects Quick Access */}
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-400" />
            Recent Projects
          </h2>
          {stats.recent_projects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.recent_projects.slice(0, 4).map((proj: any, idx: number) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                >
                  <Card
                    className="glass-card cursor-pointer group h-full hover:scale-[1.01] transition-transform"
                    onClick={() => navigate(`/projects/${proj.id}`)}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                          <Rocket className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-xs mb-0.5 truncate">{proj.title}</h3>
                          <p className="text-[10px] text-muted-foreground capitalize">{proj.status || 'ideation'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-violet-400/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No projects yet. Enter your idea above to get started!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Progress chart */}
          {stats.total_projects > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Research Progress
              </h2>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <ProgressChart statusCounts={stats.projects_by_status || {}} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Connect Bots — compact card */}
          <div className="mt-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              Mobile Companion
            </h2>
            <a
              href="https://t.me/InnovixAIBot"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="glass-card hover:scale-[1.02] transition-transform cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                      <Send className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-0.5">Connect Telegram or WhatsApp</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Get project reminders, ask questions, and track progress from your phone.
                        Click to open the Telegram bot →
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </motion.div>

        {/* Right column — Activity + Suggestions */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* Activity Feed */}
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Activity
            </h2>
            <Card className="glass-card">
              <CardContent className="p-0">
                <ActivityFeed activities={activities} />
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions */}
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              AI Suggestions
            </h2>
            <Card className="glass-card">
              <CardContent className="p-3 space-y-2">
                {(stats.recommendations || [
                  'Enter your project idea above to start the full research pipeline',
                  'Our AI will research, analyze gaps, and build your project plan automatically',
                ]).map((rec: string, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-accent/50 text-xs leading-relaxed
                               hover:bg-accent transition-colors cursor-pointer"
                  >
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
