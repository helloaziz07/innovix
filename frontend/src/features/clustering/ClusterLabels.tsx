/**
 * Innovix — Cluster Labels Component
 *
 * Displays AI-generated thematic labels for each cluster
 * as interactive cards with keywords and size indicators.
 */

import { motion } from 'framer-motion'
import { Brain, Hash } from 'lucide-react'

interface ClusterLabel {
  id: number
  label: string
  description: string
  color: string
  size: number
  keywords: string[]
}

interface ClusterLabelsProps {
  clusters: ClusterLabel[]
  selectedCluster: number | null
  onSelect: (clusterId: number | null) => void
}

export default function ClusterLabels({
  clusters,
  selectedCluster,
  onSelect,
}: ClusterLabelsProps) {
  if (!clusters.length) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <Brain className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No clusters generated yet
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {clusters.map((cluster, idx) => {
        const isSelected = selectedCluster === cluster.id

        return (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onSelect(isSelected ? null : cluster.id)}
            className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-200
              ${isSelected
                ? 'ring-1 shadow-lg'
                : 'hover:border-white/20'
              }`}
            style={
              isSelected
                ? {
                    borderColor: cluster.color + '60',
                    boxShadow: `0 4px 20px ${cluster.color}15`,
                  }
                : undefined
            }
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: cluster.color + '30' }}
              >
                <span style={{ color: cluster.color }}>{cluster.size}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{cluster.label}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {cluster.size} result{cluster.size !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Description */}
            {cluster.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
                {cluster.description}
              </p>
            )}

            {/* Keywords */}
            {cluster.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cluster.keywords.slice(0, 4).map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]
                               bg-white/5 text-muted-foreground"
                  >
                    <Hash className="w-2 h-2" />
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Size bar */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, cluster.size * 15)}%` }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: cluster.color }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
