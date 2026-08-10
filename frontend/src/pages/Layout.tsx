/**
 * Innovix — App Shell Layout
 *
 * Sidebar navigation + main content area.
 * Wraps all authenticated pages.
 * Includes ThemeToggle, LanguageSwitcher, and i18n-translated labels.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, FolderKanban,
  LogOut, Sparkles, ChevronLeft, ChevronRight, Pin
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { projectsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'My Projects' },
]

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [pinnedProjects, setPinnedProjects] = useState<any[]>([])

  const fetchPinnedProjects = async () => {
    if (!user) return
    try {
      const res = await projectsApi.list({ is_pinned: true, limit: 10 })
      setPinnedProjects(res.data)
    } catch (err) {
      console.error('Failed to fetch pinned projects', err)
    }
  }

  useEffect(() => {
    fetchPinnedProjects()
    
    // Listen for custom event when a project is pinned/unpinned
    const handleProjectPinned = () => {
      fetchPinnedProjects()
    }
    window.addEventListener('project-pinned', handleProjectPinned)
    return () => window.removeEventListener('project-pinned', handleProjectPinned)
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B1120] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-white dark:bg-[#111827] transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Innovix</span>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((navItem) => (
            <NavLink
              key={navItem.to}
              to={navItem.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1F2937] hover:text-slate-900 dark:hover:text-white'
                )
              }
            >
              <navItem.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{navItem.label}</span>}
            </NavLink>
          ))}

          {!collapsed && (
            <div className="pt-4 pb-2">
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pinned Projects</h3>
              <div className="space-y-1">
                {pinnedProjects.length > 0 ? (
                  pinnedProjects.map(proj => (
                    <NavLink
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1F2937] hover:text-slate-900 dark:hover:text-white'
                        )
                      }
                    >
                      <Pin className="w-4 h-4 shrink-0 rotate-45" />
                      <span className="truncate">{proj.title}</span>
                    </NavLink>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                    No pinned projects
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Theme + Language + User Section */}
        <div className="p-3 border-t border-border space-y-2 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle collapsed={collapsed} />

          {!collapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">
                {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign Out'}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
