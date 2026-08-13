/**
 * Innovix — Project HUB Page
 *
 * Grid view of all user projects with status cards,
 * create project modal, and navigation to project details.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Rocket,
  Search,
  Clock,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  Network,
  Pin,
  Trash2,
  FolderOpen
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore, type Project } from '@/stores/projectStore'

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; bg: string; hoverClass: string }
> = {
  planning: {
    label: 'Foundation',
    color: 'text-amber-600',
    icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
    bg: 'bg-amber-100',
    hoverClass: 'hover:border-amber-400 hover:ring-1 hover:ring-amber-400 hover:shadow-amber-400/20',
  },
  architecting: {
    label: 'BluePrint',
    color: 'text-purple-600',
    icon: <Network className="w-5 h-5 text-purple-600" />,
    bg: 'bg-purple-100',
    hoverClass: 'hover:border-purple-400 hover:ring-1 hover:ring-purple-400 hover:shadow-purple-400/20',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    bg: 'bg-emerald-100',
    hoverClass: 'hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400 hover:shadow-emerald-400/20',
  },
}

function ProjectCard({ project, idx, isShared = false }: { project: Project, idx: number, isShared?: boolean }) {
  const navigate = useNavigate()
  const { updateProject, removeProject } = useProjectStore()
  
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning
  const hasPlan = !!project.project_plan

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newPinnedStatus = !project.is_pinned
    updateProject(project.id, { is_pinned: newPinnedStatus })
    try {
      await projectsApi.update(project.id, { is_pinned: newPinnedStatus })
      window.dispatchEvent(new CustomEvent('project-pinned'))
    } catch (err) {
      console.error('Failed to toggle pin status:', err)
      updateProject(project.id, { is_pinned: !newPinnedStatus })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await projectsApi.delete(project.id)
      removeProject(project.id)
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
      onClick={() => navigate(isShared ? `/shared-projects/${project.id}` : `/projects/${project.id}`)}
      className={`bg-white rounded-xl p-6 cursor-pointer group
                 border border-gray-200 shadow-sm
                 ${statusCfg?.hoverClass || 'hover:border-gray-400'}
                 hover:shadow-md transition-all duration-200
                 flex flex-col relative overflow-hidden`}
    >
      {/* Role Badge (if shared) */}
      {isShared && project.role && (
        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl z-10">
          {project.role}
        </div>
      )}

      {/* Status + Delete */}
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusCfg?.bg || 'bg-gray-100'}`}>
          {statusCfg?.icon}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full
                        text-[10px] font-bold tracking-widest uppercase ${statusCfg?.bg || 'bg-gray-100'} ${statusCfg?.color || 'text-gray-600'}`}
          >
            {statusCfg?.label ?? project.status}
          </span>
          {!isShared && (
            <button
              onClick={handleTogglePin}
              className={`p-1.5 rounded-md transition-all ${
                project.is_pinned 
                  ? 'text-blue-500 bg-blue-50 opacity-100' 
                  : 'opacity-0 group-hover:opacity-100 hover:bg-blue-50 text-slate-300 hover:text-blue-500'
              }`}
              title={project.is_pinned ? "Unpin Project" : "Pin Project"}
            >
              <Pin className={`w-4 h-4 ${project.is_pinned ? 'fill-current rotate-45' : ''}`} />
            </button>
          )}
          {(!isShared || project.role === 'owner') && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md
                         hover:bg-red-50 text-slate-300 hover:text-red-500
                         transition-all"
              aria-label="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title + Idea */}
      <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-2">
        {project.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-8 flex-1 leading-relaxed">
        {project.idea_text}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-gray-100 pt-5 mt-auto">
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {new Date(project.updated_at).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1 text-blue-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          {hasPlan ? 'View Plan' : 'Open'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.div>
  )
}

export default function ProjectHubPage({ sharedOnly = false }: { sharedOnly?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  const {
    projects,
    setProjects,
    isLoading,
    setLoading,
    addProject,
  } = useProjectStore()

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newIdea, setNewIdea] = useState('')
  const [creating, setCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus)
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

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) {
      setFilterStatus(status)
    }
  }, [searchParams])

  const handleCreate = async () => {
    if (!newTitle.trim() || !newIdea.trim()) return

    setCreating(true)
    try {
      const res = await projectsApi.create({ title: newTitle, idea_text: newIdea })
      addProject(res.data)
      setShowCreate(false)
      setNewTitle('')
      setNewIdea('')
      navigate(`/projects/${res.data.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      alert('Failed to create project. Please try again.')
    } finally {
      setCreating(false)
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

  const myProjects = filtered.filter(p => !p.role || p.role === 'owner')
  const sharedProjects = filtered.filter(p => p.role && p.role !== 'owner')

  return (
    <div className="min-h-full p-6 lg:p-12 max-w-[1400px] mx-auto bg-gray-50/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
      >
        <div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-1">
            Projects Directory
          </h1>
          <p className="text-slate-500">
            Manage and track your active ideation pipelines.
          </p>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'planning', 'architecting', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-all border
                ${
                  filterStatus === status
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50 font-medium'
                }`}
            >
              {status === 'all'
                ? 'All Projects'
                : status === 'planning'
                ? 'Foundation'
                : status === 'architecting'
                ? 'BluePrint'
                : 'Completed'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search and Action Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10"
      >
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200
                       text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none
                       focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {!sharedOnly && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-indigo-600 text-white text-sm font-semibold
                       hover:bg-indigo-700 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </motion.div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 animate-pulse"
            >
              <div className="flex justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="w-20 h-6 bg-gray-100 rounded-full" />
              </div>
              <div className="h-6 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-5/6 mb-8" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (sharedOnly ? sharedProjects.length === 0 : myProjects.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 rounded-xl shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            {sharedOnly 
              ? "No one has shared a project with you yet. When they do, it will appear here." 
              : "Create your first project to get AI-generated plans with architecture, tech stack, and development roadmaps."}
          </p>
          {!sharedOnly && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-indigo-600 text-white text-sm font-semibold
                         hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* My Projects */}
          {!sharedOnly && myProjects.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                My Projects
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {myProjects.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {myProjects.map((project, idx) => (
                    <ProjectCard key={project.id} project={project} idx={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Shared with Me */}
          {sharedOnly && sharedProjects.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                Shared Projects
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {sharedProjects.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {sharedProjects.map((project, idx) => (
                    <ProjectCard key={project.id} project={project} idx={idx} isShared={true} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal (Keeping it light theme) */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">New Project</h2>
                  <p className="text-sm text-slate-500">
                    Describe your idea and we'll generate a complete plan
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., AI-Powered Study Planner"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200
                               text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none
                               focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    id="new-project-title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Your Idea
                  </label>
                  <textarea
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="Describe your project idea in detail — what problem it solves, who it's for, any specific features you have in mind..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200
                               text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none
                               focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                    id="new-project-idea"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-gray-200
                               text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || !newIdea.trim() || creating}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600
                               text-white text-sm font-semibold hover:bg-indigo-700
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all
                               flex items-center justify-center gap-2 shadow-sm"
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
