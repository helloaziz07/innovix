import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, BookOpen, Lightbulb, MessageCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HelpDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface AccordionItemProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}

function AccordionItem({ title, icon: Icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-slate-600 dark:text-slate-300 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-[#111827] border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Help & Support</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* Quick Start Guide */}
              <AccordionItem title="Quick Start Guide" icon={Lightbulb} defaultOpen>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Search an Idea:</strong> Head to <span className="font-medium text-blue-500">DeepSearch</span> to validate your concept across Web, arXiv, GitHub, and Scholar.</li>
                  <li><strong>Create a Project:</strong> Once validated, create a new project in the <span className="font-medium text-blue-500">Project Hub</span>.</li>
                  <li><strong>Generate a Plan:</strong> Use the AI to generate a full Architecture, Tech Stack, and Roadmap based on your research.</li>
                  <li><strong>Collaborate:</strong> Invite your team members or ask the <span className="font-medium text-blue-500">AI Sidekick</span> questions about your plan.</li>
                </ol>
              </AccordionItem>

              {/* Feature Guides */}
              <AccordionItem title="Feature Guides" icon={BookOpen}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">DeepSearch</h4>
                    <p className="mt-1">Queries multiple sources in parallel and generates an AI summary with inline citations. Great for initial research.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">AI Sidekick</h4>
                    <p className="mt-1">A project-aware chat assistant. It knows your generated architecture and tech stack, and can answer detailed implementation questions.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Magic Edit</h4>
                    <p className="mt-1">Highlight any text in your generated project plan to expand, simplify, or rewrite it instantly using AI.</p>
                  </div>
                </div>
              </AccordionItem>

              {/* FAQ */}
              <AccordionItem title="Frequently Asked Questions" icon={MessageCircle}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">How do I invite team members?</h4>
                    <p className="mt-1">Go to any of your projects in the Project Hub and click the "Share" or "Team" button in the header. Enter their email address to send an invite link.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">How do I export my plan?</h4>
                    <p className="mt-1">Inside a project, click the "Export" button in the top right. You can download the plan as Markdown, PDF, or a PowerPoint presentation.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">What AI model is used?</h4>
                    <p className="mt-1">Innovix uses Google Gemini (3.5-flash-lite) for deep research summarization, plan generation, and AI Sidekick chats.</p>
                  </div>
                </div>
              </AccordionItem>

              {/* Contact / Feedback */}
              <AccordionItem title="Contact & Feedback" icon={Mail}>
                <p>
                  We are constantly improving Innovix! If you encounter any bugs, have feature requests, or just want to say hi, please reach out to us.
                </p>
                <div className="mt-3 space-y-2">
                  <a 
                    href="https://github.com/helloaziz07/innovix/issues" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Open an Issue on GitHub
                  </a>
                  <a 
                    href="mailto:support@innovix.example.com" 
                    className="flex items-center justify-center w-full py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    Email Support
                  </a>
                </div>
              </AccordionItem>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
