/**
 * Innovix — DeepSearch Page
 *
 * Main search interface that orchestrates SearchInput, ResultStream,
 * SourceCard, CitationPanel, and GapAnalysis components.
 *
 * Supports two modes:
 *  1. REST mode — POST /api/deepsearch (waits for full result)
 *  2. WebSocket mode — WS /api/deepsearch/stream (real-time streaming)
 *
 * Defaults to WebSocket for the streaming experience, with REST as fallback.
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowUp } from 'lucide-react'

import SearchInput from './SearchInput'
import ResultStream from './ResultStream'
import SourceCard from './SourceCard'
import CitationPanel from './CitationPanel'
import GapAnalysis from './GapAnalysis'
import { api } from '@/lib/api'

interface SourceData {
  title: string
  url: string
  snippet: string
  source_type: 'arxiv' | 'github' | 'scholar' | 'web'
  relevance_score: number
  metadata: Record<string, unknown>
}

interface Citation {
  number: number
  title: string
  url: string
  source_type: string
}

interface ProgressEvent {
  event: string
  step?: string
  message?: string
  source?: string
  count?: number
  error?: string
}

interface SearchResult {
  id: string
  query: string
  sources: SourceData[]
  summary: string
  citations: Citation[]
  gap_analysis: string | null
}

type SearchState = 'idle' | 'searching' | 'complete' | 'error'

export default function DeepSearchPage() {
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [progress, setProgress] = useState<ProgressEvent[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [summary, setSummary] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const handleSearch = useCallback(async (query: string, sources: string[]) => {
    // Reset state
    setSearchState('searching')
    setProgress([])
    setResult(null)
    setSummary('')
    setErrorMessage('')

    // Try WebSocket first for streaming experience
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000/api/deepsearch/stream`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ query, sources }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.event === 'result') {
            // Final result received
            setResult(data.data)
            setSummary(data.data.summary || '')
            setSearchState('complete')
            ws.close()
          } else if (data.event === 'error') {
            setErrorMessage(data.message || 'Search failed')
            setSearchState('error')
            ws.close()
          } else {
            // Progress event
            setProgress((prev) => [...prev, data])

            // Update summary if streaming summary
            if (data.event === 'step' && data.step === 'summarizing') {
              setSummary('')  // Clear for incoming summary
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onerror = () => {
        // WebSocket failed — fall back to REST
        ws.close()
        handleRestSearch(query, sources)
      }

      ws.onclose = () => {
        wsRef.current = null
      }
    } catch {
      // WebSocket not available — use REST
      await handleRestSearch(query, sources)
    }
  }, [])

  /** Fallback REST search (non-streaming) */
  const handleRestSearch = async (query: string, sources: string[]) => {
    try {
      setProgress([
        { event: 'step', step: 'searching', message: 'Searching across all sources...' },
      ])

      const response = await api.post('/deepsearch', {
        query,
        sources,
      })

      const data = response.data
      setResult(data)
      setSummary(data.summary || '')
      setSearchState('complete')

      // Simulate source discovery events from the result
      const sourceTypes = [...new Set(data.sources?.map((s: SourceData) => s.source_type) || [])]
      const newProgress: ProgressEvent[] = sourceTypes.map((type) => ({
        event: 'source_found' as const,
        source: type as string,
        count: data.sources?.filter((s: SourceData) => s.source_type === type).length || 0,
      }))
      setProgress((prev) => [...prev, ...newProgress])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed. Please check your API keys and try again.'
      setErrorMessage(errorMsg)
      setSearchState('error')
    }
  }

  const handleNewSearch = () => {
    setSearchState('idle')
    setProgress([])
    setResult(null)
    setSummary('')
    setErrorMessage('')
  }

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">DeepSearch</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered multi-source research engine with citations and gap analysis
        </p>
      </motion.div>

      {/* Search Input — always visible at top when idle, or as "new search" when complete */}
      <AnimatePresence mode="wait">
        {searchState === 'idle' && (
          <motion.div
            key="search-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SearchInput onSearch={handleSearch} isSearching={false} />
          </motion.div>
        )}

        {searchState === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <SearchInput onSearch={handleSearch} isSearching={true} />
            <ResultStream
              progress={progress}
              summary={summary}
              isStreaming={true}
            />
          </motion.div>
        )}

        {searchState === 'complete' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* New Search Button */}
            <div className="flex justify-center">
              <button
                onClick={handleNewSearch}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-muted-foreground
                           hover:bg-slate-100 dark:bg-slate-800 hover:text-foreground transition-all"
                id="new-search-btn"
              >
                <ArrowUp className="w-4 h-4" />
                New Search
              </button>
            </div>

            {/* Progress + Summary */}
            <ResultStream
              progress={progress}
              summary={result.summary}
              isStreaming={false}
            />

            {/* Two-column layout: Sources + Citations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sources Grid (2 columns) */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  📋 Sources ({result.sources.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.sources.map((source, idx) => (
                    <SourceCard
                      key={`${source.url}-${idx}`}
                      source={source}
                      index={idx}
                      citationNumber={
                        result.citations.find((c) => c.url === source.url)?.number
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Citation Panel (1 column) */}
              <div className="lg:col-span-1">
                <CitationPanel citations={result.citations} />
              </div>
            </div>

            {/* Gap Analysis */}
            {result.gap_analysis && (
              <GapAnalysis content={result.gap_analysis} />
            )}
          </motion.div>
        )}

        {searchState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <SearchInput onSearch={handleSearch} isSearching={false} />
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-xl max-w-md mx-auto mt-6">
              <p className="text-red-400 text-sm mb-2">⚠️ Search Error</p>
              <p className="text-muted-foreground text-xs">{errorMessage}</p>
              <button
                onClick={handleNewSearch}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                           text-sm hover:bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
