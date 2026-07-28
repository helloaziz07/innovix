/**
 * Innovix — Plan Viewer
 *
 * Renders the structured project plan JSON into beautiful collapsible sections:
 * Problem Validation, Existing Solutions, Innovation Opportunities,
 * APIs & Datasets, GitHub Repos, Risks, and Documentation.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Target,
  Search,
  Lightbulb,
  Link2,
  GitBranch,
  AlertTriangle,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

interface PlanViewerProps {
  plan: Record<string, any>
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlanViewer({ plan }: PlanViewerProps) {
  const pv = plan.problem_validation as Record<string, any> | undefined
  const solutions = plan.existing_solutions as Record<string, any>[] | undefined
  const innovations = plan.innovation_opportunities as Record<string, any>[] | undefined
  const apis = plan.api_datasets as Record<string, any>[] | undefined
  const repos = plan.github_repos as Record<string, any>[] | undefined
  const risks = plan.risks as Record<string, any>[] | undefined
  const docs = plan.documentation as Record<string, any> | undefined

  return (
    <div className="space-y-3">
      {/* Problem Validation */}
      {pv && (
        <CollapsibleSection
          title="Problem Validation"
          icon={<Target className="w-4 h-4 text-amber-400" />}
          defaultOpen={true}
        >
          <p className="text-muted-foreground mb-3">{pv.summary as string}</p>

          {pv.market_size && (
            <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <span className="text-xs font-medium text-amber-400 block mb-1">Market Size</span>
              <p className="text-xs text-muted-foreground">{String(pv.market_size)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(pv.target_users as string[] | undefined)?.length && (
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-1.5">
                  🎯 Target Users
                </span>
                <ul className="space-y-1">
                  {(pv.target_users as string[]).map((u, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-violet-400 mt-0.5">•</span> {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(pv.pain_points as string[] | undefined)?.length && (
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-1.5">
                  😤 Pain Points
                </span>
                <ul className="space-y-1">
                  {(pv.pain_points as string[]).map((p, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Existing Solutions */}
      {solutions && solutions.length > 0 && (
        <CollapsibleSection
          title={`Existing Solutions (${solutions.length})`}
          icon={<Search className="w-4 h-4 text-blue-400" />}
        >
          <div className="space-y-3">
            {solutions.map((sol, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-xs">{sol.name as string}</span>
                  {sol.pricing && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {String(sol.pricing)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{String(sol.description)}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-green-400 flex items-center gap-1 mb-1">
                      <ThumbsUp className="w-3 h-3" /> Pros
                    </span>
                    <ul className="space-y-0.5">
                      {(sol.pros as string[] | undefined)?.map((p, i) => (
                        <li key={i} className="text-muted-foreground">• {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-red-400 flex items-center gap-1 mb-1">
                      <ThumbsDown className="w-3 h-3" /> Cons
                    </span>
                    <ul className="space-y-0.5">
                      {(sol.cons as string[] | undefined)?.map((c, i) => (
                        <li key={i} className="text-muted-foreground">• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Innovation Opportunities */}
      {innovations && innovations.length > 0 && (
        <CollapsibleSection
          title={`Innovation Opportunities (${innovations.length})`}
          icon={<Lightbulb className="w-4 h-4 text-yellow-400" />}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {innovations.map((inn, idx) => {
              const impactColor = {
                high: 'text-red-400 bg-red-500/10 border-red-500/20',
                medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                low: 'text-green-400 bg-green-500/10 border-green-500/20',
              }[inn.impact as string] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'

              return (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-xs">{String(inn.area)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${impactColor}`}>
                      {String(inn.impact).toUpperCase()} impact
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{String(inn.description)}</p>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* APIs & Datasets */}
      {apis && apis.length > 0 && (
        <CollapsibleSection
          title={`APIs & Datasets (${apis.length})`}
          icon={<Link2 className="w-4 h-4 text-cyan-400" />}
        >
          <div className="space-y-2">
            {apis.map((api, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 border
                  ${api.type === 'api' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {(api.type as string)?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{String(api.name)}</span>
                    {api.url && (
                      <a href={String(api.url)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-violet-400" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{String(api.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* GitHub Repos */}
      {repos && repos.length > 0 && (
        <CollapsibleSection
          title={`GitHub Repositories (${repos.length})`}
          icon={<GitBranch className="w-4 h-4 text-gray-400" />}
        >
          <div className="space-y-2">
            {repos.map((repo, idx) => (
              <a
                key={idx}
                href={repo.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-white/5 border border-white/5
                           hover:border-violet-500/20 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="w-3.5 h-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                  <span className="font-medium text-xs group-hover:text-violet-300 transition-colors">
                    {repo.name as string}
                  </span>
                  {repo.stars && (
                    <span className="text-[10px] text-muted-foreground">⭐ {repo.stars as string}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{repo.description as string}</p>
                {repo.use_case && (
                  <p className="text-xs text-violet-400/70 mt-1 italic">
                    Use: {repo.use_case as string}
                  </p>
                )}
              </a>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Risks */}
      {risks && risks.length > 0 && (
        <CollapsibleSection
          title={`Project Risks (${risks.length})`}
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
        >
          <div className="space-y-2">
            {risks.map((risk, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{risk.risk as string}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border
                      ${
                        risk.impact === 'high'
                          ? 'text-red-400 bg-red-500/10 border-red-500/20'
                          : risk.impact === 'medium'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-green-400 bg-green-500/10 border-green-500/20'
                      }`}
                  >
                    {(risk.impact as string)?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Mitigation:</strong> {risk.mitigation as string}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Documentation / Proposal */}
      {docs && (
        <CollapsibleSection
          title="Project Proposal"
          icon={<FileText className="w-4 h-4 text-emerald-400" />}
        >
          {docs.tagline && (
            <p className="italic text-muted-foreground mb-3">{String(docs.tagline)}</p>
          )}
          {docs.proposal_outline && (
            <div className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
              {String(docs.proposal_outline)}
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  )
}
