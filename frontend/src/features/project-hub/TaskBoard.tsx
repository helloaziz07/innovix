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
  role: string
  technical_role?: string
  user_full_name?: string
  user_email?: string
}

export default function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [tasksRes, membersRes] = await Promise.all([
          projectsApi.getTasks(projectId),
          projectsApi.getMembers(projectId)
        ])
        setTasks(tasksRes.data || [])
        setMembers(membersRes.data?.members || [])
      } catch (err) {
        console.error("Failed to load tasks or members", err)
      } finally {
        setLoading(false)
      }
    }
    
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  // Group tasks by assignee
  const tasksByAssignee: Record<string, Task[]> = {
    'unassigned': []
  }
  
  members.forEach(m => {
    tasksByAssignee[m.user_id] = []
  })

  tasks.forEach(t => {
    if (t.assigned_to && tasksByAssignee[t.assigned_to]) {
      tasksByAssignee[t.assigned_to]!.push(t)
    } else {
      if (!tasksByAssignee['unassigned']) tasksByAssignee['unassigned'] = []
      tasksByAssignee['unassigned']!.push(t)
    }
  })

  const getMemberName = (userId: string) => {
    const m = members.find(m => m.user_id === userId)
    return m?.user_full_name || m?.user_email || 'Unknown User'
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Tasks</h2>
        <p className="text-sm text-slate-500">Auto-assigned based on role</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {/* Unassigned Column */}
        {(tasksByAssignee['unassigned']?.length || 0) > 0 && (
          <div className="bg-slate-50 dark:bg-[#111827] rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              Unassigned
              <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-full">
                {tasksByAssignee['unassigned']?.length || 0}
              </span>
            </h3>
            <div className="space-y-3">
              {tasksByAssignee['unassigned']?.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Member Columns */}
        {members.map(member => {
          const memberTasks = tasksByAssignee[member.user_id]
          if (!memberTasks || memberTasks.length === 0) return null

          return (
            <div key={member.id} className="bg-slate-50 dark:bg-[#111827] rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  {getMemberName(member.user_id)}
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {memberTasks.length}
                  </span>
                </h3>
                {member.technical_role && (
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">
                    {member.technical_role}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {memberTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500">No tasks generated yet. They will appear here once the project plan is complete.</p>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
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
          {task.required_role || 'General'}
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
