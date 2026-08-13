import { useEffect, useState } from 'react'
import { Activity, Clock, User, RefreshCw } from 'lucide-react'
import { projectsApi } from '@/lib/api'

interface ActivityLog {
  id: string
  project_id: string
  user_id: string
  action: string
  component: string
  created_at: string
  user_full_name: string
  user_avatar?: string
}

interface ActivityFeedProps {
  projectId: string
}

export default function ActivityFeed({ projectId }: ActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const { data } = await projectsApi.getActivity(projectId)
      setLogs(data)
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [projectId])

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'regenerated': return 'text-amber-500 bg-amber-500/10'
      case 'updated': return 'text-blue-500 bg-blue-500/10'
      case 'invited': return 'text-green-500 bg-green-500/10'
      default: return 'text-slate-500 bg-slate-500/10'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-border w-80 shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Activity className="w-5 h-5" />
          <h2 className="font-semibold">Project Activity</h2>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh activity"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-sm">Loading activity...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-2 text-center px-4">
            <Clock className="w-8 h-8 opacity-50 mb-2" />
            <p className="text-sm">No activity recorded yet.</p>
            <p className="text-xs opacity-70">Changes made to this project will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-3">
                
                {/* Avatar Icon */}
                <div className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shrink-0 z-10 relative overflow-hidden">
                  {log.user_avatar ? (
                    <img src={log.user_avatar} alt={log.user_full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate pr-2">
                      {log.user_full_name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    <span className={`inline-block px-1 py-0 rounded text-[10px] font-medium mr-1.5 ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="break-words">{log.component}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
