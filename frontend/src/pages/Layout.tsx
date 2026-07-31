/**
 * Innovix — App Shell Layout
 *
 * Sidebar navigation + main content area.
 * Wraps all authenticated pages.
 * Includes ThemeToggle, LanguageSwitcher, and i18n-translated labels.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  LayoutDashboard, FolderKanban,
  LogOut, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'My Projects' },
]

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <Sparkles className="w-6 h-6 text-violet-400 shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">Innovix</span>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <navItem.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{navItem.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Theme + Language + User Section */}
        <div className="p-3 border-t border-border space-y-2 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle collapsed={collapsed} />

          {/* Language Switcher */}
          <LanguageSwitcher collapsed={collapsed} />

          {!collapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
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
