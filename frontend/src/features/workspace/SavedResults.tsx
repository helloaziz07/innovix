/**
 * Innovix — Saved Results Component
 *
 * Displays search results saved to a workspace with
 * source previews and remove functionality.
 */

import { motion } from 'framer-motion'
import {
  ExternalLink,
  Trash2,
  Search,
  Clock,
} from 'lucide-react'

interface SavedResult {
  id: string
  query: string
  summary?: string
  sources?: Array<{
    title: string
    url: string
    source_type: string
    snippet: string
  }>
  created_at?: string
}

interface SavedResultsProps {
  results: SavedResult[]
  onRemove: (resultId: string) => void
  isLoading?: boolean
}

export default function SavedResults({ results, onRemove, isLoading }: SavedResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 animate-pulse space-y-2">
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">No saved results yet</p>
        <p className="text-xs text-muted-foreground/70">
          Save search results from DeepSearch to organize them here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {results.map((result, idx) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          className="glass-card rounded-xl p-4 group hover:border-violet-500/20 transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <h4 className="text-sm font-medium truncate">{result.query}</h4>
            </div>
            <button
              onClick={() => onRemove(result.id)}
              className="p-1 rounded-lg text-muted-foreground hover:text-red-400
                         hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Remove from workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Summary */}
          {result.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 pl-5.5">
              {result.summary}
            </p>
          )}

          {/* Sources preview */}
          {result.sources && result.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-5.5">
              {result.sources.slice(0, 4).map((src, si) => (
                <a
                  key={si}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]
                             bg-white/5 text-muted-foreground hover:text-violet-400
                             hover:bg-violet-500/10 transition-colors border border-white/5"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[120px]">{src.title || src.source_type}</span>
                </a>
              ))}
              {result.sources.length > 4 && (
                <span className="text-[10px] text-muted-foreground px-1 self-center">
                  +{result.sources.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Date */}
          {result.created_at && (
            <div className="flex items-center gap-1 mt-2 pl-5.5 text-[10px] text-muted-foreground/60">
              <Clock className="w-2.5 h-2.5" />
              {new Date(result.created_at).toLocaleDateString()}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
