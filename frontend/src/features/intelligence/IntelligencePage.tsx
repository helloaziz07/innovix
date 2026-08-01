/**
 * Innovix — Web Intelligence Page
 *
 * Main page combining trending topics, news digest, and freshness
 * analysis. Users enter a domain to explore real-time web intelligence.
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  TrendingUp,
  Newspaper,
  Clock,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { intelligenceApi } from '@/lib/api'
import TrendingTopics from './TrendingTopics'
import NewsDigest from './NewsDigest'
import FreshnessTimeline from './FreshnessTimeline'

type ActiveTab = 'trending' | 'news' | 'freshness'

const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
  { key: 'freshness', label: 'Freshness', icon: <Clock className="w-4 h-4" /> },
]

const EXAMPLE_DOMAINS = [
  'artificial intelligence',
  'quantum computing',
  'sustainable energy',
  'biotech',
  'cybersecurity',
  'blockchain',
  'robotics',
  'gene editing',
]

export default function IntelligencePage() {
  const [domain, setDomain] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('trending')
  const [isLoading, setIsLoading] = useState(false)
  const [searchedDomain, setSearchedDomain] = useState('')

  // Data states
  const [trends, setTrends] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [freshness, _setFreshness] = useState<any>({ bands: [], total: 0 })

  const handleSearch = useCallback(async (searchDomain?: string) => {
    const query = searchDomain || domain
    if (!query.trim()) return

    setIsLoading(true)
    setSearchedDomain(query.trim())

    try {
      // Fetch trends and news in parallel
      const [trendsRes, newsRes] = await Promise.allSettled([
        intelligenceApi.getTrending(query.trim()),
        intelligenceApi.getNews(query.trim()),
      ])

      if (trendsRes.status === 'fulfilled') {
        setTrends(trendsRes.value.data.trends || [])
      }
      if (newsRes.status === 'fulfilled') {
        setNews(newsRes.value.data.news || [])
      }
    } catch (err) {
      console.error('Intelligence search failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [domain])

  const handleExampleClick = (example: string) => {
    setDomain(example)
    handleSearch(example)
  }

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Web Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              Real-time trends, news, and competitive insights
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter a research domain (e.g., quantum computing, AI healthcare)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                         text-sm placeholder:text-muted-foreground/50 focus:outline-none
                         focus:border-violet-500/50 transition-colors"
              id="intelligence-search-input"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!domain.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600
                       text-white text-sm font-medium hover:from-orange-400 hover:to-amber-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       flex items-center gap-2 shadow-lg shadow-orange-500/10"
            id="intelligence-search-btn"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze
          </button>
        </div>

        {/* Example domains */}
        {!searchedDomain && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs text-muted-foreground mr-1">Try:</span>
            {EXAMPLE_DOMAINS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700
                           text-xs text-muted-foreground hover:bg-slate-100 dark:bg-slate-800 hover:text-foreground
                           transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Content area */}
      {searchedDomain && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all
                  ${
                    activeTab === tab.key
                      ? 'bg-orange-500/20 text-orange-300 font-medium border border-orange-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:bg-slate-800/50'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === 'trending' && (
              <TrendingTopics
                trends={trends}
                domain={searchedDomain}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'news' && (
              <NewsDigest news={news} isLoading={isLoading} />
            )}
            {activeTab === 'freshness' && (
              <FreshnessTimeline
                bands={freshness.bands || []}
                total={freshness.total || 0}
                newestDate={freshness.newest_date}
                oldestDate={freshness.oldest_date}
                isLoading={isLoading}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!searchedDomain && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Explore Research Trends</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter a research domain above to discover trending topics,
            latest news, and freshness analysis of your research sources.
          </p>
        </motion.div>
      )}
    </div>
  )
}
