/**
 * Innovix — Gap Analysis Component
 *
 * Visual card showing identified research gaps and innovation
 * opportunities from the AI analysis.
 */

import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, AlertTriangle, Rocket } from 'lucide-react'

interface GapAnalysisProps {
  content: string
}

export default function GapAnalysis({ content }: GapAnalysisProps) {
  if (!content || content.startsWith('⚠️')) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="w-full"
    >
      <div className="relative group">
        {/* Gradient border glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-rose-500/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

        <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gap Analysis & Innovation Opportunities</h3>
              <p className="text-xs text-muted-foreground">Areas where you can differentiate and innovate</p>
            </div>
          </div>

          {/* Content — rendered as structured cards if possible */}
          <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-foreground prose-headings:font-semibold
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-strong:text-foreground
                        prose-li:text-muted-foreground">
            <GapMarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}


/**
 * Renders gap analysis markdown with section-specific icons and styling.
 */
function GapMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listKey = 0

  const SECTION_ICONS: Record<string, JSX.Element> = {
    "what's missing": <AlertTriangle className="w-4 h-4 text-amber-400" />,
    'missing': <AlertTriangle className="w-4 h-4 text-amber-400" />,
    'innovation': <TrendingUp className="w-4 h-4 text-emerald-400" />,
    'opportunities': <TrendingUp className="w-4 h-4 text-emerald-400" />,
    'recommended': <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    'approach': <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  }

  const getIcon = (title: string) => {
    const lower = title.toLowerCase()
    for (const [key, icon] of Object.entries(SECTION_ICONS)) {
      if (lower.includes(key)) return icon
    }
    return <Lightbulb className="w-4 h-4 text-amber-400" />
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`gap-list-${listKey}`} className="space-y-2 mb-4 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mt-2 shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatGapInline(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
      listKey++
    }
  }

  let lineIndex = 0
  for (const line of lines) {
    const key = lineIndex
    lineIndex++

    if (line.startsWith('## ') || line.startsWith('### ')) {
      flushList()
      const title = line.replace(/^#+\s*/, '')
      elements.push(
        <div key={key} className="flex items-center gap-2 mt-5 mb-2">
          {getIcon(title)}
          <h4 className="text-sm font-semibold text-foreground"
              dangerouslySetInnerHTML={{ __html: formatGapInline(title) }} />
        </div>
      )
    } else if (line.startsWith('# ')) {
      flushList()
      const title = line.slice(2)
      elements.push(
        <div key={key} className="flex items-center gap-2 mt-4 mb-2">
          {getIcon(title)}
          <h3 className="text-base font-semibold text-foreground"
              dangerouslySetInnerHTML={{ __html: formatGapInline(title) }} />
        </div>
      )
    } else if (line.match(/^[-*]\s/)) {
      listItems.push(line.slice(2))
    } else if (line.match(/^\d+\.\s/)) {
      listItems.push(line.replace(/^\d+\.\s/, ''))
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={key} className="text-sm text-muted-foreground leading-relaxed mb-2"
           dangerouslySetInnerHTML={{ __html: formatGapInline(line) }} />
      )
    }
  }
  flushList()

  return <>{elements}</>
}

function formatGapInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-300 text-xs">$1</code>')
}
