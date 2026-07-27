/**
 * Innovix — Result Stream Component
 *
 * Renders the AI-generated summary as it streams, with:
 * - Source discovery progress indicators
 * - Typing animation for streaming tokens
 * - Markdown rendering for the final summary
 * - Animated transitions between states
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle, Brain } from 'lucide-react'

interface ProgressEvent {
  event: string
  step?: string
  message?: string
  source?: string
  count?: number
  error?: string
}

interface ResultStreamProps {
  progress: ProgressEvent[]
  summary: string
  isStreaming: boolean
}

const SOURCE_LABELS: Record<string, { icon: string; label: string }> = {
  arxiv: { icon: '📄', label: 'arXiv Papers' },
  github: { icon: '🔗', label: 'GitHub Repos' },
  scholar: { icon: '📚', label: 'Semantic Scholar' },
  web: { icon: '🌐', label: 'Web Results' },
}

export default function ResultStream({ progress, summary, isStreaming }: ResultStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [progress, summary])

  const sourceEvents = progress.filter(
    (p) => p.event === 'source_found' || p.event === 'source_error'
  )

  const currentStep = [...progress]
    .reverse()
    .find((p) => p.event === 'step')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Progress Header */}
      <div className="glass-card p-4 mb-4 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          {isStreaming ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center animate-pulse-glow">
              <Brain className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">
              {isStreaming
                ? currentStep?.message || 'Researching...'
                : 'Research Complete'}
            </p>
            {isStreaming && (
              <p className="text-xs text-muted-foreground">
                This may take 15-30 seconds
              </p>
            )}
          </div>
        </div>

        {/* Source Discovery Indicators */}
        <div className="flex flex-wrap gap-2">
          {['arxiv', 'github', 'scholar', 'web'].map((sourceId) => {
            const found = sourceEvents.find(
              (e) => e.source === sourceId && e.event === 'source_found'
            )
            const errored = sourceEvents.find(
              (e) => e.source === sourceId && e.event === 'source_error'
            )
            const config = SOURCE_LABELS[sourceId]

            return (
              <motion.div
                key={sourceId}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: found || errored ? 1 : 0.4 }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border
                  ${found
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : errored
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-white/5 border-white/10 text-muted-foreground'
                  }
                `}
              >
                <span>{config?.icon}</span>
                <span>{config?.label}</span>
                {found && (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {found.count}
                  </span>
                )}
                {errored && <AlertCircle className="w-3 h-3" />}
                {!found && !errored && isStreaming && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Summary Content */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            ref={scrollRef}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </span>
              AI Research Summary
            </h3>

            <div className="prose prose-invert prose-sm max-w-none
                          prose-headings:text-foreground prose-headings:font-semibold
                          prose-p:text-muted-foreground prose-p:leading-relaxed
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-li:text-muted-foreground
                          prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline">
              {/* Simple markdown-to-HTML rendering */}
              <MarkdownRenderer content={summary} />
            </div>

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-violet-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


/**
 * Lightweight markdown renderer — converts basic markdown to JSX.
 * For a production app, use react-markdown. This avoids the extra dependency.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey}`} className="list-disc list-inside space-y-1 mb-3">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
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

    // Headers
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={key} className="text-base font-semibold text-foreground mt-4 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(4)) }} />
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={key} className="text-lg font-semibold text-foreground mt-5 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(3)) }} />
      )
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={key} className="text-xl font-bold text-foreground mt-5 mb-3"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
      )
    }
    // List items
    else if (line.match(/^[-*]\s/)) {
      listItems.push(line.slice(2))
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      listItems.push(line.replace(/^\d+\.\s/, ''))
    }
    // Empty line
    else if (line.trim() === '') {
      flushList()
    }
    // Paragraph
    else {
      flushList()
      elements.push(
        <p key={key} className="text-muted-foreground leading-relaxed mb-2"
           dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
  }
  flushList()

  return <>{elements}</>
}


/** Format inline markdown: **bold**, *italic*, `code`, [n] citations */
function formatInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 text-violet-300 text-xs">$1</code>')
    // Citation references [1], [2]
    .replace(
      /\[(\d+)\]/g,
      '<span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] font-bold align-text-top mx-0.5 cursor-pointer">$1</span>'
    )
}
