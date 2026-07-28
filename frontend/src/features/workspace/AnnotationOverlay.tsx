/**
 * Innovix — Annotation Overlay Component
 *
 * Displays highlighted annotations from workspace with
 * color-coded highlights and attached notes.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Highlighter,
  MessageSquare,
  Trash2,
  Plus,
  X,
} from 'lucide-react'

interface Annotation {
  id: string
  text: string
  note: string
  source_id?: string
  color: string
  created_at: string
}

interface AnnotationOverlayProps {
  annotations: Annotation[]
  onAdd: (text: string, note: string, color: string) => void
  onDelete: (id: string) => void
}

const HIGHLIGHT_COLORS = [
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#10b981', label: 'Green' },
  { value: '#ec4899', label: 'Pink' },
]

export default function AnnotationOverlay({ annotations, onAdd, onDelete }: AnnotationOverlayProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newNote, setNewNote] = useState('')
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value)

  const handleSave = () => {
    if (!newText.trim()) return
    onAdd(newText.trim(), newNote.trim(), selectedColor)
    setNewText('')
    setNewNote('')
    setIsAdding(false)
  }

  return (
    <div className="space-y-3">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Annotations</h3>
          <span className="text-xs text-muted-foreground">({annotations.length})</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs
                     bg-white/5 border border-white/10 text-muted-foreground
                     hover:bg-white/10 hover:text-foreground transition-colors"
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Add annotation form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-3.5 space-y-3"
          >
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Highlighted text or key quote..."
              className="w-full bg-white/5 rounded-lg p-2.5 text-xs resize-none h-16
                         placeholder:text-muted-foreground/40 focus:outline-none
                         focus:ring-1 focus:ring-violet-500/30"
              autoFocus
            />
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Your note about this..."
              className="w-full bg-white/5 rounded-lg p-2.5 text-xs
                         placeholder:text-muted-foreground/40 focus:outline-none
                         focus:ring-1 focus:ring-violet-500/30"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      selectedColor === c.value ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!newText.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600
                           text-white hover:bg-violet-500 disabled:opacity-50
                           disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations list */}
      {annotations.length === 0 && !isAdding ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <Highlighter className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No annotations yet. Highlight key findings and add notes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {annotations.map((ann, idx) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group relative rounded-lg p-3 transition-colors hover:bg-white/[0.02]"
              style={{ borderLeft: `3px solid ${ann.color}` }}
            >
              <p className="text-xs leading-relaxed" style={{ color: ann.color + 'dd' }}>
                "{ann.text}"
              </p>
              {ann.note && (
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {ann.note}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onDelete(ann.id)}
                  className="p-1 rounded text-muted-foreground/50 hover:text-red-400
                             opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
