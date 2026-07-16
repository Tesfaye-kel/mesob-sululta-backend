import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { Menu, X, Sun, Moon, Search, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useActiveRoute } from '@/contexts/ActiveRouteContext'
import { cn } from '@/lib/utils'
import MesobLogo from '@/components/brand/MesobLogo'
import type { Language } from '@/i18n/translations'
import { HOME_ANCHORS, type HomeAnchorId } from '@/lib/anchors'
import { useHomeScrollSpy, scrollToHomeSection } from '@/hooks/useHomeScrollSpy'

interface NavItem {
  key: keyof ReturnType<typeof useLanguage>['t']['nav']
  path: string
}

const navItems: NavItem[] = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'services', path: '/tajaajila' },
  { key: 'organization', path: '/organization' },
  { key: 'announcements', path: '/announcements' },
  { key: 'gallery', path: '/gallery' },
  { key: 'faq', path: '/faq' },
  { key: 'contact', path: '/contact' },
]

const languages: { code: Language; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'አማርኛ', short: 'አማ' },
  { code: 'or', label: 'Afaan Oromo', short: 'OR' },
]

interface NavbarProps {
  onSearchOpen: () => void
}

function keyToHomeAnchor(key: NavItem['key']): HomeAnchorId {
  switch (key) {
    case 'home':
      return 'home'
    case 'about':
      return 'about'
    case 'services':
      return 'services'
    case 'organization':
      return 'organization'
    case 'announcements':
      return 'announcements'
    case 'gallery':
      return 'gallery'
    case 'faq':
      return 'faq'
    case 'contact':
      return 'contact'
    default:
      return 'home'
  }
}

