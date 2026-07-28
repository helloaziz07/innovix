/**
 * Innovix — Theme Toggle
 *
 * Dark/light mode toggle with system preference detection.
 * Stores preference in localStorage.
 */

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'dark' | 'light' | 'system'

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.classList.toggle('light', resolved === 'light')
}

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('innovix-theme') as Theme) || 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('innovix-theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  const current = options.find((o) => o.value === theme) || options[1]

  if (collapsed) {
    return (
      <button
        onClick={() => {
          const idx = options.findIndex((o) => o.value === theme)
          setTheme(options[(idx + 1) % options.length]!.value)
        }}
        className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title={`Theme: ${current.label}`}
      >
        <current.icon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/50">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
            theme === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title={opt.label}
        >
          <opt.icon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
