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
  Briefcase,
  Volume2,
  Square,
  Edit2,
  Save,
  X as XIcon,
  Wand2,
  Maximize2,
  Sparkles,
  Loader2,
  Wrench
} from 'lucide-react'
import { useParams } from 'react-router-dom'
import { projectsApi } from '@/lib/api'

interface PlanViewerProps {
  plan: Record<string, any>
  onNarrate?: () => void
  isNarrating?: boolean
  onUpdate?: (newPlan: Record<string, any>) => void
  readOnly?: boolean
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
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
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

export default function PlanViewer({ plan, onNarrate, isNarrating, onUpdate, readOnly }: PlanViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Local state for edits
  const [editSummary, setEditSummary] = useState('')
  const [editPerspective, setEditPerspective] = useState('')

  const pv = plan.problem_validation as Record<string, any> | undefined
  const solutions = plan.existing_solutions as Record<string, any>[] | undefined
  const innovations = plan.innovation_opportunities as Record<string, any>[] | undefined
  const apis = plan.api_datasets as Record<string, any>[] | undefined
  const repos = plan.github_repos as Record<string, any>[] | undefined
  const risks = plan.risks as Record<string, any>[] | undefined
  const docs = plan.documentation as Record<string, any> | undefined

  const handleEditToggle = () => {
    if (!isEditing && pv) {
      setEditSummary(pv.summary || '')
      setEditPerspective(pv.business_perspective || '')
    }
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    if (!onUpdate || !pv) return
    const updatedPlan = {
      ...plan,
      problem_validation: {
        ...pv,
        summary: editSummary,
        business_perspective: editPerspective
      }
    }
    onUpdate(updatedPlan)
    setIsEditing(false)
  }

  // --- Magic Wand Logic ---
  const { id } = useParams<{ id: string }>()
  const [magicEditState, setMagicEditState] = useState<{
    text: string;
    start: number;
    end: number;
    field: 'summary' | 'perspective';
  } | null>(null)
  const [isMagicLoading, setMagicLoading] = useState(false)

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>, field: 'summary' | 'perspective') => {
    const target = e.currentTarget
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start !== end) {
      const selectedText = target.value.substring(start, end)
      setMagicEditState({ text: selectedText, start, end, field })
    } else {
      setMagicEditState(null)
    }
  }

  const executeMagicEdit = async (command: string) => {
    if (!id || !magicEditState) return
    setMagicLoading(true)
    try {
      const contextText = magicEditState.field === 'summary' ? editSummary : editPerspective
      const response = await projectsApi.magicEdit(id, {
        text: magicEditState.text,
        command,
        context: contextText
      })
      const newText = response.data.edited_text

      if (magicEditState.field === 'summary') {
        const updated = editSummary.substring(0, magicEditState.start) + newText + editSummary.substring(magicEditState.end)
        setEditSummary(updated)
      } else {
        const updated = editPerspective.substring(0, magicEditState.start) + newText + editPerspective.substring(magicEditState.end)
        setEditPerspective(updated)
      }
      setMagicEditState(null)
    } catch (err) {
      console.error("Magic Edit failed:", err)
      alert("Failed to apply AI edit.")
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {onUpdate && (
        <div className="flex justify-end mb-2">
          {!readOnly && !isEditing ? (
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Overview
            </button>
          ) : isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          ) : null}
        </div>
      )}
      {/* Problem Validation */}
      {pv && (
        <CollapsibleSection
          title="Problem Validation"
          icon={<Target className="w-4 h-4 text-amber-400" />}
          defaultOpen={true}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            {isEditing ? (
              <div className="relative w-full">
                <textarea
                  value={editSummary}
                  onChange={(e) => {
                    setEditSummary(e.target.value)
                    setMagicEditState(null)
                  }}
                  onMouseUp={(e) => handleSelection(e, 'summary')}
                  onKeyUp={(e) => handleSelection(e, 'summary')}
                  className="w-full min-h-[140px] text-sm bg-white dark:bg-[#111827] border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                />
                {magicEditState?.field === 'summary' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-slate-900 dark:bg-slate-800 text-white p-1.5 rounded-lg shadow-xl border border-slate-700"
                  >
                    <span className="px-2 text-xs font-semibold text-blue-400 border-r border-slate-700 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> AI
                    </span>
                    <button onClick={() => executeMagicEdit("Expand and add more detail")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Maximize2 className="w-3 h-3"/>} Expand
                    </button>
                    <button onClick={() => executeMagicEdit("Make this sound highly technical and professional")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wrench className="w-3 h-3"/>} Technical
                    </button>
                    <button onClick={() => executeMagicEdit("Summarize this to be very concise and punchy")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Summarize
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-w-4xl">{pv.summary as string}</p>
            )}
            {onNarrate && (
              <button
                onClick={onNarrate}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md shrink-0 border text-xs font-medium transition-colors
                           ${isNarrating
                              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                           }`}
                title={isNarrating ? "Stop narration" : "Listen to problem validation summary"}
              >
                {isNarrating ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </>
                )}
              </button>
            )}
          </div>

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
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span> {u}
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

      {/* Business Perspective */}
      {pv?.business_perspective && (
        <CollapsibleSection
          title="Business Perspective"
          icon={<Briefcase className="w-4 h-4 text-emerald-400" />}
          defaultOpen={true}
        >
          <div className={`p-3 rounded-lg ${isEditing ? 'bg-transparent' : 'bg-emerald-500/5 border border-emerald-500/10'}`}>
            {isEditing ? (
              <div className="relative w-full">
                <textarea
                  value={editPerspective}
                  onChange={(e) => {
                    setEditPerspective(e.target.value)
                    setMagicEditState(null)
                  }}
                  onMouseUp={(e) => handleSelection(e, 'perspective')}
                  onKeyUp={(e) => handleSelection(e, 'perspective')}
                  className="w-full min-h-[140px] text-sm bg-white dark:bg-[#111827] border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                />
                {magicEditState?.field === 'perspective' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-slate-900 dark:bg-slate-800 text-white p-1.5 rounded-lg shadow-xl border border-slate-700"
                  >
                    <span className="px-2 text-xs font-semibold text-blue-400 border-r border-slate-700 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> AI
                    </span>
                    <button onClick={() => executeMagicEdit("Expand and add more detail")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Maximize2 className="w-3 h-3"/>} Expand
                    </button>
                    <button onClick={() => executeMagicEdit("Make this sound highly technical and professional")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wrench className="w-3 h-3"/>} Technical
                    </button>
                    <button onClick={() => executeMagicEdit("Summarize this to be very concise and punchy")} disabled={isMagicLoading} className="px-2.5 py-1 text-xs hover:bg-slate-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {isMagicLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Summarize
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-w-4xl">
                {String(pv.business_perspective)}
              </p>
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
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
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
                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
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
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 border
                  ${api.type === 'api' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {(api.type as string)?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{String(api.name)}</span>
                    {api.url && (
                      <a href={String(api.url)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-blue-600 dark:text-blue-400" />
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
                className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800
                           hover:border-blue-200 dark:border-blue-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-600 dark:text-blue-400 transition-colors" />
                  <span className="font-medium text-xs group-hover:text-blue-500 dark:text-blue-300 transition-colors">
                    {repo.name as string}
                  </span>
                  {repo.stars && (
                    <span className="text-[10px] text-muted-foreground">⭐ {repo.stars as string}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{repo.description as string}</p>
                {repo.use_case && (
                  <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-1 italic">
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
              <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
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
            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              {String(docs.proposal_outline)}
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  )
}
