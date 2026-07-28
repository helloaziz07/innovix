/**
 * Innovix — Freshness Timeline Component
 *
 * Visualizes the recency distribution of search results
 * using a horizontal bar chart with color-coded bands.
 */

import { motion } from 'framer-motion'
import { Clock, Calendar } from 'lucide-react'

interface FreshnessBand {
  label: string
  count: number
  color: string
}

interface FreshnessTimelineProps {
  bands: FreshnessBand[]
  total: number
  newestDate?: string | null
  oldestDate?: string | null
  isLoading?: boolean
}

export default function FreshnessTimeline({
  bands,
  total,
  newestDate,
  oldestDate,
  isLoading,
}: FreshnessTimelineProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-5 animate-pulse space-y-4">
        <div className="h-5 bg-white/10 rounded w-1/3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 bg-white/10 rounded w-24" />
              <div className="flex-1 h-6 bg-white/5 rounded-full" />
              <div className="h-3 bg-white/10 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!bands.length) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <Clock className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No freshness data available. Run a DeepSearch first.
        </p>
      </div>
    )
  }

  const maxCount = Math.max(...bands.map((b) => b.count), 1)

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-sm">Source Freshness</h3>
        </div>
        <span className="text-xs text-muted-foreground">{total} sources analyzed</span>
      </div>

      {/* Bar chart */}
      <div className="space-y-2.5">
        {bands.map((band, idx) => {
          const widthPct = Math.max(8, (band.count / maxCount) * 100)

          return (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-28 text-right flex-shrink-0">
                {band.label}
              </span>
              <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full flex items-center justify-end pr-2"
                  style={{ backgroundColor: band.color + '33', borderLeft: `3px solid ${band.color}` }}
                >
                  <span className="text-[10px] font-semibold" style={{ color: band.color }}>
                    {band.count}
                  </span>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Date range */}
      {(newestDate || oldestDate) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-muted-foreground">
          {oldestDate && <span>Oldest: {new Date(oldestDate).toLocaleDateString()}</span>}
          {newestDate && <span>Newest: {new Date(newestDate).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  )
}
