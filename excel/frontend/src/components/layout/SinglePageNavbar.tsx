import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Search, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import MesobLogo from '@/components/brand/MesobLogo'
import type { Language } from '@/i18n/translations'

// Section IDs for smooth scrolling (removed 'departments')
const sections = [
  { id: 'home',          labelKey: 'home'          as const },
  { id: 'about',         labelKey: 'about'         as const },
  { id: 'services',      labelKey: 'services'      as const },
  { id: 'organization',  labelKey: 'organization'  as const },
  { id: 'announcements', labelKey: 'announcements' as const },
  { id: 'gallery',       labelKey: 'gallery'       as const },
  { id: 'downloads',     labelKey: 'downloads'     as const },
  { id: 'faq',           labelKey: 'faq'           as const },
  { id: 'contact',       labelKey: 'contact'       as const },
]

const languages: { code: Language; label: string; short: string }[] = [
  { code: 'en', label: 'English',      short: 'EN'  },
  { code: 'am', label: 'አማርኛ',         short: 'አማ'  },
  { code: 'or', label: 'Afaan Oromo',  short: 'OR'  },
]

const NAV_BG = '#3C58A5'

interface SinglePageNavbarProps {
  onSearchOpen: () => void
}

export default function SinglePageNavbar({ onSearchOpen }: SinglePageNavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const { toggleTheme, isDark } = useTheme()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  const langRef = useRef<HTMLDivElement>(null)
  const isHomePage = location.pathname === '/'

  /* ─── Intersection Observer for active section detection ─── */
  useEffect(() => {
    if (!isHomePage) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: [0.3, 0.5], rootMargin: '-80px 0px -50% 0px' }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [isHomePage])

  /* ─── Smooth scroll to section ─── */
  const scrollToSection = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (!el) return

    const navHeight = 80 // h-20
    const top = el.offsetTop - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
  }

  /* ─── Close mobile menu on route change ─── */
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  /* ─── Lock body scroll when mobile menu open ─── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ─── Close language dropdown on outside click ─── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLang = languages.find(l => l.code === language)!

  return (
    <header className="sticky top-0 z-40 w-full" style={{ backgroundColor: NAV_BG }}>
      <div className="container-gov">
        <div className="flex items-center justify-between h-20">
          {/* ── Logo ── */}
          <Link
            to="/"
            onClick={() => isHomePage && scrollToSection('home')}
            className="flex items-center gap-3 shrink-0"
            aria-label="MESOB Center Home"
          >
            <MesobLogo size={44} />
            <div className="hidden sm:block">
              <p className="font-bold text-white text-base leading-tight tracking-wide">
                MESOB Center
              </p>
              <p className="text-[11px] text-white/65 leading-tight">Sululta Branch</p>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden xl:flex items-center gap-0.5 mx-4" aria-label="Main navigation">
            {sections.map(({ id, labelKey }) => {
              const isActive = isHomePage && activeSection === id
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={cn(
                    'relative px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap',
                    isActive ? 'text-white' : 'text-white/75 hover:text-white hover:bg-white/10'
                  )}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {t.nav[labelKey]}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* ── Right toolbar ── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* ── Language chooser ── */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium"
                aria-label="Select language"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{currentLang.short}</span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform duration-200', langOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.ul
                    role="listbox"
                    aria-label="Choose language"
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden"
                  >
                    {languages.map(lang => (
                      <li key={lang.code}>
                        <button
                          role="option"
                          aria-selected={language === lang.code}
                          onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                            language === lang.code
                              ? 'bg-brand-green/10 text-brand-green dark:text-brand-green-light font-semibold'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          )}
                        >
                          <span>{lang.label}</span>
                          <span className="text-xs font-mono opacity-50">{lang.short}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* ── Dark mode toggle ── */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* ── Search icon ── */}
            <button
              onClick={onSearchOpen}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
              aria-label="Open search"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </button>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="xl:hidden p-2 rounded-lg text-white hover:bg-white/15 transition-colors ml-1"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mobileOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="xl:hidden overflow-hidden border-t border-white/15"
            style={{ backgroundColor: NAV_BG }}
          >
            <nav className="container-gov py-4 grid grid-cols-2 sm:grid-cols-3 gap-1" aria-label="Mobile navigation">
              {sections.map(({ id, labelKey }, index) => {
                const isActive = isHomePage && activeSection === id
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <button
                      onClick={() => scrollToSection(id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive ? 'bg-white/20 text-white font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {t.nav[labelKey]}
                    </button>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
