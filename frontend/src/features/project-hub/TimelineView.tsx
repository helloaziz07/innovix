/**
 * Innovix — Timeline View
 *
 * Interactive timeline showing phased milestones, weekly tasks,
 * and an MVP indicator. Uses a visual Gantt-style bar chart
 * built with CSS (no extra chart libraries needed).
 */

import { motion } from 'framer-motion'
import {
  CalendarDays,
  Flag,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react'

interface TimelineViewProps {
  plan: Record<string, unknown>
}

interface Phase {
  phase: number
  name: string
  duration_weeks: number
  description: string
  milestones: { name: string; deliverables: string[]; priority: string }[]
  dependencies: string[]
}

interface Week {
  week: number
  phase: number
  tasks: string[]
  focus_area: string
}

interface Risk {
  risk: string
  impact: string
  mitigation: string
}

const PHASE_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-violet-500',
]

const PHASE_BG = [
  'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
  'bg-blue-500/10 border-blue-500/20',
  'bg-emerald-500/10 border-emerald-500/20',
  'bg-orange-500/10 border-orange-500/20',
  'bg-pink-500/10 border-pink-500/20',
  'bg-indigo-500/10 border-indigo-500/20',
]

export default function TimelineView({ plan }: TimelineViewProps) {
  const roadmap = (plan.roadmap as Phase[]) || []
  const timeline = (plan.timeline as Week[]) || []
  const totalWeeks = (plan.total_weeks as number) || 8
  const mvpWeek = (plan.mvp_ready_by_week as number) || 4
  const risks = (plan.risks as Risk[]) || []

  if (roadmap.length === 0 && timeline.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No timeline data available.</p>
      </div>
    )
  }

  // Calculate cumulative week positions for the Gantt chart
  let cumulativeWeek = 0
  const phasePositions = roadmap.map((phase) => {
    const start = cumulativeWeek
    cumulativeWeek += phase.duration_weeks
    return { ...phase, startWeek: start, endWeek: cumulativeWeek }
  })

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 text-center">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold">{totalWeeks}</p>
          <p className="text-[10px] text-muted-foreground">Total Weeks</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 text-center">
          <Flag className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold">{roadmap.length}</p>
          <p className="text-[10px] text-muted-foreground">Phases</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold">Week {mvpWeek}</p>
          <p className="text-[10px] text-muted-foreground">MVP Ready</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-1.5" />
          <p className="text-lg font-bold">{risks.length}</p>
          <p className="text-[10px] text-muted-foreground">Risks Identified</p>
        </div>
      </motion.div>

      {/* Gantt Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Development Timeline
        </h3>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-thin">
          <div className="min-w-[500px] md:min-w-0 pr-4">
            {/* Week headers */}
            <div className="relative mb-2 ml-[80px] md:ml-[120px]">
          <div className="flex">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[10px] text-muted-foreground relative"
              >
                W{i + 1}
                {i + 1 === mvpWeek && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 leading-none mt-1 flex flex-col items-center">
                    <span className="text-[9px] text-amber-500 font-bold block mb-0">MVP</span>
                    <span className="text-[8px] text-amber-500 block -mt-0.5">▼</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase bars */}
        <div className="space-y-2 mt-4">
          {phasePositions.map((phase, idx) => {
            const leftPercent = (phase.startWeek / totalWeeks) * 100
            const widthPercent = (phase.duration_weeks / totalWeeks) * 100
            const colorIdx = idx % PHASE_COLORS.length

            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium w-[80px] md:w-[120px] truncate flex-shrink-0">
                  Phase {phase.phase}
                </span>
                <div className="flex-1 relative h-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ delay: idx * 0.15, duration: 0.5, ease: 'easeOut' }}
                    className={`absolute top-0 h-full rounded-lg bg-gradient-to-r ${PHASE_COLORS[colorIdx]}
                               flex items-center px-2 overflow-hidden`}
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="text-[10px] text-white font-medium truncate">
                      {phase.name}
                    </span>
                  </motion.div>

                  {/* MVP marker */}
                  {mvpWeek > phase.startWeek && mvpWeek <= phase.endWeek && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-400 z-10"
                      style={{ left: `${(mvpWeek / totalWeeks) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>
      </motion.div>

      {/* Phase Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Flag className="w-4 h-4 text-emerald-400" />
          Phase Details & Milestones
        </h3>

        {roadmap.map((phase, idx) => {
          const colorIdx = idx % PHASE_BG.length
          const prioIcon: Record<string, React.ReactNode> = {
            critical: <CheckCircle2 className="w-3 h-3 text-red-400 flex-shrink-0" />,
            high: <CheckCircle2 className="w-3 h-3 text-orange-400 flex-shrink-0" />,
            medium: <Circle className="w-3 h-3 text-amber-400 flex-shrink-0" />,
            low: <Circle className="w-3 h-3 text-green-400 flex-shrink-0" />,
          }

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 border ${PHASE_BG[colorIdx]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm">
                    Phase {phase.phase}: {phase.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {phase.description}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-3">
                  <Clock className="w-3 h-3" />
                  {phase.duration_weeks}w
                </span>
              </div>

              {phase.milestones && phase.milestones.length > 0 && (
                <div className="mt-3 space-y-2">
                  {phase.milestones.map((ms, msIdx) => (
                    <div key={msIdx} className="pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        {prioIcon[ms.priority] || <Circle className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                        <span className="text-xs font-medium">{ms.name}</span>
                      </div>
                      {ms.deliverables && (
                        <ul className="space-y-0.5 ml-4">
                          {ms.deliverables.map((d, dIdx) => (
                            <li key={dIdx} className="text-[11px] text-muted-foreground">
                              • {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Weekly Breakdown Table */}
      {timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Weekly Task Breakdown
            </h3>
          </div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-3 text-muted-foreground font-medium w-24">Week</th>
                  <th className="text-left p-3 text-muted-foreground font-medium w-24">Phase</th>
                  <th className="text-left p-3 text-muted-foreground font-medium w-1/3">Focus</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((week, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-200 dark:border-slate-800 ${
                      week.week === mvpWeek ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-3 font-medium align-top">
                      <span className="flex items-center gap-1 mt-1">
                        W{week.week}
                        {week.week === mvpWeek && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold">
                            MVP
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground align-top pt-4">Phase {week.phase}</td>
                    <td className="p-3 text-muted-foreground align-top pt-4">{week.focus_area}</td>
                    <td className="p-3 align-top pt-4">
                      <ul className="space-y-1">
                        {week.tasks.map((task, tIdx) => (
                          <li key={tIdx} className="text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">
                            {task}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
            {timeline.map((week, idx) => (
              <div key={idx} className={`p-4 space-y-3 ${week.week === mvpWeek ? 'bg-amber-500/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">W{week.week}</span>
                    {week.week === mvpWeek && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold">
                        MVP
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
                    Phase {week.phase}
                  </span>
                </div>
                
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Focus</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{week.focus_area}</p>
                </div>
                
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Tasks</span>
                  <ul className="space-y-1.5">
                    {week.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400 leading-relaxed">
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