export default function Navbar({ onSearchOpen }: NavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const { toggleTheme, isDark } = useTheme()
  const { setActiveRoute } = useActiveRoute()
  const location = useLocation()

  const isHome = location.pathname === '/'

  const activeHomeSection = useHomeScrollSpy({
    sectionIds: HOME_ANCHORS as unknown as HomeAnchorId[],
    pickMostVisible: true,
  })


  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveRoute(location.pathname)
  }, [location.pathname, setActiveRoute])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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

  const iconBtn = cn(
    'p-2 rounded-lg transition-all duration-150',
    'text-white/80 hover:text-white',
    'hover:bg-white/15 dark:hover:bg-white/10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
  )

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 w-full',
        'will-change-contents',
        'bg-[#3C58A5] dark:bg-[#1e2d5a]',
        'shadow-md dark:shadow-black/40'
      )}
    >
      <div className="container-gov">
        <div className="flex items-center justify-between h-20">
          <NavLink
            to="/"
            className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg"
            aria-label="MESOB Center Home"
            onClick={() => {
              // If currently on home, keep scroll-spy UX.
              if (isHome) scrollToHomeSection('home')
            }}
          >
            <MesobLogo size={44} />
            <div className="hidden sm:block">
              <p className="font-bold text-white text-base leading-tight tracking-wide">{t.siteName}</p>
              <p className="text-[11px] text-white/65 leading-tight">{t.siteTagline}</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-0.5 mx-4" aria-label="Main navigation">
            {navItems.map(({ key, path }) => {
              const anchor = keyToHomeAnchor(key)

              if (isHome) {
                // Home page does NOT render all anchor sections (e.g. no id="services" wrapper on HomePage).
                // So: only scroll for anchors that actually exist on HomePage.
                // Otherwise, navigate to the route.
                const scrollableOnHomeKeys: NavItem['key'][] = [
                  'about',
                  'services',
                  'organization',
                  'announcements',
                  'gallery',
                  'downloads',
                  'feedback',
                  'faq',
                  'contact',
                ]

                const shouldScroll = scrollableOnHomeKeys.includes(key)
                const activeByScroll = activeHomeSection === anchor
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      if (shouldScroll) {
                        scrollToHomeSection(anchor)
                      } else {
                        // Not available as a Home section => go to the real page.
                        window.location.href = path
                      }
                    }}
                    className="relative focus-visible:outline-none"
                  >

                    <span
                      className={cn(
                        'relative inline-flex items-center px-4 py-2 rounded-full',
                        'text-sm font-medium whitespace-nowrap cursor-pointer select-none',
                        'transition-all duration-200',
                        activeByScroll
                          ? 'text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-white/8'
                      )}
                    >
                      {activeByScroll && (
                        <motion.span
                          layoutId="nav-capsule"
                          className="absolute inset-0 rounded-lg bg-brand-gold/90 dark:bg-brand-gold"
                          style={{ boxShadow: '0 0 8px rgba(68, 12, 23, 0.45)', opacity: 0.3 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          aria-hidden
                        />
                      )}
                      <span className="relative z-10">{t.nav[key]}</span>
                    </span>
                  </button>
                )
              }

              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className="relative focus-visible:outline-none"
                >
                  {({ isActive }) => {
                    const activeByRoute = isActive
                    return (
                      <span
                        className={cn(
                          'relative inline-flex items-center px-4 py-2 rounded-full',
                          'text-sm font-medium whitespace-nowrap cursor-pointer select-none',
                          'transition-all duration-200',
                          activeByRoute
                            ? 'text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-white/8'
                        )}
                      >
                        {activeByRoute && (
                          <motion.span
                            layoutId="nav-capsule"
                            className="absolute inset-0 rounded-lg bg-brand-gold/90 dark:bg-brand-gold"
                            style={{ boxShadow: '0 0 8px rgba(68, 12, 23, 0.45)', opacity: 0.3 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            aria-hidden
                          />
                        )}
                        <span className="relative z-10">{t.nav[key]}</span>
                      </span>
                    )
                  }}
                </NavLink>
              )
            })}
          </nav>

          {/* Right toolbar */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(o => !o)}
                className={cn(iconBtn, 'flex items-center gap-1.5 px-3')}
                aria-label="Select language"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline text-sm font-medium">{currentLang.short}</span>
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
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute right-0 top-full mt-2 w-44 rounded-xl py-1.5 z-[9999] overflow-hidden',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-200 dark:border-gray-600',
                      'shadow-xl dark:shadow-black/50'
                    )}
                  >
                    {languages.map(lang => (
                      <li key={lang.code}>
                        <button
                          role="option"
                          aria-selected={language === lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setLangOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-150',
                            language === lang.code
                              ? 'bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold dark:text-yellow-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70'
                          )}
                        >
                          <span>{lang.label}</span>
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{lang.short}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className={iconBtn}
              aria-label={isDark ? t.topBar.darkMode : t.topBar.darkMode}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {isDark ? (
                    <Sun className="h-[18px] w-[18px] text-yellow-300" />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            <button onClick={onSearchOpen} className={iconBtn} aria-label={t.topBar.search}>
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className={cn(iconBtn, 'xl:hidden ml-1')}
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'xl:hidden overflow-hidden',
              'border-t border-white/15 dark:border-white/10',
              'bg-[#3C58A5] dark:bg-[#1e2d5a]'
            )}
          >
            <nav
              className="container-gov py-4 grid grid-cols-2 sm:grid-cols-3 gap-1"
              aria-label="Mobile navigation"
            >
              {navItems.map(({ key, path }, index) => {
                const anchor = keyToHomeAnchor(key)

                return (
                  <motion.div
                    key={path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    {isHome ? (
                      <button
                        type="button"
                        className={cn(
                          'w-full flex items-center px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                          activeHomeSection === anchor
                            ? 'bg-brand-gold/90 dark:bg-brand-gold text-white'
                            : 'text-white/85 hover:text-white hover:bg-white/10 dark:hover:bg-white/8'
                        )}
                        onClick={() => {
                          setMobileOpen(false)
                          scrollToHomeSection(anchor)
                        }}
                      >
                        {t.nav[key]}
                      </button>
                    ) : (
                      <NavLink
                        to={path}
                        end={path === '/'}
                        onClick={() => setMobileOpen(false)}
                      >
                        {({ isActive }) => (
                          <span
                            className={cn(
                              'w-full flex items-center px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-brand-gold/90 dark:bg-brand-gold text-white'
                                : 'text-white/85 hover:text-white hover:bg-white/10 dark:hover:bg-white/8'
                            )}
                          >
                            {t.nav[key]}
                          </span>
                        )}
                      </NavLink>
                    )}
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

