/**
 * Innovix — Landing Page
 *
 * Premium hero section with animated gradient, feature cards,
 * and call-to-action. First thing users see.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Search, Rocket, Bot, Globe, BarChart3, Brain, BookOpen, Sparkles, ArrowRight, Zap,
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'DeepSearch',
    description: 'AI-powered multi-source research across arXiv, GitHub, Semantic Scholar, and the web.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Rocket,
    title: 'Project HUB',
    description: 'Auto-generate complete project plans with architecture, tech stack, and timelines.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Telegram & WhatsApp bots for reminders, progress tracking, and Q&A.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Web Intelligence',
    description: 'Real-time trending topics, freshness scoring, and competitive analysis.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Dashboard',
    description: 'Personalized analytics with research insights and AI recommendations.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Brain,
    title: 'Knowledge Clustering',
    description: 'Embedding-based thematic grouping of research into visual clusters.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: BookOpen,
    title: 'Research Workspaces',
    description: 'Save, annotate, organize, and export your research findings.',
    color: 'from-teal-500 to-emerald-500',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Landing() {
  const navigate = useNavigate()

  // Force light mode on Landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    return () => {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">Innovix</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-slate-900">
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-primary text-white">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
              <Zap className="w-4 h-4" />
              
            </div> */}

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-primary">Transform Ideas into Reality</span>
              <br />
              <span className="text-slate-900">with AI-Driven Precision</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Your AI-powered research copilot that transforms raw ideas into
              implementation-ready projects — with deep research, gap analysis,
              and intelligent project planning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" onClick={() => navigate('/login')} className="group">
                Start Building
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Explore Features
              </Button>
            </div>
          </motion.div>

          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 bg-white border border-slate-200 p-6 rounded-2xl max-w-3xl mx-auto shadow-lg"
          >
            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <span className="text-xs text-slate-500 ml-2">innovix.ai</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">💡 Enter your idea:</p>
                <p className="text-base text-slate-900 font-medium">
                  "Build an AI solution to reduce food waste in college hostels"
                </p>
                <div className="h-px bg-slate-200 my-3" />
                <p className="text-sm text-primary">🔍 Searching arXiv, GitHub, Semantic Scholar...</p>
                <p className="text-sm text-emerald-600">✅ Found 47 papers, 23 repos, 12 datasets</p>
                <p className="text-sm text-blue-600">🚀 Generating project architecture...</p>
                <p className="text-sm text-amber-600">📊 Building implementation timeline...</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              All 7 <span className="text-primary">Innovix AI</span> Capabilities
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              From problem discovery to project execution — everything you need in one platform.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={item}>
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 h-full group cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-primary/5 border border-primary/10 p-10 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Ready to innovate?</h2>
            <p className="text-slate-600 mb-8">
              Transform your next idea into a fully-planned, research-backed project in minutes.
            </p>
            <Button size="xl" onClick={() => navigate('/login')} className="bg-primary text-white">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Innovix © 2026</span>
          </div>
          <p>Built with Innovix AI</p>
        </div>
      </footer>
    </div>
  )
}
