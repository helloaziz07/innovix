/**
 * Innovix — Knowledge Clusters Page
 *
 * Main page for knowledge clustering. Users select a project,
 * generate clusters, and visualize the results on a scatter plot
 * with drill-down into individual clusters.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { projectsApi, clustersApi } from '@/lib/api'
import ClusterMap from './ClusterMap'
import ClusterLabels from './ClusterLabels'
import ClusterDetail from './ClusterDetail'

interface Project {
  id: string
  title: string
  idea_text: string
  status: string
}

export default function ClustersPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [_isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Cluster data
  const [vizData, setVizData] = useState<any>(null)
  const [clustersList, setClustersList] = useState<any[]>([])
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null)
  const [clusterResults, setClusterResults] = useState<any[]>([])
  const [error, setError] = useState('')

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.list()
        setProjects(res.data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  const handleGenerateClusters = useCallback(async () => {
    if (!selectedProjectId) return
    setIsGenerating(true)
    setError('')
    setSelectedCluster(null)

    try {
      const res = await clustersApi.generate(selectedProjectId)
      const data = res.data

      setVizData(data.visualization || null)
      setClustersList(data.clusters || [])

      if (!data.clusters?.length) {
        setError(data.message || 'Not enough data to cluster. Run DeepSearches first.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Cluster generation failed'
      setError(msg)
      console.error('Cluster generation failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedProjectId])

  const handleClusterSelect = (clusterId: number | null) => {
    setSelectedCluster(clusterId)
    if (clusterId !== null && vizData) {
      // Filter results for this cluster
      const cluster = clustersList.find((c: any) => c.cluster_id === clusterId)
      if (cluster?.result_ids?.length) {
        // We don't have full result data here, but we have the viz points
        const clusterPoints = (vizData.points || []).filter(
          (p: any) => p.cluster_id === clusterId
        )
        setClusterResults(
          clusterPoints.map((p: any) => ({
            id: p.result_id,
            query: p.title,
            summary: p.snippet,
          }))
        )
      }
    } else {
      setClusterResults([])
    }
  }

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Knowledge Clusters</h1>
            <p className="text-sm text-muted-foreground">
              Group research results into thematic clusters
            </p>
          </div>
        </div>
      </motion.div>

      {/* Project selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <select
          value={selectedProjectId || ''}
          onChange={(e) => {
            setSelectedProjectId(e.target.value || null)
            setVizData(null)
            setClustersList([])
            setSelectedCluster(null)
            setError('')
          }}
          className="flex-1 max-w-md px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                     text-sm focus:outline-none focus:border-violet-500/50 transition-colors
                     [&>option]:bg-[#1a1a2e] [&>option]:text-foreground"
          id="cluster-project-select"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerateClusters}
          disabled={!selectedProjectId || isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-indigo-600 to-violet-600
                     text-white text-sm font-medium
                     hover:from-indigo-500 hover:to-violet-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-lg shadow-indigo-500/10"
          id="generate-clusters-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Clusters
            </>
          )}
        </button>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center mb-6"
        >
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
          <h3 className="font-semibold mb-1">Generating Knowledge Clusters</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Embedding search results, running K-means clustering,
            and generating AI labels. This may take 15–30 seconds.
          </p>
          <div className="flex justify-center gap-6 mt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Embedding
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
              Clustering
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400/30 animate-pulse" style={{ animationDelay: '0.6s' }} />
              Labeling
            </span>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {vizData && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Cluster map + detail layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ClusterMap
                points={vizData.points || []}
                clusters={vizData.clusters || []}
                onClusterClick={handleClusterSelect}
                onPointClick={(_rid, cid) => handleClusterSelect(cid)}
              />
            </div>
            <div>
              {selectedCluster !== null ? (
                <ClusterDetail
                  cluster={
                    clustersList.find((c: any) => c.cluster_id === selectedCluster)
                      ? {
                          id: selectedCluster,
                          label: clustersList.find((c: any) => c.cluster_id === selectedCluster)?.label || '',
                          description: clustersList.find((c: any) => c.cluster_id === selectedCluster)?.description || '',
                          color: clustersList.find((c: any) => c.cluster_id === selectedCluster)?.color || '#8b5cf6',
                          size: clustersList.find((c: any) => c.cluster_id === selectedCluster)?.size || 0,
                          keywords: clustersList.find((c: any) => c.cluster_id === selectedCluster)?.keywords || [],
                        }
                      : null
                  }
                  results={clusterResults}
                  onClose={() => {
                    setSelectedCluster(null)
                    setClusterResults([])
                  }}
                />
              ) : (
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6 text-center h-full flex flex-col items-center justify-center">
                  <Brain className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click a cluster or point to see details
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cluster label cards */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              Cluster Themes
            </h3>
            <ClusterLabels
              clusters={(clustersList || []).map((c: any) => ({
                id: c.cluster_id,
                label: c.label,
                description: c.description || '',
                color: c.color || '#8b5cf6',
                size: c.size || 0,
                keywords: c.keywords || [],
              }))}
              selectedCluster={selectedCluster}
              onSelect={handleClusterSelect}
            />
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!vizData && !isGenerating && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Knowledge Clustering</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Select a project and generate clusters to group your research
            results into thematic clusters using AI-powered embeddings.
          </p>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Run multiple DeepSearches on a project first for better clustering results.
          </p>
        </motion.div>
      )}
    </div>
  )
}
