import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { projectsApi } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
}

export default function ProjectSidekick({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: "Hi! I'm your Innovix AI Assistant. How can I help you with this project?",
        }
      ])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setError(null)
    setIsStreaming(true)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const botMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: botMessageId, role: 'model', content: '' }])

    try {
      const response = await projectsApi.chatStream(
        projectId,
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        abortController.signal
      )

      if (!response.ok) {
        throw new Error('Failed to connect to chat stream')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let currentText = ''
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim()
              if (dataStr === '[DONE]') break

              try {
                const data = JSON.parse(dataStr)
                if (data.error) {
                  throw new Error(data.error)
                }
                if (data.text) {
                  currentText += data.text
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, content: currentText }
                        : msg
                    )
                  )
                }
              } catch (e) {
                console.error("JSON parse error for SSE chunk", dataStr)
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred during chat.')
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-[350px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 origin-bottom-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-violet-600 text-white">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                      }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm text-slate-800 dark:text-slate-200 shadow-sm'
                      }`}>
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 max-w-none">
                          {msg.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <div className="flex items-center gap-1 h-5">
                              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border-t border-red-100 dark:border-red-900/50">
                  {error}
                </div>
              )}

              {/* Input */}
              <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                      placeholder="Ask about your project..."
                      className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 max-h-32 min-h-[40px]"
                      rows={1}
                      disabled={isStreaming}
                    />
                  </div>
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="h-10 w-10 shrink-0 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex items-center justify-center transition-colors"
                      title="Stop generation"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="h-10 w-10 shrink-0 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  )}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-800 text-white dark:bg-slate-700' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
            }`}
        >
          {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />}
        </button>
      </div>
    </>
  )
}
