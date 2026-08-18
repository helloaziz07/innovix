import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { projectsApi } from '@/lib/api'

interface Task {
  id: string
  title: string
  description: string
  required_role: string
  estimated_effort: string
  status: string
  assigned_to: string | null
}

interface Member {
  id: string
  user_id: string
  alias_name?: string
  user_full_name?: string
}

export default function TaskBoard({ projectId, isProjectComplete }: { projectId: string, isProjectComplete?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksRes, membersRes] = await Promise.all([
        projectsApi.getTasks(projectId),
        projectsApi.getMembers(projectId)
      ])
      setTasks(tasksRes.data || [])
      setMembers(membersRes.data.members || [])
    } catch (err) {
      console.error("Failed to load tasks or members", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const handleGenerateTasks = async () => {
    try {
      setIsGenerating(true)
      await projectsApi.generateTasks(projectId)
      await fetchData()
    } catch (err) {
      console.error("Failed to generate tasks", err)
      alert("Failed to generate tasks. Please ensure the project roadmap is complete.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  // Group tasks by role
  const tasksByRole: Record<string, Task[]> = {}
  
  const safeTasks = tasks.map(t => {
    let cleanDescription = t.description;
    if (t.description) {
      cleanDescription = t.description.replace(/^\[Assignee:\s*(.*?)\]\s*/i, '').trim();
    }
    return { ...t, description: cleanDescription }
  });

  safeTasks.forEach(t => {
    const role = t.required_role ? t.required_role.toLowerCase() : 'unassigned'
    if (!tasksByRole[role]) tasksByRole[role] = []
    tasksByRole[role].push(t)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Tasks</h2>
        <p className="text-sm text-slate-500">Grouped by Role</p>
      </div>

      <div className="flex flex-col gap-8 pb-6">
        {Object.keys(tasksByRole).sort().map(role => {
          const roleTasks = tasksByRole[role]
          if (!roleTasks || roleTasks.length === 0) return null

          return (
            <div key={role} className="w-full bg-slate-50 dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between capitalize">
                  {role}
                  <span className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                    {roleTasks.length} Tasks
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roleTasks.map(task => (
                  <TaskCard key={task.id} task={task} members={members} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 mb-6">No tasks generated yet. They will appear here once you generate them.</p>
          <div className="flex justify-center">
            {isProjectComplete ? (
              <button
                onClick={handleGenerateTasks}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isGenerating ? 'Generating Tasks...' : 'Generate Tasks'}
              </button>
            ) : (
              <button
                disabled
                title="Complete your project timeline to generate tasks"
                className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed"
              >
                Generate Tasks
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, members }: { task: Task, members: Member[] }) {
  const assignee = members.find(m => m.user_id === task.assigned_to)
  const memberName = assignee ? (assignee.alias_name || assignee.user_full_name?.split(' ')[0]) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-slate-900 dark:text-white leading-tight">
          {task.title}
        </h4>
        {task.status === 'done' ? (
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        ) : task.status === 'in_progress' ? (
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
        )}
      </div>
      
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium capitalize">
          {task.required_role ? `${task.required_role}${memberName ? ` (${memberName})` : ''}` : (memberName || 'General')}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${
          task.estimated_effort === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
          task.estimated_effort === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
          'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
        }`}>
          {task.estimated_effort || 'low'}
        </span>
      </div>
    </motion.div>
  )
}
