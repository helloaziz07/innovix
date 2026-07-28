/**
 * Innovix — Trending Topics Component
 *
 * Displays trending research topics for a domain with momentum
 * indicators and relevance badges.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface Trend {
  topic: string
  description: string
  relevance: 'high' | 'medium' | 'low'
  momentum: 'rising' | 'stable' | 'emerging' | 'declining'
  why_important?: string
  related_keywords?: string[]
  growth?: string
}

interface TrendingTopicsProps {
  trends: Trend[]
  domain: string
  isLoading?: boolean
}

const MOMENTUM_CONFIG = {
  rising: {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: 'Rising',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  emerging: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: 'Emerging',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  stable: {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: 'Stable',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  declining: {
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    label: 'Declining',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
}

const RELEVANCE_COLORS = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-gray-500/20 text-gray-400',
}

export default function TrendingTopics({ trends, domain, isLoading }: TrendingTopicsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!trends.length) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No trends found for "{domain}". Try a broader search term.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence>
        {trends.map((trend, idx) => {
          const momentum = MOMENTUM_CONFIG[trend.momentum] || MOMENTUM_CONFIG.stable
          const isExpanded = expandedIdx === idx

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card rounded-xl overflow-hidden cursor-pointer
                         hover:border-violet-500/20 transition-all"
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Rank number */}
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                                  text-xs font-bold text-muted-foreground flex-shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm">{trend.topic}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                        text-[10px] font-medium border ${momentum.bg} ${momentum.color}`}>
                        {momentum.icon}
                        {momentum.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                                        ${RELEVANCE_COLORS[trend.relevance]}`}>
                        {trend.relevance}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {trend.description}
                    </p>
                  </div>

                  {/* Expand toggle */}
                  <div className="text-muted-foreground flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5"
                  >
                    <div className="p-4 pt-3 space-y-3">
                      {trend.why_important && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                            Why It Matters
                          </p>
                          <p className="text-xs text-foreground/80">{trend.why_important}</p>
                        </div>
                      )}
                      {trend.related_keywords && trend.related_keywords.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                            Related Keywords
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {trend.related_keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-muted-foreground"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
