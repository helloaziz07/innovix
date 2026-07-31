/**
 * Innovix — Language Switcher
 *
 * Dropdown to switch between supported languages.
 * Persists selection in localStorage via i18next.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGE_OPTIONS } from '@/lib/i18n'

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === i18n.language) || LANGUAGE_OPTIONS[0]

  return (
    <div className="relative no-translate">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          'text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full',
        )}
      >
        <Globe className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span>{currentLang?.flag} {currentLang?.label}</span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 z-50 w-48 py-1 rounded-lg border border-border bg-card shadow-xl">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code)
                  setOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors',
                  i18n.language === lang.code && 'text-primary',
                )}
              >
                <span>{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {i18n.language === lang.code && (
                  <Check className="w-3.5 h-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
