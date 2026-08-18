/**
 * Innovix — API Client
 *
 * Axios instance with Supabase JWT auth interceptor.
 * All backend requests go through this client.
 */

import axios from 'axios'
import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle 401 responses — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// API Functions (typed)
// ============================================

/** Projects */
export const projectsApi = {
  list: (params?: { is_pinned?: boolean, limit?: number }) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { title: string; idea_text: string }) =>
    api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  generatePlan: (id: string) =>
    api.post(`/projects/${id}/generate-plan`),
  /**
   * Start plan generation with real-time SSE progress streaming.
   * Returns a ReadableStream of SSE events for the pipeline tracker.
   *
   * @param id - Project ID
   * @param signal - AbortSignal for cancellation
   * @returns Promise<Response> — the raw fetch Response with body stream
   */
  generatePlanStream: async (id: string, signal?: AbortSignal, targetPhase: string = 'full', teamSize: number = 4): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''
    return fetch(`${API_BASE}/api/projects/${id}/generate-plan-stream?target_phase=${targetPhase}&team_size=${teamSize}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    })
  },
  export: (id: string, format: 'md' | 'pdf' | 'pptx' = 'md') =>
    api.get(`/projects/${id}/export`, {
      params: { format },
      responseType: format === 'md' ? 'text' : 'blob',
    }),
  narrate: (id: string, language: string = 'en') =>
    api.post(`/projects/${id}/narrate`, null, {
      params: { language },
      responseType: 'blob',
    }),
  // --- Team Collaboration ---
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  inviteMember: (id: string, data: { email: string, role: string, technical_role?: string, alias_name?: string }) => 
    api.post(`/projects/${id}/invitations`, data),
  revokeInvitation: (id: string, inviteId: string) =>
    api.delete(`/projects/${id}/invitations/${inviteId}`),
  removeMember: (id: string, userId: string) => 
    api.delete(`/projects/${id}/members/${userId}`),
  magicEdit: (id: string, payload: { text: string; command: string; context?: string }) =>
    api.post(`/projects/${id}/magic-edit`, payload),
  // --- Activity Tracking ---
  markViewed: (id: string) => api.post(`/projects/${id}/view`),
  getActivity: (id: string) => api.get(`/projects/${id}/activity`),
  clearActivity: (id: string) => api.delete(`/projects/${id}/activity`),
  
  // --- Tasks (Automated Assignment) ---
  getTasks: (id: string) => api.get(`/projects/${id}/tasks`),
  updateTask: (id: string, taskId: string, data: any) => api.patch(`/projects/${id}/tasks/${taskId}`, data),
  generateTasks: (id: string, teamSize: number = 4) => api.post(`/projects/${id}/generate-tasks`, null, { params: { team_size: teamSize } }),

  chatStream: async (id: string, messages: { role: string; content: string }[], signal?: AbortSignal): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''
    return fetch(`${API_BASE}/api/projects/${id}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal,
    })
  },
}

/** Invitations */
export const invitationsApi = {
  getDetails: (token: string) => api.get(`/invitations/${token}`),
  accept: (token: string) => api.post(`/invitations/${token}/accept`),
}

/** DeepSearch */
export const deepSearchApi = {
  search: (data: { query: string; project_id?: string; sources?: string[] }) =>
    api.post('/deepsearch', data),
  getResults: (projectId: string) =>
    api.get(`/deepsearch/results/${projectId}`),
  getHistory: () =>
    api.get('/deepsearch/history'),
}

/** Dashboard */
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getActivity: () => api.get('/dashboard/activity'),
}

/** Web Intelligence */
export const intelligenceApi = {
  getTrending: (domain: string, maxResults: number = 10) =>
    api.get('/intelligence/trending', { params: { domain, max_results: maxResults } }),
  getNews: (domain: string, maxResults: number = 15) =>
    api.get('/intelligence/news', { params: { domain, max_results: maxResults } }),
  getFreshness: (projectId: string) =>
    api.get(`/intelligence/freshness/${projectId}`),
  getCompetitors: (projectId: string) =>
    api.get(`/intelligence/competitors/${projectId}`),
}

/** Knowledge Clustering */
export const clustersApi = {
  generate: (projectId: string, k?: number) =>
    api.post(`/clusters/${projectId}/generate`, null, {
      params: k ? { k } : undefined,
    }),
  get: (projectId: string) =>
    api.get(`/clusters/${projectId}`),
}


/** Auth */
export const authApi = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/auth/me', data),
}

// ============================================
// WebSocket Helpers
// ============================================

/**
 * Create a WebSocket connection for DeepSearch streaming.
 * Returns the WebSocket instance — caller manages lifecycle.
 */
export function createDeepSearchStream(): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).host
    : `${window.location.hostname}:8000`
  return new WebSocket(`${protocol}://${host}/api/deepsearch/stream`)
}

