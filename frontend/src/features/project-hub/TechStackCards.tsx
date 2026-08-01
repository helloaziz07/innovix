/**
 * Innovix — Tech Stack Cards
 *
 * Visual tech stack display grouped by layer (Frontend, Backend, Database, etc.)
 * with technology name, justification, and alternatives.
 */

import { motion } from 'framer-motion'
import {
  Monitor,
  Server,
  Database,
  Brain,
  Cloud,
  Shield,
  Wrench,
  Puzzle,
} from 'lucide-react'

interface TechItem {
  layer: string
  technology: string
  justification: string
  alternatives?: string[]
}

interface TechStackCardsProps {
  techStack: TechItem[]
}

const LAYER_CONFIG: Record<
  string,
  { icon: React.ReactNode; gradient: string; borderColor: string }
> = {
  frontend: {
    icon: <Monitor className="w-4 h-4" />,
    gradient: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
  },
  backend: {
    icon: <Server className="w-4 h-4" />,
    gradient: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
  },
  database: {
    icon: <Database className="w-4 h-4" />,
    gradient: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
  },
  ai: {
    icon: <Brain className="w-4 h-4" />,
    gradient: 'from-blue-500 to-indigo-500',
    borderColor: 'border-blue-200 dark:border-blue-500/30 hover:border-violet-500/40',
  },
  devops: {
    icon: <Cloud className="w-4 h-4" />,
    gradient: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-500/20 hover:border-pink-500/40',
  },
  auth: {
    icon: <Shield className="w-4 h-4" />,
    gradient: 'from-teal-500 to-cyan-500',
    borderColor: 'border-teal-500/20 hover:border-teal-500/40',
  },
  tools: {
    icon: <Wrench className="w-4 h-4" />,
    gradient: 'from-gray-500 to-slate-500',
    borderColor: 'border-gray-500/20 hover:border-gray-500/40',
  },
}

function getLayerConfig(layer: string) {
  const key = layer.toLowerCase()
  for (const [configKey, config] of Object.entries(LAYER_CONFIG)) {
    if (key.includes(configKey)) return config
  }
  return {
    icon: <Puzzle className="w-4 h-4" />,
    gradient: 'from-indigo-500 to-violet-500',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
  }
}

export default function TechStackCards({ techStack }: TechStackCardsProps) {
  if (!techStack || techStack.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center">
        <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tech stack recommendations yet.</p>
      </div>
    )
  }

  // Group by layer
  const grouped = techStack.reduce<Record<string, TechItem[]>>((acc, item) => {
    const layer = item.layer || 'Other'
    if (!acc[layer]) acc[layer] = []
    acc[layer].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([layer, items], groupIdx) => {
        const config = getLayerConfig(layer)

        return (
          <motion.div
            key={layer}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
          >
            {/* Layer Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient}
                            flex items-center justify-center text-white`}
              >
                {config.icon}
              </div>
              <h3 className="text-sm font-semibold">{layer}</h3>
              <span className="text-xs text-muted-foreground">
                ({items.length} {items.length === 1 ? 'technology' : 'technologies'})
              </span>
            </div>

            {/* Tech Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                  className={`bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 border transition-all duration-300 ${config.borderColor}`}
                >
                  <h4 className="font-semibold text-sm mb-1.5">{item.technology}</h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {item.justification}
                  </p>

                  {item.alternatives && item.alternatives.length > 0 && (
                    <div>
                      <span className="text-[10px] text-muted-foreground/60 block mb-1">
                        Alternatives:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.alternatives.map((alt, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/50
                                       text-muted-foreground/70 border border-slate-200 dark:border-slate-800"
                          >
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
