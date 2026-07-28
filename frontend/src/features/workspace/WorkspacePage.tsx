/**
 * Innovix — Workspace Page
 *
 * Main research workspace view with tabs for Notes, Saved Results,
 * and Annotations. Users can create/manage workspaces per project.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  StickyNote,
  Bookmark,
  Highlighter,
  Download,
  Trash2,
} from 'lucide-react'
import { api, projectsApi } from '@/lib/api'
import NoteEditor from './NoteEditor'
import SavedResults from './SavedResults'
import AnnotationOverlay from './AnnotationOverlay'
import ExportDialog from './ExportDialog'

type Tab = 'notes' | 'saved' | 'annotations'

interface Workspace {
  id: string
  name: string
  project_id: string
  notes: any[]
  saved_results: string[]
  saved_results_details?: any[]
  annotations: any[]
}

interface Project {
  id: string
  title: string
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [_isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [newWsName, setNewWsName] = useState('')

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.list()
        setProjects(res.data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Fetch workspaces when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setWorkspaces([])
      setActiveWorkspace(null)
      return
    }
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get(`/workspaces/project/${selectedProjectId}`)
        setWorkspaces(res.data.workspaces || [])
        if (res.data.workspaces?.length > 0) {
          loadWorkspace(res.data.workspaces[0].id)
        } else {
          setActiveWorkspace(null)
        }
      } catch (err) {
        console.error('Failed to fetch workspaces:', err)
      }
    }
    fetchWorkspaces()
  }, [selectedProjectId])

  const loadWorkspace = async (id: string) => {
    try {
      const res = await api.get(`/workspaces/${id}`)
      setActiveWorkspace(res.data)
    } catch (err) {
      console.error('Failed to load workspace:', err)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!selectedProjectId || !newWsName.trim()) return
    setIsCreating(true)
    try {
      const res = await api.post('/workspaces', {
        project_id: selectedProjectId,
        name: newWsName.trim(),
      })
      const ws = res.data.workspace
      setWorkspaces((prev) => [ws, ...prev])
      setActiveWorkspace(ws)
      setNewWsName('')
    } catch (err) {
      console.error('Failed to create workspace:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddNote = async (content: string, tags: string[]) => {
    if (!activeWorkspace) return
    try {
      await api.post(`/workspaces/${activeWorkspace.id}/notes`, { content, tags })
      await loadWorkspace(activeWorkspace.id)
      setShowNoteEditor(false)
    } catch (err) {
      console.error('Failed to add note:', err)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!activeWorkspace) return
    try {
      await api.delete(`/workspaces/${activeWorkspace.id}/notes/${noteId}`)
      await loadWorkspace(activeWorkspace.id)
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const handleRemoveResult = async (resultId: string) => {
    if (!activeWorkspace) return
    try {
      await api.delete(`/workspaces/${activeWorkspace.id}/save-result/${resultId}`)
      await loadWorkspace(activeWorkspace.id)
    } catch (err) {
      console.error('Failed to remove result:', err)
    }
  }

  const handleAddAnnotation = async (text: string, note: string, color: string) => {
    if (!activeWorkspace) return
    try {
      await api.post(`/workspaces/${activeWorkspace.id}/annotations`, { text, note, color })
      await loadWorkspace(activeWorkspace.id)
    } catch (err) {
      console.error('Failed to add annotation:', err)
    }
  }

  const handleDeleteAnnotation = async (annId: string) => {
    if (!activeWorkspace) return
    // Annotations are stored in the workspace JSON, we need to filter and update
    const annotations = (activeWorkspace.annotations || []).filter((a: any) => a.id !== annId)
    try {
      await api.patch(`/workspaces/${activeWorkspace.id}`, { annotations })
      await loadWorkspace(activeWorkspace.id)
    } catch (err) {
      console.error('Failed to delete annotation:', err)
    }
  }

  const TABS = [
    { key: 'notes' as Tab, label: 'Notes', icon: <StickyNote className="w-4 h-4" />, count: activeWorkspace?.notes?.length || 0 },
    { key: 'saved' as Tab, label: 'Saved', icon: <Bookmark className="w-4 h-4" />, count: activeWorkspace?.saved_results?.length || 0 },
    { key: 'annotations' as Tab, label: 'Annotations', icon: <Highlighter className="w-4 h-4" />, count: activeWorkspace?.annotations?.length || 0 },
  ]

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Research Workspaces</h1>
            <p className="text-sm text-muted-foreground">
              Organize notes, save results, and annotate findings
            </p>
          </div>
        </div>
      </motion.div>

      {/* Project + Workspace selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <select
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(e.target.value || null)}
          className="flex-1 max-w-xs px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                     text-sm focus:outline-none focus:border-emerald-500/50 transition-colors
                     [&>option]:bg-[#1a1a2e] [&>option]:text-foreground"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        {selectedProjectId && workspaces.length > 0 && (
          <select
            value={activeWorkspace?.id || ''}
            onChange={(e) => e.target.value && loadWorkspace(e.target.value)}
            className="max-w-xs px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                       text-sm focus:outline-none focus:border-emerald-500/50 transition-colors
                       [&>option]:bg-[#1a1a2e] [&>option]:text-foreground"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        )}

        {selectedProjectId && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="New workspace name..."
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm
                         placeholder:text-muted-foreground/40 focus:outline-none
                         focus:border-emerald-500/50 transition-colors w-44"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
            <button
              onClick={handleCreateWorkspace}
              disabled={!newWsName.trim() || isCreating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm
                         font-medium hover:from-emerald-500 hover:to-teal-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        )}
      </motion.div>

      {/* Workspace content */}
      {activeWorkspace ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={activeWorkspace.id}
        >
          {/* Tabs + actions bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all
                    ${activeTab === tab.key
                      ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'notes' && (
                <button
                  onClick={() => setShowNoteEditor(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                             bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                             hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Note
                </button>
              )}
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                           bg-white/5 border border-white/10 text-muted-foreground
                           hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Note editor */}
          {showNoteEditor && (
            <div className="mb-4">
              <NoteEditor
                onSave={handleAddNote}
                onCancel={() => setShowNoteEditor(false)}
              />
            </div>
          )}

          {/* Tab content */}
          <div className="min-h-[300px]">
            {activeTab === 'notes' && (
              <div className="space-y-2.5">
                {(activeWorkspace.notes || []).length === 0 && !showNoteEditor ? (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <StickyNote className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">No notes yet</p>
                    <p className="text-xs text-muted-foreground/70">
                      Click "Add Note" to start writing research notes
                    </p>
                  </div>
                ) : (
                  (activeWorkspace.notes || []).map((note: any, idx: number) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="glass-card rounded-xl p-4 group hover:border-emerald-500/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-400
                                     hover:bg-red-500/10 transition-colors opacity-0
                                     group-hover:opacity-100 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-2">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <SavedResults
                results={activeWorkspace.saved_results_details || []}
                onRemove={handleRemoveResult}
              />
            )}

            {activeTab === 'annotations' && (
              <AnnotationOverlay
                annotations={activeWorkspace.annotations || []}
                onAdd={handleAddAnnotation}
                onDelete={handleDeleteAnnotation}
              />
            )}
          </div>

          {/* Export dialog */}
          <ExportDialog
            isOpen={showExport}
            onClose={() => setShowExport(false)}
            workspaceId={activeWorkspace.id}
            workspaceName={activeWorkspace.name}
          />
        </motion.div>
      ) : (
        /* Empty state */
        !selectedProjectId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-10 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Research Workspaces</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Select a project to view or create workspaces. Organize your
              notes, save important search results, and annotate key findings.
            </p>
          </motion.div>
        )
      )}
    </div>
  )
}
