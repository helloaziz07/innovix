import { useEffect, useState } from 'react'
import { Activity, Clock, User, RefreshCw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { projectsApi } from '@/lib/api'
import { useProjectStore } from '@/stores/projectStore'

interface ActivityLog {
  id: string
  project_id: string
  user_id: string
  action: string
  component: string
  metadata?: any
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
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const activeProject = useProjectStore((state) => state.activeProject)

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

  const handleClearActivity = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) return;
    try {
      await projectsApi.clearActivity(projectId);
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear activity:', error);
      alert('Failed to clear activity. Make sure you are the project owner.');
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [projectId])

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const formatFieldName = (fieldPath: string) => {
    if (!fieldPath) return 'Unknown Change'
    const parts = fieldPath.split('.')
    const meaningfulParts = parts.filter(p => p !== 'project_plan' && isNaN(Number(p)))
    if (meaningfulParts.length === 0) return 'Project Update'
    
    const part = meaningfulParts[0]
    return part
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const getCartoonAvatar = (name: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-border w-80 shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Activity className="w-5 h-5" />
          <h2 className="font-semibold">Project Activity</h2>
        </div>
        <div className="flex items-center gap-1">
          {activeProject?.role === 'owner' && logs.length > 0 && (
            <button 
              onClick={handleClearActivity}
              className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Clear activity history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={fetchLogs}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh activity"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
                  <img src={getCartoonAvatar(log.user_full_name)} alt={log.user_full_name} className="w-full h-full object-cover scale-110 mt-1" />
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
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug flex items-center justify-between">
                    <div>
                      <span className={`inline-block px-1 py-0 rounded text-[10px] font-medium mr-1.5 ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="break-words">{log.component}</span>
                    </div>
                    {log.metadata?.changes && log.metadata.changes.length > 0 && (
                      <button 
                        onClick={() => toggleExpand(log.id)}
                        className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
                      >
                        {expandedLogs.has(log.id) ? (
                          <><ChevronUp className="w-3 h-3"/> Hide</>
                        ) : (
                          <><ChevronDown className="w-3 h-3"/> View</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Diff Viewer */}
                  {expandedLogs.has(log.id) && log.metadata?.changes && (
                    <div className="mt-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md p-2 bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3 h-3" /> Changes
                      </div>
                      <div className="space-y-2">
                        {log.metadata.changes.map((change: any, idx: number) => {
                          if (typeof change === 'string') {
                            return (
                              <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-400">
                                • {change}
                              </div>
                            )
                          }
                          return (
                            <div key={idx}>
                              <span className="font-mono text-[9px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-violet-600 dark:text-violet-400 block w-fit mb-1 font-semibold uppercase tracking-wider">
                                {formatFieldName(change.field)}
                              </span>
                              {change.type === 'modified' && (
                                <div className="flex flex-col gap-1">
                                  <div className="text-red-600 dark:text-red-400 bg-red-500/10 p-1.5 rounded break-words whitespace-pre-wrap text-[10px] max-h-48 overflow-y-auto">
                                    {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old)}
                                  </div>
                                  <div className="text-green-600 dark:text-green-400 bg-green-500/10 p-1.5 rounded break-words whitespace-pre-wrap text-[10px] max-h-48 overflow-y-auto">
                                    {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new)}
                                  </div>
                                </div>
                              )}
                              {change.type === 'added' && (
                                <div className="text-green-600 dark:text-green-400 bg-green-500/10 p-1.5 rounded break-words whitespace-pre-wrap text-[10px] max-h-48 overflow-y-auto">
                                  + {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new)}
                                </div>
                              )}
                              {change.type === 'removed' && (
                                <div className="text-red-600 dark:text-red-400 bg-red-500/10 p-1.5 rounded break-words whitespace-pre-wrap text-[10px] max-h-48 overflow-y-auto">
                                  - {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
