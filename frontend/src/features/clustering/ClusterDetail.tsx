/**
 * Innovix — Cluster Detail Component
 *
 * Drill-down view showing all search results within a specific cluster,
 * with the cluster's metadata (label, description, keywords).
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Tag, FileText, X } from 'lucide-react'

interface ClusterResult {
  id: string
  query: string
  summary?: string
  sources?: Array<{
    title: string
    url: string
    source_type: string
    snippet: string
  }>
}

interface ClusterInfo {
  id: number
  label: string
  description: string
  color: string
  size: number
  keywords: string[]
}

interface ClusterDetailProps {
  cluster: ClusterInfo | null
  results: ClusterResult[]
  onClose: () => void
}

export default function ClusterDetail({ cluster, results, onClose }: ClusterDetailProps) {
  if (!cluster) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div
          className="p-4 border-b border-white/5"
          style={{ background: `linear-gradient(135deg, ${cluster.color}15, transparent)` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cluster.color }}
              />
              <div>
                <h3 className="font-semibold text-sm">{cluster.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {cluster.size} result{cluster.size !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground
                         hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cluster.description && (
            <p className="text-xs text-muted-foreground mt-2">{cluster.description}</p>
          )}

          {/* Keywords */}
          {cluster.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cluster.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]
                             font-medium bg-white/5 text-muted-foreground"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No results available for this cluster</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {results.map((result, idx) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <p className="text-xs font-medium mb-1 line-clamp-1">
                    🔍 {result.query}
                  </p>
                  {result.summary && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                      {result.summary}
                    </p>
                  )}

                  {/* Sources preview */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.sources.slice(0, 3).map((src, si) => (
                        <a
                          key={si}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]
                                     bg-white/5 text-muted-foreground hover:text-violet-400
                                     hover:bg-violet-500/10 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {src.title?.substring(0, 25)}...
                        </a>
                      ))}
                      {result.sources.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          +{result.sources.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
