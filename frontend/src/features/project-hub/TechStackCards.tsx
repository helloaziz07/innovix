/**
 * Innovix — Tech Stack Cards
 *
 * Visual tech stack display grouped by layer (Frontend, Backend, Database, etc.)
 * with technology name, justification, and alternatives.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Server,
  Database,
  Brain,
  Cloud,
  Shield,
  Wrench,
  Puzzle,
  X,
  Plus
} from 'lucide-react'

interface TechItem {
  layer: string
  technology: string
  justification: string
  alternatives?: string[]
}

interface TechStackCardsProps {
  techStack: TechItem[]
  onUpdate?: (newStack: TechItem[]) => void
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

export default function TechStackCards({ techStack, onUpdate }: TechStackCardsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTechLayer, setNewTechLayer] = useState('Frontend')
  const [newTechName, setNewTechName] = useState('')
  const [newTechJustification, setNewTechJustification] = useState('')

  const handleDelete = (indexToDelete: number) => {
    if (onUpdate) {
      const updated = techStack.filter((_, idx) => idx !== indexToDelete)
      onUpdate(updated)
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTechName.trim() || !onUpdate) return
    const layerToUse = existingLayers.includes(newTechLayer) ? newTechLayer : existingLayers[0] || 'Frontend'
    
    const newItem: TechItem = {
      layer: layerToUse,
      technology: newTechName,
      justification: newTechJustification || 'Manually added by user.',
      alternatives: []
    }
    
    onUpdate([...techStack, newItem])
    setIsAdding(false)
    setNewTechName('')
    setNewTechJustification('')
  }
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

  const existingLayers = Array.from(new Set(techStack.map(t => t.layer || 'Other'))).sort()
  const activeNewTechLayer = existingLayers.includes(newTechLayer) ? newTechLayer : existingLayers[0] || 'Frontend'

  return (
    <div className="space-y-6">
      {onUpdate && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Technology
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                  className={`bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 border transition-all duration-300 ${config.borderColor} relative group`}
                >
                  {/* Delete button (shows on hover) */}
                  {onUpdate && (
                    <button
                      onClick={() => {
                        // Find the absolute index in the original techStack array
                        const originalIndex = techStack.findIndex(t => t.technology === item.technology && t.layer === item.layer)
                        if (originalIndex !== -1) handleDelete(originalIndex)
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                      title="Remove technology"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <h4 className="font-semibold text-sm mb-1.5 pr-6">{item.technology}</h4>
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

      {/* Add Technology Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <form
                onSubmit={handleAddSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl relative"
              >
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Add Custom Technology</h4>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Layer / Category</label>
                    <select
                      value={activeNewTechLayer}
                      onChange={(e) => setNewTechLayer(e.target.value)}
                      className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                    >
                      {existingLayers.map(layer => (
                        <option key={layer} value={layer}>{layer}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Technology Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Supabase, Redis..."
                      value={newTechName}
                      onChange={(e) => setNewTechName(e.target.value)}
                      className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Justification / Notes (Optional)</label>
                    <textarea
                      placeholder="Why are you choosing this?"
                      value={newTechJustification}
                      onChange={(e) => setNewTechJustification(e.target.value)}
                      className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 resize-none h-20"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Add Technology
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
