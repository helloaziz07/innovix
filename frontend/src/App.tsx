/**
 * Innovix — App Root
 *
 * Sets up React Router, auth initialization, and route definitions.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Layout from '@/pages/Layout'
import Dashboard from '@/pages/Dashboard'
import ResetPassword from '@/pages/ResetPassword'
import DeepSearchPage from '@/features/deepsearch/DeepSearchPage'
import ProjectHubPage from '@/features/project-hub/ProjectHubPage'
import ProjectDetail from '@/features/project-hub/ProjectDetail'
import AgentsPage from '@/features/agents/AgentsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

/** Route guard — redirects to login if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

import { AutoTranslator } from '@/components/AutoTranslator'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <AutoTranslator />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes — wrapped in Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/deepsearch" element={<DeepSearchPage />} />
              <Route path="/projects" element={<ProjectHubPage />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/agents" element={<AgentsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
