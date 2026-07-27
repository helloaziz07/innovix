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
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { title: string; idea_text: string }) =>
    api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  generatePlan: (id: string) =>
    api.post(`/projects/${id}/generate-plan`),
}

/** DeepSearch */
export const deepSearchApi = {
  search: (data: { query: string; project_id?: string; sources?: string[] }) =>
    api.post('/deepsearch', data),
  getResults: (projectId: string) =>
    api.get(`/deepsearch/results/${projectId}`),
}

/** Dashboard */
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

/** Auth */
export const authApi = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/auth/me', data),
}
