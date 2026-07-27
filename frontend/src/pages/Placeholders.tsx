/**
 * Innovix — Placeholder pages for features not yet built.
 * Each shows a "Coming in Phase X" message.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Search, Rocket, Brain, BookOpen, Globe, Bot } from 'lucide-react'

function PlaceholderPage({ icon: Icon, title, phase, color }: {
  icon: React.ElementType
  title: string
  phase: number
  color: string
}) {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="glass-card max-w-md w-full glow-purple">
        <CardContent className="p-10 text-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-6`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">
            Coming in <span className="text-primary font-semibold">Phase {phase}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DeepSearchPage() {
  return <PlaceholderPage icon={Search} title="DeepSearch" phase={2} color="from-violet-500 to-purple-600" />
}

export function ProjectsPage() {
  return <PlaceholderPage icon={Rocket} title="Project HUB" phase={3} color="from-blue-500 to-cyan-500" />
}

export function ClustersPage() {
  return <PlaceholderPage icon={Brain} title="Knowledge Clusters" phase={4} color="from-indigo-500 to-violet-500" />
}

export function WorkspacesPage() {
  return <PlaceholderPage icon={BookOpen} title="Research Workspaces" phase={5} color="from-teal-500 to-emerald-500" />
}

export function IntelligencePage() {
  return <PlaceholderPage icon={Globe} title="Web Intelligence" phase={4} color="from-orange-500 to-amber-500" />
}

export function AgentsPage() {
  return <PlaceholderPage icon={Bot} title="AI Agents" phase={6} color="from-emerald-500 to-teal-500" />
}
