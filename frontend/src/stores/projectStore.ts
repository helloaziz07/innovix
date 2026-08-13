/**
 * Innovix — Project Store (Zustand)
 *
 * Manages project state: active project, plan generation status,
 * pipeline progress tracking, export state, and project list caching.
 */

import { create } from 'zustand'

export type PipelineStage =
  | 'idle'
  | 'fetching_research'
  | 'main_plan'
  | 'architecture'
  | 'roadmap'
  | 'saving'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface Project {
  id: string
  user_id: string
  title: string
  idea_text: string
  status: 'planning' | 'architecting' | 'completed'
  project_plan: Record<string, unknown> | null
  tech_stack: Record<string, unknown>[] | null
  architecture: Record<string, unknown> | null
  timeline: Record<string, unknown> | null
  is_pinned?: boolean
  created_at: string
  updated_at: string
  last_viewed_at?: string | null
  has_unread_changes?: boolean
  role?: string
}

interface ProjectState {
  // Data
  projects: Project[]
  activeProject: Project | null
  
  // UI state
  isLoading: boolean
  isGeneratingPlan: boolean
  isExporting: boolean

  // Pipeline progress tracking
  pipelineStage: PipelineStage
  pipelineProgress: number
  pipelineMessage: string
  
  // Actions
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  setLoading: (loading: boolean) => void
  setGeneratingPlan: (generating: boolean) => void
  setExporting: (exporting: boolean) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void

  // Pipeline actions
  setPipelineStage: (stage: PipelineStage) => void
  setPipelineProgress: (progress: number) => void
  setPipelineMessage: (message: string) => void
  resetPipeline: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  isGeneratingPlan: false,
  isExporting: false,

  // Pipeline defaults
  pipelineStage: 'idle',
  pipelineProgress: 0,
  pipelineMessage: '',

  setProjects: (projects) => set({ projects }),

  setActiveProject: (project) => set({ activeProject: project }),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      activeProject:
        state.activeProject?.id === id
          ? { ...state.activeProject, ...updates }
          : state.activeProject,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setGeneratingPlan: (isGeneratingPlan) => set({ isGeneratingPlan }),

  setExporting: (isExporting) => set({ isExporting }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject:
        state.activeProject?.id === id ? null : state.activeProject,
    })),

  // Pipeline actions
  setPipelineStage: (pipelineStage) => set({ pipelineStage }),
  setPipelineProgress: (pipelineProgress) => set({ pipelineProgress }),
  setPipelineMessage: (pipelineMessage) => set({ pipelineMessage }),
  resetPipeline: () =>
    set({
      pipelineStage: 'idle',
      pipelineProgress: 0,
      pipelineMessage: '',
      isGeneratingPlan: false,
    }),
}))

