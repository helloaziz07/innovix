/**
 * Innovix — Dashboard Page (Enhanced)
 *
 * Personalized homepage with live data from the dashboard API:
 * project stats, activity feed, quick actions, and AI suggestions.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi, projectsApi } from '@/lib/api'
import {
  Search, Rocket, Plus, TrendingUp, FolderOpen,
  Lightbulb, ArrowRight, Sparkles, BarChart3,
  Brain, BookOpen, Globe, Bot,
  Clock, Activity, FileText, Loader2,
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
              else if (act.type === 'search') navigate('/deepsearch')
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
            <span className="text-[11px] text-muted-foreground w-20 text-right">{s.label}</span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(count > 0 ? 8 : 0, pct)}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full rounded-full flex items-center justify-end pr-2"
                style={{ backgroundColor: s.color + '40' }}
              >
                {count > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: s.color }}>{count}</span>
                )}
              </motion.div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Quick action cards */
function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    { icon: Search, title: 'New DeepSearch', desc: 'Research any idea', to: '/deepsearch', color: 'from-violet-500 to-purple-600' },
    { icon: Plus, title: 'New Project', desc: 'Start a project', to: '/projects', color: 'from-blue-500 to-cyan-500' },
    { icon: Globe, title: 'Trending', desc: 'Domain trends', to: '/intelligence', color: 'from-orange-500 to-amber-500' },
    { icon: Brain, title: 'Clusters', desc: 'Knowledge map', to: '/clusters', color: 'from-indigo-500 to-violet-500' },
    { icon: BookOpen, title: 'Workspace', desc: 'Research notes', to: '/workspaces', color: 'from-emerald-500 to-teal-500' },
    { icon: Bot, title: 'AI Agents', desc: 'Bot assistants', to: '/agents', color: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {actions.map((action, idx) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + idx * 0.05 }}
        >
          <Card
            className="glass-card cursor-pointer group h-full"
            onClick={() => navigate(action.to)}
          >
            <CardContent className="p-3.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-xs mb-0.5">{action.title}</h3>
              <p className="text-[10px] text-muted-foreground">{action.desc}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-1">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground">
          What would you like to research today?
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <div
          onClick={() => navigate('/deepsearch')}
          className="glass-card p-4 flex items-center gap-4 cursor-pointer group glow-purple hover:glow-blue transition-all duration-500"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">
              Enter an idea like{' '}
              <span className="text-foreground font-medium">
                "Build an AI solution to reduce food waste in college hostels"
              </span>
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
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

      {/* Main grid: Quick Actions + Activity + Progress + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick actions — full width on mobile, 2 cols on desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Quick Actions
          </h2>
          <QuickActions />

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
                  'Start your first DeepSearch to discover research opportunities',
                  'Create a project to organize your ideas',
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
