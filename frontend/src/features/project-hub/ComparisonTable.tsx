/**
 * Innovix — Comparison Table
 *
 * Side-by-side comparison of existing solutions from the project plan.
 * Displays pros/cons with visual indicators and pricing info.
 */

import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, ExternalLink, Search } from 'lucide-react'

interface Solution {
  name: string
  description: string
  url?: string
  pros: string[]
  cons: string[]
  pricing: string
}

interface ComparisonTableProps {
  solutions: Solution[]
}

export default function ComparisonTable({ solutions }: ComparisonTableProps) {
  if (!solutions || solutions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center">
        <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No existing solutions analyzed.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          Existing Solution Comparison
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left p-3 text-muted-foreground font-medium min-w-[120px]">
                Solution
              </th>
              <th className="text-left p-3 text-muted-foreground font-medium min-w-[180px]">
                Description
              </th>
              <th className="text-left p-3 text-muted-foreground font-medium min-w-[160px]">
                <span className="flex items-center gap-1 text-green-400">
                  <ThumbsUp className="w-3 h-3" /> Pros
                </span>
              </th>
              <th className="text-left p-3 text-muted-foreground font-medium min-w-[160px]">
                <span className="flex items-center gap-1 text-red-400">
                  <ThumbsDown className="w-3 h-3" /> Cons
                </span>
              </th>
              <th className="text-left p-3 text-muted-foreground font-medium min-w-[80px]">
                Pricing
              </th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((sol, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{sol.name}</span>
                    {sol.url && (
                      <a
                        href={sol.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-blue-600 dark:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{sol.description}</td>
                <td className="p-3">
                  <ul className="space-y-0.5">
                    {sol.pros?.map((pro, i) => (
                      <li
                        key={i}
                        className="text-green-400/80 flex items-start gap-1"
                      >
                        <span className="mt-1">✓</span> {pro}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3">
                  <ul className="space-y-0.5">
                    {sol.cons?.map((con, i) => (
                      <li
                        key={i}
                        className="text-red-400/80 flex items-start gap-1"
                      >
                        <span className="mt-1">✗</span> {con}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border
                      ${
                        sol.pricing?.toLowerCase().includes('free')
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : sol.pricing?.toLowerCase().includes('freemium')
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                  >
                    {sol.pricing || 'N/A'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
