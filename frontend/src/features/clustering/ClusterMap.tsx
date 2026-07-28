/**
 * Innovix — Cluster Map Component
 *
 * Interactive 2D scatter plot visualization of knowledge clusters.
 * Each point represents a search result, colored by cluster assignment.
 * Pure CSS/SVG implementation — no D3 dependency needed.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ClusterPoint {
  x: number
  y: number
  cluster_id: number
  cluster_label: string
  cluster_color: string
  result_id: string
  title: string
  snippet: string
}

interface ClusterLegend {
  id: number
  label: string
  color: string
  size: number
}

interface ClusterMapProps {
  points: ClusterPoint[]
  clusters: ClusterLegend[]
  onPointClick?: (resultId: string, clusterId: number) => void
  onClusterClick?: (clusterId: number) => void
}

export default function ClusterMap({
  points,
  clusters,
  onPointClick,
  onClusterClick,
}: ClusterMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ClusterPoint | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null)

  const MAP_W = 600
  const MAP_H = 400
  const PADDING = 30
  const POINT_R = 7

  if (!points.length) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No data points to visualize. Generate clusters first.
        </p>
      </div>
    )
  }

  const filteredPoints = selectedCluster !== null
    ? points.filter((p) => p.cluster_id === selectedCluster)
    : points

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCluster(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
            ${selectedCluster === null
              ? 'bg-white/10 border-white/20 text-foreground'
              : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
            }`}
        >
          All ({points.length})
        </button>
        {clusters.map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => {
              setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)
              onClusterClick?.(cluster.id)
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                         border transition-all
              ${selectedCluster === cluster.id
                ? 'border-opacity-60 text-foreground'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
              }`}
            style={
              selectedCluster === cluster.id
                ? { backgroundColor: cluster.color + '25', borderColor: cluster.color + '50' }
                : undefined
            }
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cluster.color }}
            />
            {cluster.label} ({cluster.size})
          </button>
        ))}
      </div>

      {/* SVG Scatter Plot */}
      <div className="relative bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full"
          style={{ maxHeight: '450px' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <g key={frac}>
              <line
                x1={PADDING}
                y1={PADDING + frac * (MAP_H - 2 * PADDING)}
                x2={MAP_W - PADDING}
                y2={PADDING + frac * (MAP_H - 2 * PADDING)}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
              />
              <line
                x1={PADDING + frac * (MAP_W - 2 * PADDING)}
                y1={PADDING}
                x2={PADDING + frac * (MAP_W - 2 * PADDING)}
                y2={MAP_H - PADDING}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Points */}
          {filteredPoints.map((point, idx) => {
            const cx = PADDING + point.x * (MAP_W - 2 * PADDING)
            const cy = PADDING + point.y * (MAP_H - 2 * PADDING)
            const isHovered = hoveredPoint?.result_id === point.result_id

            return (
              <g key={idx}>
                {/* Glow effect on hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={POINT_R + 6}
                    fill={point.cluster_color}
                    opacity={0.15}
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? POINT_R + 2 : POINT_R}
                  fill={point.cluster_color}
                  opacity={0.85}
                  stroke={isHovered ? '#fff' : 'transparent'}
                  strokeWidth={isHovered ? 2 : 0}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onPointClick?.(point.result_id, point.cluster_id)}
                />
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 p-3 rounded-lg
                       bg-black/80 backdrop-blur-sm border border-white/10
                       pointer-events-none z-10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: hoveredPoint.cluster_color }}
              />
              <span className="text-[10px] text-muted-foreground font-medium">
                {hoveredPoint.cluster_label}
              </span>
            </div>
            <p className="text-xs font-medium line-clamp-1">{hoveredPoint.title}</p>
            {hoveredPoint.snippet && (
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {hoveredPoint.snippet}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
