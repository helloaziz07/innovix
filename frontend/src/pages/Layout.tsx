/**
 * Innovix — App Shell Layout
 *
 * Sidebar navigation + main content area.
 * Wraps all authenticated pages.
 * Includes ThemeToggle, LanguageSwitcher, and i18n-translated labels.
 */

import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, FolderKanban,
  LogOut, Pin, PanelLeftClose, PanelLeftOpen, HelpCircle, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { projectsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { HelpDrawer } from '@/components/HelpDrawer'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Project Hub' },
]

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(true) // Default to collapsed as Gemini does
  const [pinnedProjects, setPinnedProjects] = useState<any[]>([])
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)

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
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-[#0B1120] overflow-hidden">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#111827] border-b border-border shrink-0 z-20">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Innovix Logo" className="w-8 h-8 rounded shrink-0 object-contain" />
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">Innovix</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle collapsed={true} />
          {user && (
            <button onClick={handleSignOut} className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Sidebar (Desktop only) */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-white dark:bg-[#111827] transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo Section */}
        <div className={cn("h-16 flex items-center border-b border-border shrink-0 transition-all duration-300 relative", collapsed ? "justify-center px-0" : "justify-between px-4")}>
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <button
              onClick={() => setCollapsed(false)}
              disabled={!collapsed}
              className={cn(
                "rounded-lg transition-colors relative flex items-center justify-center shrink-0",
                collapsed ? "group p-2 hover:bg-slate-100 dark:hover:bg-slate-800 mx-auto" : "p-1 cursor-default"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Innovix Logo"}
            >
              <PanelLeftOpen className={cn("w-5 h-5 text-slate-500 hidden", collapsed && "group-hover:block")} />
              <img src="/logo.jpg" alt="Innovix Logo" className={cn("w-8 h-8 rounded object-contain block", collapsed && "group-hover:hidden")} />
              
              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                  Open sidebar
                </div>
              )}
            </button>
            
            {!collapsed && (
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate tracking-tight">Innovix</span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
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

          {/* Help Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && 'Help & Support'}
          </Button>

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

      </aside>

      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative z-0">
        <Outlet />
      </main>

      {/* Mobile Pinned Drawer */}
      <AnimatePresence>
        {isPinnedOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPinnedOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] rounded-t-2xl z-[70] p-4 pb-6 shadow-2xl md:hidden border-t border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400 rotate-45" />
                  Pinned Projects
                </h3>
                <button
                  onClick={() => setIsPinnedOpen(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-1">
                {pinnedProjects.length > 0 ? (
                  pinnedProjects.map(proj => (
                    <NavLink
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      onClick={() => setIsPinnedOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 rotate-45" />
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-200 truncate">{proj.title}</span>
                    </NavLink>
                  ))
                ) : (
                  <div className="text-center p-6 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No pinned projects yet
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-border grid grid-cols-4 p-3 z-50 safe-area-pb">
        {navItems.map((navItem) => (
          <NavLink
            key={navItem.to}
            to={navItem.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )
            }
          >
            <navItem.icon className="w-5 h-5" />
            <span>{navItem.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setIsPinnedOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            isPinnedOpen
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Pin className="w-5 h-5 rotate-45" />
          <span>Pinned</span>
        </button>
        <button
          onClick={() => setIsHelpOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help</span>
        </button>
      </nav>
    </div>
  )
}
