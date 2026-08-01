/**
 * Innovix — Citation Panel Component
 *
 * Collapsible side panel showing all numbered citations
 * with links to source URLs. Matches inline citation markers
 * in the AI summary.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface Citation {
  number: number
  title: string
  url: string
  source_type: string
}

const SOURCE_ICONS: Record<string, string> = {
  arxiv: '📄',
  github: '🔗',
  scholar: '📚',
  web: '🌐',
}

interface CitationPanelProps {
  citations: Citation[]
}

export default function CitationPanel({ citations }: CitationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (citations.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
        id="citation-panel-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">
            Citations ({citations.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Citation List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 max-h-[60vh] overflow-y-auto">
              {citations.map((citation) => (
                <a
                  key={citation.number}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 p-2.5 rounded-lg
                             hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group"
                  id={`citation-${citation.number}`}
                >
                  {/* Number badge */}
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/40
                                   text-blue-500 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {citation.number}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary
                                  transition-colors line-clamp-2 leading-relaxed">
                      {citation.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground/60">
                        {SOURCE_ICONS[citation.source_type] || '📎'} {citation.source_type}
                      </span>
                    </div>
                  </div>

                  {/* External link icon */}
                  <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground
                                           transition-colors shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
