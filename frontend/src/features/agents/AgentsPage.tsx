/**
 * Innovix — AI Agents Page
 *
 * In-app chat interface for interacting with the AI agent,
 * plus setup instructions for Telegram and WhatsApp bots.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export default function AgentsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/agents/chat/history')
        if (res.data.messages?.length) {
          setMessages(res.data.messages)
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await api.post('/agents/chat', { message: text })
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.response,
        timestamp: res.data.timestamp,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickCommands = [
    { cmd: '/search AI healthcare', label: '🔍 Search' },
    { cmd: '/projects', label: '📂 Projects' },
    { cmd: '/ask What trending in AI?', label: '❓ Ask' },
  ]

  return (
    <div className="min-h-full p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Agents</h1>
            <p className="text-sm text-muted-foreground">
              Chat with your AI research assistant
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-card rounded-xl flex flex-col overflow-hidden"
          style={{ minHeight: '500px', maxHeight: '70vh' }}
        >
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="font-semibold mb-2">Innovix AI Assistant</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-5">
                  Ask me anything about your research, search for topics,
                  check project status, or get AI-powered insights.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickCommands.map((qc) => (
                    <button
                      key={qc.cmd}
                      onClick={() => {
                        setInput(qc.cmd)
                        inputRef.current?.focus()
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10
                                 text-muted-foreground hover:bg-white/10 hover:text-foreground
                                 transition-colors"
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                        ${msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md'
                          : 'bg-white/5 border border-white/10 text-foreground rounded-bl-md'
                        }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Bot className="w-3 h-3 text-pink-400" />
                          <span className="text-[10px] text-pink-400 font-medium">Innovix AI</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything... (try /search, /projects, /ask)"
                className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm
                           placeholder:text-muted-foreground/40 focus:outline-none
                           focus:ring-1 focus:ring-pink-500/30 border border-white/10"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600
                           flex items-center justify-center text-white
                           hover:from-pink-500 hover:to-rose-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right sidebar — Bot setup instructions */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Telegram setup */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold">Telegram Bot</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Chat with Innovix directly in Telegram.
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 mb-3">
              <li className="flex gap-1.5">
                <span className="text-violet-400 font-bold">1.</span>
                Open @BotFather on Telegram
              </li>
              <li className="flex gap-1.5">
                <span className="text-violet-400 font-bold">2.</span>
                Create a new bot and copy the token
              </li>
              <li className="flex gap-1.5">
                <span className="text-violet-400 font-bold">3.</span>
                Paste token in backend/.env
              </li>
              <li className="flex gap-1.5">
                <span className="text-violet-400 font-bold">4.</span>
                Run the bot script
              </li>
            </ol>
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] bg-white/5 px-2 py-1 rounded flex-1 truncate font-mono">
                python -m bots.telegram_bot
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('python -m bots.telegram_bot')
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="p-1 rounded hover:bg-white/10 text-muted-foreground"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* WhatsApp setup */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-green-400" />
              </div>
              <h3 className="text-sm font-semibold">WhatsApp Bot</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Connect via Twilio WhatsApp Sandbox.
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 mb-3">
              <li className="flex gap-1.5">
                <span className="text-green-400 font-bold">1.</span>
                Create a Twilio account
              </li>
              <li className="flex gap-1.5">
                <span className="text-green-400 font-bold">2.</span>
                Activate WhatsApp sandbox
              </li>
              <li className="flex gap-1.5">
                <span className="text-green-400 font-bold">3.</span>
                Set webhook URL to /api/agents/whatsapp/webhook
              </li>
              <li className="flex gap-1.5">
                <span className="text-green-400 font-bold">4.</span>
                Add Twilio credentials to .env
              </li>
            </ol>
            <a
              href="https://www.twilio.com/console/sms/whatsapp/sandbox"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-green-400
                         hover:text-green-300 transition-colors"
            >
              Open Twilio Console
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Commands reference */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Available Commands</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { cmd: '/search', desc: 'Quick research' },
                { cmd: '/projects', desc: 'List projects' },
                { cmd: '/status', desc: 'Project details' },
                { cmd: '/remind', desc: 'Set reminder' },
                { cmd: '/ask', desc: 'Ask anything' },
              ].map((c) => (
                <div
                  key={c.cmd}
                  className="flex items-center justify-between py-1 px-2 rounded
                             hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => {
                    setInput(c.cmd + ' ')
                    inputRef.current?.focus()
                  }}
                >
                  <code className="text-pink-400 font-mono">{c.cmd}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
