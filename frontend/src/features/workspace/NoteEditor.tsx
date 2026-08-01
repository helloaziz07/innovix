/**
 * Innovix — Note Editor Component
 *
 * Simple but polished note editor with tag support.
 * Uses a textarea with markdown preview capability.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  X,
  Tag,
  Plus,
  Bold,
  Italic,
  List,
  Link2,
  Hash,
} from 'lucide-react'

interface NoteEditorProps {
  initialContent?: string
  initialTags?: string[]
  onSave: (content: string, tags: string[]) => void
  onCancel: () => void
  isEditing?: boolean
}

export default function NoteEditor({
  initialContent = '',
  initialTags = [],
  onSave,
  onCancel,
  isEditing = false,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const replacement = `${prefix}${selected || 'text'}${suffix}`

    setContent(content.substring(0, start) + replacement + content.substring(end))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/[0.02]">
        <span className="text-xs text-muted-foreground mr-2 font-medium">
          {isEditing ? 'Edit Note' : 'New Note'}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-1.5 rounded hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="p-1.5 rounded hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertMarkdown('- ')}
          className="p-1.5 rounded hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
          title="List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className="p-1.5 rounded hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Text area */}
      <textarea
        id="note-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your research notes here... (Markdown supported)"
        className="w-full bg-transparent p-4 text-sm min-h-[150px] resize-y
                   placeholder:text-muted-foreground/40 focus:outline-none
                   font-mono leading-relaxed"
        autoFocus
      />

      {/* Tags section */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10
                         text-blue-600 dark:text-blue-400 text-[11px] font-medium border border-blue-200 dark:border-blue-500/30"
            >
              <Hash className="w-2.5 h-2.5" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 hover:text-red-400 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tag..."
              className="bg-transparent text-xs w-20 focus:outline-none placeholder:text-muted-foreground/40"
            />
            {tagInput.trim() && (
              <button
                onClick={handleAddTag}
                className="p-0.5 rounded hover:bg-slate-100 dark:bg-slate-800 text-muted-foreground"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/[0.02]">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground
                     hover:bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(content, tags)}
          disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium
                     bg-violet-600 text-white hover:bg-violet-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {isEditing ? 'Update' : 'Save Note'}
        </button>
      </div>
    </motion.div>
  )
}
