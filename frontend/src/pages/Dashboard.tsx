/**
 * Innovix — Dashboard Page
 *
 * Personalized homepage with project stats, quick actions,
 * and AI recommendations.
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import {
  Search, Rocket, Plus, TrendingUp, FolderOpen,
  Lightbulb, ArrowRight, Sparkles, BarChart3,
} from 'lucide-react'

const quickActions = [
  {
    icon: Search,
    title: 'New DeepSearch',
    description: 'Research any idea across multiple sources',
    to: '/deepsearch',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Plus,
    title: 'New Project',
    description: 'Start a new innovation project',
    to: '/projects',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: 'Trending Topics',
    description: 'See what\'s trending in your domain',
    to: '/intelligence',
    color: 'from-orange-500 to-amber-500',
  },
]

const recommendations = [
  '💡 Try searching "AI-powered waste management in smart cities"',
  '📚 Explore trending research in machine learning for sustainability',
  '🚀 Create your first project to unlock full Project HUB features',
  '🤖 Connect your Telegram for AI agent reminders',
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Researcher'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          What would you like to research today?
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <div
          onClick={() => navigate('/deepsearch')}
          className="glass-card p-4 flex items-center gap-4 cursor-pointer group glow-purple hover:glow-blue transition-all duration-500"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">
              Enter an idea like{' '}
              <span className="text-foreground font-medium">
                "Build an AI solution to reduce food waste in college hostels"
              </span>
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10"
      >
        {[
          { label: 'Projects', value: '0', icon: FolderOpen, color: 'text-violet-400' },
          { label: 'Searches', value: '0', icon: Search, color: 'text-blue-400' },
          { label: 'Papers Found', value: '0', icon: BarChart3, color: 'text-emerald-400' },
          { label: 'Repos Found', value: '0', icon: Rocket, color: 'text-orange-400' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="glass-card hover:scale-[1.02] transition-transform">
              <CardContent className="p-4 flex items-center gap-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <motion.div key={action.title} variants={item}>
                <Card
                  className="glass-card cursor-pointer group h-full"
                  onClick={() => navigate(action.to)}
                >
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            AI Suggestions
          </h2>
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-accent/50 text-sm leading-relaxed hover:bg-accent transition-colors cursor-pointer"
                >
                  {rec}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
