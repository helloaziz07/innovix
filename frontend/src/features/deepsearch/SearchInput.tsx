/**
 * Innovix — DeepSearch Search Input Component
 *
 * Glassmorphic textarea with animated borders, source toggle chips,
 * example prompt pills, and a submit button.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SOURCE_OPTIONS = [
  { id: 'arxiv', label: 'arXiv', icon: '📄', color: 'from-red-500 to-orange-500' },
  { id: 'github', label: 'GitHub', icon: '🔗', color: 'from-gray-500 to-gray-700' },
  { id: 'scholar', label: 'Scholar', icon: '📚', color: 'from-blue-500 to-indigo-500' },
  { id: 'web', label: 'Web', icon: '🌐', color: 'from-emerald-500 to-teal-500' },
]

const EXAMPLE_PROMPTS = [
  'AI-powered food waste reduction in college hostels',
  'Smart campus navigation using indoor positioning',
  'Mental health chatbot for university students',
  'Blockchain-based academic credential verification',
  'Automated code review using large language models',
  'IoT-based smart agriculture monitoring system',
]

interface SearchInputProps {
  onSearch: (query: string, sources: string[]) => void
  isSearching: boolean
}

export default function SearchInput({ onSearch, isSearching }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [selectedSources, setSelectedSources] = useState<string[]>(['arxiv', 'github', 'scholar', 'web'])

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (query.trim().length < 5 || isSearching) return
    onSearch(query.trim(), selectedSources)
  }

  const handleExampleClick = (prompt: string) => {
    setQuery(prompt)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Main Input Area */}
      <div className="relative group">
        {/* Animated gradient border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-2xl opacity-30 group-hover:opacity-50 group-focus-within:opacity-70 transition-opacity duration-500 blur-sm" />

        <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm p-5 rounded-2xl">
          {/* Search icon and textarea */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
              <Search className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                id="deepsearch-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Describe your project idea or research question..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none text-base leading-relaxed min-h-[80px]"
                disabled={isSearching}
                rows={3}
              />

              {/* Clear button */}
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery('')}
                    className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Source Toggles & Submit */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Sources:</span>
              {SOURCE_OPTIONS.map((source) => {
                const isSelected = selectedSources.includes(source.id)
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    disabled={isSearching}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-200 border
                      ${isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-white/20 text-foreground'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-muted-foreground/60 hover:border-slate-200 dark:border-slate-700'
                      }
                    `}
                  >
                    <span>{source.icon}</span>
                    <span>{source.label}</span>
                  </button>
                )
              })}
            </div>

            <Button
              id="deepsearch-submit"
              onClick={handleSubmit}
              disabled={query.trim().length < 5 || isSearching || selectedSources.length === 0}
              size="sm"
              className="shrink-0 gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  DeepSearch
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Example Prompts */}
      <AnimatePresence>
        {!query && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Try an example:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-3 py-1.5 rounded-full text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                             text-muted-foreground hover:bg-slate-100 dark:bg-slate-800 hover:text-foreground
                             hover:border-white/20 transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
