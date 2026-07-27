/**
 * Innovix — Source Card Component
 *
 * Renders an individual search result (paper, repo, article)
 * with source-type badge, metadata, relevance score, and link.
 */

import { motion } from 'framer-motion'
import { ExternalLink, Star, GitFork, Quote, Calendar } from 'lucide-react'

interface SourceData {
  title: string
  url: string
  snippet: string
  source_type: 'arxiv' | 'github' | 'scholar' | 'web'
  relevance_score: number
  metadata: Record<string, unknown>
}

const SOURCE_CONFIG = {
  arxiv: { label: 'arXiv', icon: '📄', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  github: { label: 'GitHub', icon: '🔗', color: 'bg-gray-500/10 text-gray-300 border-gray-500/20' },
  scholar: { label: 'Scholar', icon: '📚', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  web: { label: 'Web', icon: '🌐', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

interface SourceCardProps {
  source: SourceData
  index: number
  citationNumber?: number
}

export default function SourceCard({ source, index, citationNumber }: SourceCardProps) {
  const config = SOURCE_CONFIG[source.source_type] || SOURCE_CONFIG.web

  return (
    <motion.a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="block glass-card p-4 group cursor-pointer"
      id={`source-card-${index}`}
    >
      {/* Header: Badge + Citation Number */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {citationNumber !== undefined && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center">
              {citationNumber}
            </span>
          )}
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
            {config.icon} {config.label}
          </span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
        {source.title}
      </h4>

      {/* Snippet */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
        {source.snippet}
      </p>

      {/* Metadata Row */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 flex-wrap">
        {/* GitHub-specific */}
        {source.source_type === 'github' && (
          <>
            {source.metadata.stars !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                {Number(source.metadata.stars).toLocaleString()}
              </span>
            )}
            {source.metadata.forks !== undefined && (
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {Number(source.metadata.forks).toLocaleString()}
              </span>
            )}
            {source.metadata.language && (
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                {String(source.metadata.language)}
              </span>
            )}
          </>
        )}

        {/* Scholar-specific */}
        {source.source_type === 'scholar' && (
          <>
            {source.metadata.citation_count !== undefined && (
              <span className="flex items-center gap-1">
                <Quote className="w-3 h-3" />
                {Number(source.metadata.citation_count).toLocaleString()} citations
              </span>
            )}
            {source.metadata.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {String(source.metadata.year)}
              </span>
            )}
          </>
        )}

        {/* arXiv-specific */}
        {source.source_type === 'arxiv' && (
          <>
            {source.metadata.authors && (
              <span className="truncate max-w-[200px]">
                {String(source.metadata.authors)}
              </span>
            )}
            {source.metadata.primary_category && (
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                {String(source.metadata.primary_category)}
              </span>
            )}
          </>
        )}

        {/* Relevance score (all types) */}
        {source.relevance_score > 0 && (
          <span className="ml-auto flex items-center gap-1">
            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                style={{ width: `${source.relevance_score * 100}%` }}
              />
            </div>
            <span>{Math.round(source.relevance_score * 100)}%</span>
          </span>
        )}
      </div>
    </motion.a>
  )
}
