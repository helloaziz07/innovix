/**
 * Innovix — Dashboard Page
 *
 * The single entry point for the platform. Users type their idea in the
 * main search bar, which creates a project and redirects to Project Detail
 * where the full pipeline (DeepSearch → Plan → Architecture) runs automatically.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi, projectsApi } from '@/lib/api'
import { 
  Rocket, 
  Lightbulb,
  ArrowRight,
  Network,
  Layers,
  CheckCircle2,
  MessageSquare,
  Send,
  X,
  Smartphone,
  Mic,
  FolderOpen,
  Sparkles,
  Link,
  Loader2,
  Pin
} from 'lucide-react'

// ─── Sub-Components ────────────────────────────────

/** Project overview stat cards with live data */
function ProjectOverviewCards({ stats }: { stats: any }) {
  const navigate = useNavigate()
  const cards = [
    { label: 'Total Projects', value: stats.total_projects || 0, icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-[#3B82F6]/10', status: 'all' },
    { label: 'Planning', value: stats.projects_by_status?.planning || 0, icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-[#F59E0B]/10', status: 'planning' },
    { label: 'Architecting', value: stats.projects_by_status?.architecting || 0, icon: Network, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-[#A855F7]/10', status: 'architecting' },
    { label: 'Completed', value: stats.projects_by_status?.completed || 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-[#10B981]/10', status: 'completed' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
        >
          <div 
            onClick={() => navigate(stat.status === 'all' ? '/projects' : `/projects?status=${stat.status}`)}
            className="bg-white dark:bg-[#111827] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-[#1F2937] hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}


/** Mobile connection options for Telegram & WhatsApp */
function MobileCompanion() {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)

  // Configure these with your bot details
  const WHATSAPP_NUMBER = "918767950221" // Updated to your actual registered number

  const handleConnect = (platform: 'telegram' | 'whatsapp') => {
    if (!user?.id) return
    let url = ''
    if (platform === 'whatsapp') {
      // Creates the connection deep link
      url = `https://wa.me/${WHATSAPP_NUMBER}?text=connect_${user.id}`
    } else {
      url = `https://t.me/Innooovixx_bot?start=connect_${user.id}`
    }
    window.open(url, '_blank')
    setShowModal(false)
  }

  return (
    <>
      {/* Mobile Companion Card from STITCH */}
      <div className="rounded-xl p-4 relative overflow-hidden bg-white dark:bg-[#111827] shadow-md border border-slate-100 dark:border-[#1F2937] group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-100 dark:bg-[#3B82F6]/20/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <Smartphone className="w-6 h-6" />
            <h3 className="font-bold text-lg">Mobile Companion</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ideate on the go. Sync instantly with your workspace.</p>
          <div className="w-full h-32 bg-slate-50 dark:bg-[#0B1120] rounded border border-slate-100 dark:border-[#1F2937] flex items-center justify-center relative overflow-hidden mb-4">
            <img alt="Telegram WhatsApp Bots" className="object-contain h-full w-full opacity-90 dark:mix-blend-normal" src="/WhatsappAndTelegram.png"/>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 border border-blue-200 py-2 px-3 rounded hover:bg-blue-50 dark:bg-[#3B82F6]/10 hover:border-blue-300 transition-all duration-200 text-sm font-bold flex justify-center items-center gap-2 shadow-sm"
          >
            Connect Telegram / WhatsApp <Link className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111827] rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-[#1F2937] shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-[#3B82F6]/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Connect Mobile</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:bg-[#1F2937] text-slate-500 dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-2">
                <button
                  onClick={() => handleConnect('telegram')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-[#1F2937] hover:border-blue-300 bg-slate-50 dark:bg-[#0B1120] hover:bg-blue-50 dark:bg-[#3B82F6]/10 transition-all text-left group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-[#0088cc]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">Telegram</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Open @Innooovixx_bot</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </button>

                <button
                  onClick={() => handleConnect('whatsapp')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-[#1F2937] hover:border-emerald-300 bg-slate-50 dark:bg-[#0B1120] hover:bg-emerald-50 transition-all text-left group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">WhatsApp</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Message our WhatsApp bot</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}



// ─── Main Dashboard ────────────────────────────────

const getHoverClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'planning': return 'hover:border-amber-400 hover:ring-1 hover:ring-amber-400'
    case 'architecting': return 'hover:border-purple-400 hover:ring-1 hover:ring-purple-400'
    case 'completed': return 'hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400'
    default: return 'hover:border-gray-400 hover:ring-1 hover:ring-gray-400'
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Researcher'

  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  // Search bar state — this is the main entry point
  const [ideaText, setIdeaText] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const handleMicClick = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    const recognition = new SpeechRecognition();
    
    // Map supported app languages to Speech API locales
    const langMap: Record<string, string> = {
      'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 
      'mr': 'mr-IN', 'kn': 'kn-IN', 'gu': 'gu-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'en': 'en-US'
    };
    const currentLang = localStorage.getItem('i18nextLng') || 'en';
    const baseLang = currentLang.split('-')[0] || 'en'; // handles 'mr', 'mr-IN', etc.
    recognition.lang = langMap[baseLang] || 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIdeaText(transcript); // Show raw text exactly as they spoke it
    };
    
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  }

  const handleTogglePin = async (project: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const newPinnedStatus = !project.is_pinned
    
    // Optimistic update of local stats
    setStats((prev: any) => ({
      ...prev,
      recent_projects: prev.recent_projects?.map((p: any) => 
        p.id === project.id ? { ...p, is_pinned: newPinnedStatus } : p
      )
    }))

    try {
      await projectsApi.update(project.id, { is_pinned: newPinnedStatus })
      window.dispatchEvent(new CustomEvent('project-pinned'))
    } catch (err) {
      console.error('Failed to toggle pin status:', err)
      // Revert on failure
      setStats((prev: any) => ({
        ...prev,
        recent_projects: prev.recent_projects?.map((p: any) => 
          p.id === project.id ? { ...p, is_pinned: !newPinnedStatus } : p
        )
      }))
    }
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashRes = await dashboardApi.get()
        setStats(dashRes.data)
      } catch (err) {
        console.error('Dashboard fetch failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  /** Main action: Create project from idea and redirect */
  const handleStartResearch = async () => {
    const trimmed = ideaText.trim()
    if (!trimmed || isCreating) return

    setIsCreating(true)
    try {
      // Generate a title from the idea (first 60 chars)
      const title = trimmed.length > 60
        ? trimmed.slice(0, 57) + '...'
        : trimmed

      const res = await projectsApi.create({ title, idea_text: trimmed })
      // Backend returns MessageResponse: { message, success, data: { id, ... } }
      // Axios wraps it: res.data = { message, success, data: { id, ... } }
      const projectId = res.data?.data?.id || res.data?.id
      if (projectId) {
        navigate(`/projects/${projectId}`)
      } else {
        console.error('No project ID in response:', res.data)
        setIsCreating(false)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      setIsCreating(false)
    }
  }

  const exampleIdeas = [
    'Build an AI solution to reduce food waste in college hostels',
    'Create a smart attendance system using face recognition',
    'Develop a mental health chatbot for university students',
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">
          Welcome back, <span className="text-blue-600 dark:text-blue-400">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground">
          Enter your idea below and we'll handle everything — research, analysis, and planning.
        </p>
      </motion.div>

      {/* ── Main Search Bar (Entry Point) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <Card className="bg-white dark:bg-[#111827] shadow-lg border border-slate-200 dark:border-[#1F2937] overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Start Your Research</h2>
                  <p className="text-xs text-muted-foreground">Describe your idea — we'll research, analyze, and plan it for you</p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleStartResearch()
                    }
                  }}
                  placeholder='e.g. "Build an AI solution to reduce food waste in college hostels"'
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1F2937] rounded-xl px-4 py-3 pr-24
                             text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none text-slate-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                             transition-all min-h-[56px] max-h-[120px]"
                  rows={2}
                  disabled={isCreating || isListening}
                />
                <button
                  onClick={handleMicClick}
                  disabled={isCreating || isListening}
                  className="absolute right-14 bottom-3 w-9 h-9 rounded-lg
                             bg-white dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400
                             flex items-center justify-center shadow-sm
                             transition-all"
                  title="Speak your idea"
                >
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                      <Mic className="w-4 h-4 text-blue-500" />
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping"></span>
                    </div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleStartResearch}
                  disabled={!ideaText.trim() || isCreating || isListening}
                  className="absolute right-3 bottom-3 w-9 h-9 rounded-lg
                             bg-blue-600 hover:bg-blue-700 shadow-md
                             flex items-center justify-center
                             hover:scale-105 active:scale-95 transition-transform
                             disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Example ideas */}
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              <span className="text-[10px] text-muted-foreground/50 self-center mr-1">Try:</span>
              {exampleIdeas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => setIdeaText(idea)}
                  className="text-[11px] px-3 py-1.5 rounded-full font-medium
                             bg-slate-100 dark:bg-[#1F2937] text-slate-600 dark:text-slate-300
                             hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400
                             transition-colors border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30"
                >
                  {idea.length > 45 ? idea.slice(0, 42) + '...' : idea}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#111827] border border-slate-100 dark:border-[#1F2937] rounded-xl p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12" />
                  <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <ProjectOverviewCards stats={stats} />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — Recent Projects + Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Recent Projects Quick Access */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Recent Projects
            </h2>
            <button 
              onClick={() => navigate('/projects')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View all
            </button>
          </div>
          {stats.recent_projects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.recent_projects.slice(0, 4).map((proj: any, idx: number) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="h-full"
                >
                  <Card
                    className={`bg-white dark:bg-[#111827] shadow-sm border border-slate-100 dark:border-[#1F2937] cursor-pointer group h-full hover:shadow-md transition-all ${getHoverClass(proj.status)}`}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm mb-0.5 truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{proj.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{proj.status || 'planning'}</p>
                        </div>
                        <button
                          onClick={(e) => handleTogglePin(proj, e)}
                          className={`p-1.5 rounded-md transition-all shrink-0 ${
                            proj.is_pinned 
                              ? 'text-blue-500 bg-blue-50 opacity-100 dark:bg-blue-500/20 dark:text-blue-400' 
                              : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                          }`}
                          title={proj.is_pinned ? "Unpin Project" : "Pin Project"}
                        >
                          <Pin className={`w-4 h-4 ${proj.is_pinned ? 'fill-current rotate-45' : ''}`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-[#111827] border-dashed border-2 border-slate-200 dark:border-slate-800 shadow-none">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No projects yet. Enter your idea above to get started!
                </p>
              </CardContent>
            </Card>
          )}


          {/* Connect Bots — compact card */}
          <MobileCompanion />
        </motion.div>

        {/* Right column — Activity + Suggestions */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* AI Suggestions */}
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              AI Suggestions
            </h2>
            <Card className="bg-white dark:bg-[#111827] shadow-sm border border-slate-100 dark:border-[#1F2937]">
              <CardContent className="p-3 space-y-2">
                {(stats.recommendations || [
                  'Enter your project idea above to start the full research pipeline',
                  'Our AI will research, analyze gaps, and build your project plan automatically',
                ]).map((rec: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs leading-relaxed
                               text-amber-800 dark:text-amber-200/80 border border-amber-100 dark:border-amber-500/20
                               hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors cursor-pointer font-medium"
                  >
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
