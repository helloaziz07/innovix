/**
 * Innovix — News Digest Component
 *
 * Displays aggregated news articles and recent developments
 * for a research domain in a card-based feed layout.
 */

import { motion } from 'framer-motion'
import {
  ExternalLink,
  Newspaper,
  Clock,
} from 'lucide-react'

interface NewsItem {
  title: string
  url: string
  source: string
  snippet: string
  published_date?: string
  relevance: 'high' | 'medium' | 'low'
  category?: string
  thumbnail?: string
}

interface NewsDigestProps {
  news: NewsItem[]
  isLoading?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  research: 'bg-violet-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  industry: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  product: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  funding: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  regulatory: 'bg-red-500/15 text-red-400 border-red-500/20',
  news: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  article: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
}

export default function NewsDigest({ news, isLoading }: NewsDigestProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 animate-pulse space-y-2.5">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-full" />
            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 bg-slate-50 dark:bg-slate-800/50 rounded-full w-16" />
              <div className="h-5 bg-slate-50 dark:bg-slate-800/50 rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!news.length) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center">
        <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No news found. Try searching for a different domain.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {news.map((item, idx) => {
        const catColor = CATEGORY_COLORS[item.category || 'news'] || CATEGORY_COLORS.news

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 group hover:border-blue-200 dark:border-blue-500/30
                       transition-all duration-300"
          >
            {/* Title */}
            <div className="flex items-start gap-2 mb-2">
              <h4 className="font-semibold text-sm line-clamp-2 flex-1 group-hover:text-blue-500 dark:text-blue-300 transition-colors">
                {item.title}
              </h4>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-blue-600 dark:text-blue-400 transition-colors flex-shrink-0 mt-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Snippet */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {item.snippet}
            </p>

            {/* Footer — source, date, category */}
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              {item.source && (
                <span className="text-muted-foreground font-medium">
                  {item.source}
                </span>
              )}
              {item.published_date && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.published_date}
                </span>
              )}
              {item.category && (
                <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${catColor}`}>
                  {item.category}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
