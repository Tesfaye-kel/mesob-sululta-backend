import { Phone, Globe, Sun, Moon, Search, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import type { Language } from '@/i18n/translations'

const languages = [
  { code: 'en' as Language, label: 'English', short: 'EN' },
  { code: 'am' as Language, label: 'አማርኛ', short: 'አማ' },
  { code: 'or' as Language, label: 'Afaan Oromo', short: 'OR' },
]

interface TopBarProps {
  onSearchOpen: () => void
}

export default function TopBar({ onSearchOpen }: TopBarProps) {
  const { language, setLanguage, t } = useLanguage()
  const { toggleTheme, isDark } = useTheme()

  return (
    <div className="bg-brand-green text-white text-xs">
      <div className="container-gov flex items-center justify-between h-9">
        {/* Left: Gov name + Emergency */}
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="hidden sm:flex items-center gap-1.5 font-medium truncate">
            <span className="h-3 w-3 rounded-full bg-brand-gold inline-block shrink-0" aria-hidden />
            {t.govName}
          </span>
          <a
            href="tel:911"
            className="flex items-center gap-1.5 text-red-200 hover:text-white transition-colors font-semibold"
            aria-label="Emergency number 911"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            <span className="hidden md:inline">{t.topBar.emergency}</span>
            <span className="md:hidden">911</span>
          </a>
        </div>

        {/* Right: Language, Dark Mode, Search */}
        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Select language">
            <Globe className="h-3 w-3 mr-1 opacity-70" aria-hidden />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-all duration-150',
                  language === lang.code
                    ? 'bg-white text-brand-green font-bold'
                    : 'hover:bg-white/20 text-white/80 hover:text-white'
                )}
                aria-pressed={language === lang.code}
                title={lang.label}
              >
                {lang.short}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/20 mx-1" aria-hidden />

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded hover:bg-white/20 transition-colors"
            aria-label={t.topBar.darkMode}
            title={t.topBar.darkMode}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Search */}
          <button
            onClick={onSearchOpen}
            className="p-1.5 rounded hover:bg-white/20 transition-colors"
            aria-label={t.topBar.search}
            title={t.topBar.search}
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Emergency phone */}
          <a
            href="tel:+251111110000"
            className="hidden lg:flex items-center gap-1.5 ml-2 bg-white/15 hover:bg-white/25 px-3 py-1 rounded transition-colors font-medium"
          >
            <Phone className="h-3 w-3" aria-hidden />
            +251 11 111 0000
          </a>
        </div>
      </div>
    </div>
  )
}
