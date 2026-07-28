/**
 * Innovix — Project HUB Page
 *
 * Grid view of all user projects with status cards,
 * create project modal, and navigation to project details.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Rocket,
  Search,
  FolderOpen,
  Clock,
  Sparkles,
  ChevronRight,
  Lightbulb,
  Wrench,
  CheckCircle2,
  X,
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore, type Project } from '@/stores/projectStore'

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; bg: string }
> = {
  ideation: {
    label: 'Ideation',
    color: 'text-amber-400',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  researching: {
    label: 'Researching',
    color: 'text-blue-400',
    icon: <Search className="w-3.5 h-3.5" />,
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  planning: {
    label: 'Planning',
    color: 'text-violet-400',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  building: {
    label: 'Building',
    color: 'text-emerald-400',
    icon: <Wrench className="w-3.5 h-3.5" />,
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-400',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bg: 'bg-green-500/10 border-green-500/20',
  },
}

export default function ProjectHubPage() {
  const navigate = useNavigate()
  const {
    projects,
    setProjects,
    isLoading,
    setLoading,
    addProject,
    removeProject,
  } = useProjectStore()

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newIdea, setNewIdea] = useState('')
  const [creating, setCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await projectsApi.list()
      setProjects(res.data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [setProjects, setLoading])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreate = async () => {
    if (!newTitle.trim() || !newIdea.trim()) return
    setCreating(true)
    try {
      const res = await projectsApi.create({
        title: newTitle.trim(),
        idea_text: newIdea.trim(),
      })
      const newProject = res.data.data as Project
      addProject(newProject)
      setShowCreate(false)
      setNewTitle('')
      setNewIdea('')
      navigate(`/projects/${newProject.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await projectsApi.delete(id)
      removeProject(id)
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const filtered = projects.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.idea_text.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Project HUB</h1>
            <p className="text-sm text-muted-foreground">
              AI-generated project plans from your research
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-violet-600 to-purple-600
                     text-white text-sm font-medium
                     hover:from-violet-500 hover:to-purple-500
                     transition-all shadow-lg shadow-violet-500/20"
          id="create-project-btn"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10
                       text-sm placeholder:text-muted-foreground focus:outline-none
                       focus:border-violet-500/50 transition-colors"
            id="project-search-input"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...Object.keys(STATUS_CONFIG)].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${
                  filterStatus === status
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                }`}
            >
              {status === 'all'
                ? `All (${projects.length})`
                : `${STATUS_CONFIG[status]?.label} (${projects.filter((p) => p.status === status).length})`}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="h-5 bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
              <div className="h-6 bg-white/5 rounded-full w-20 mt-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first project to get AI-generated plans with
            architecture, tech stack, and development roadmaps.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-gradient-to-r from-violet-600 to-purple-600
                       text-white text-sm font-medium
                       hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((project, idx) => {
              const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.ideation
              const hasPlan = !!project.project_plan

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-card rounded-xl p-5 cursor-pointer group
                             hover:border-violet-500/30 transition-all duration-300
                             hover:shadow-lg hover:shadow-violet-500/5"
                >
                  {/* Status + Delete */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                  text-xs font-medium border ${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''}`}
                    >
                      {statusCfg?.icon}
                      {statusCfg?.label ?? project.status}
                    </span>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg
                                 hover:bg-red-500/20 text-muted-foreground hover:text-red-400
                                 transition-all"
                      aria-label="Delete project"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title + Idea */}
                  <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-violet-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {project.idea_text}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPlan ? 'View Plan' : 'Open'}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-lg border border-white/10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">New Project</h2>
                  <p className="text-xs text-muted-foreground">
                    Describe your idea and we'll generate a complete plan
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., AI-Powered Study Planner"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                               text-sm placeholder:text-muted-foreground/50 focus:outline-none
                               focus:border-violet-500/50 transition-colors"
                    id="new-project-title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Your Idea
                  </label>
                  <textarea
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="Describe your project idea in detail — what problem it solves, who it's for, any specific features you have in mind..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                               text-sm placeholder:text-muted-foreground/50 focus:outline-none
                               focus:border-violet-500/50 transition-colors resize-none"
                    id="new-project-idea"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                               text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || !newIdea.trim() || creating}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600
                               text-white text-sm font-medium hover:from-violet-500 hover:to-purple-500
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all
                               flex items-center justify-center gap-2"
                    id="submit-project-btn"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
