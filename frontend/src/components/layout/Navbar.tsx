import { useState, useEffect, useRef, useCallback } from 'react'
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
  anchor: HomeAnchorId
}

const navItems: NavItem[] = [
  { key: 'home', path: '/', anchor: 'home' },
  { key: 'about', path: '/about', anchor: 'about' },
  { key: 'services', path: '/tajaajila', anchor: 'services' },
  { key: 'organization', path: '/organization', anchor: 'organization' },
  { key: 'announcements', path: '/announcements', anchor: 'announcements' },
  { key: 'gallery', path: '/gallery', anchor: 'gallery' },
  { key: 'faq', path: '/faq', anchor: 'faq' },
  { key: 'contact', path: '/contact', anchor: 'contact' },
]

const languages: { code: Language; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'አማርኛ', short: 'አማ' },
  { code: 'or', label: 'Afaan Oromo', short: 'OR' },
]

interface NavbarProps {
  onSearchOpen: () => void
}

const scrollableOnHomeKeys: NavItem['key'][] = [
  'about', 'services', 'organization', 'announcements',
  'gallery', 'downloads', 'feedback', 'faq', 'contact',
]

// Animation variants for premium micro-interactions
const navItemVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.95, transition: { type: 'spring', stiffness: 500, damping: 15 } },
}

const mobileItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.12 } },
}

export default function Navbar({ onSearchOpen }: NavbarProps) {
  const { t, language, setLanguage } = useLanguage()
  const { toggleTheme, isDark } = useTheme()
  const { setActiveRoute } = useActiveRoute()
  const location = useLocation()

  const isHome = location.pathname === '/'

  const { activeId: activeHomeSection, scrollProgress } = useHomeScrollSpy({
    sectionIds: HOME_ANCHORS as unknown as HomeAnchorId[],
    pickMostVisible: true,
    activeOffset: 120,
  })

  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const langRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  // Track scroll for hide/show and background opacity
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 80)
      setScrolled(currentScrollY > 40)
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setActiveRoute(location.pathname)
  }, [location.pathname, setActiveRoute])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
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

  const handleNavClick = useCallback((item: NavItem) => {
    if (isHome) {
      const shouldScroll = scrollableOnHomeKeys.includes(item.key)
      if (shouldScroll) {
        scrollToHomeSection(item.anchor)
      } else {
        window.location.href = item.path
      }
    }
  }, [isHome])

  const iconBtn = cn(
    'p-2 rounded-lg transition-all duration-200',
    'text-white/80 hover:text-white',
    'hover:bg-white/15 dark:hover:bg-white/10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
  )

  return (
    <>
      {/* Floating Navbar Container */}
      <motion.header
        initial={{ y: -100 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full',
          'pointer-events-none', // Allow clicks to pass through to the nav capsule
        )}
      >
        {/* Top bar with logo - shown on scroll */}
        <motion.div
          animate={{
            opacity: scrolled ? 1 : 0,
            height: scrolled ? 'auto' : 0,
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={cn(
            'overflow-hidden pointer-events-auto',
            'bg-[#3C58A5]/95 dark:bg-[#1e2d5a]/95',
            'backdrop-blur-md border-b border-white/10'
          )}
        >
          <div className="container-gov flex items-center justify-between h-16">
            <NavLink
              to="/"
              className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg"
              aria-label="MESOB Center Home"
            >
              <MesobLogo size={36} />
              <div className="hidden sm:block">
                <p className="font-bold text-white text-sm leading-tight tracking-wide">{t.siteName}</p>
                <p className="text-[10px] text-white/60 leading-tight">{t.siteTagline}</p>
              </div>
            </NavLink>

            {/* Right side actions */}
            <div className="flex items-center gap-0.5">
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
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className={cn(
                        'absolute right-0 top-full mt-2 w-44 rounded-xl py-1.5 z-[9999] overflow-hidden',
                        'bg-white dark:bg-gray-800',
                        'border border-gray-200 dark:border-gray-600',
                        'shadow-xl dark:shadow-black/50'
                      )}
                    >
                      {languages.map(lang => (
                        <li key={lang.code}>
                          <motion.button
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            role="option"
                            aria-selected={language === lang.code}
                            onClick={() => {
                              setLanguage(lang.code)
                              setLangOpen(false)
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150',
                              language === lang.code
                                ? 'bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold dark:text-yellow-400 font-semibold'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70'
                            )}
                          >
                            <span>{lang.label}</span>
                            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{lang.short}</span>
                          </motion.button>
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
                    initial={{ rotate: -30, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 30, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
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
                className={cn(iconBtn, 'lg:hidden ml-1')}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Floating Capsule Navigation */}
        <motion.div
          className={cn(
            'pointer-events-auto',
            'flex justify-center',
            'px-4 pt-2'
          )}
          animate={{
            y: scrolled ? 0 : 8,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <nav
            className={cn(
              'inline-flex items-center gap-1',
              'px-2 py-1.5',
              'rounded-2xl',
              'bg-white/90 dark:bg-gray-900/90',
              'backdrop-blur-xl',
              'shadow-lg shadow-black/5 dark:shadow-black/20',
              'border border-gray-200/50 dark:border-gray-700/50',
              'ring-1 ring-black/5 dark:ring-white/5',
            )}
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const isActive = isHome
                ? activeHomeSection === item.anchor
                : location.pathname === item.path

              return (
                <motion.div
                  key={item.path}
                  variants={navItemVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className="relative"
                >
                  {isHome ? (
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 rounded-lg"
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span
                        className={cn(
                          'relative inline-flex items-center px-3.5 py-2',
                          'text-xs font-semibold whitespace-nowrap cursor-pointer select-none',
                          'transition-colors duration-200',
                          'rounded-xl',
                          isActive
                            ? 'text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="nav-capsule"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark shadow-md shadow-brand-green/20"
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 30,
                              mass: 0.8,
                            }}
                            style={{ boxShadow: '0 2px 12px rgba(26, 107, 60, 0.3)' }}
                            aria-hidden
                          />
                        )}
                        <span className="relative z-10">{t.nav[item.key]}</span>
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 rounded-lg"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span
                        className={cn(
                          'relative inline-flex items-center px-3.5 py-2',
                          'text-xs font-semibold whitespace-nowrap cursor-pointer select-none',
                          'transition-colors duration-200',
                          'rounded-xl',
                          isActive
                            ? 'text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="nav-capsule"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark shadow-md shadow-brand-green/20"
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 30,
                              mass: 0.8,
                            }}
                            style={{ boxShadow: '0 2px 12px rgba(26, 107, 60, 0.3)' }}
                            aria-hidden
                          />
                        )}
                        <span className="relative z-10">{t.nav[item.key]}</span>
                      </span>
                    </NavLink>
                  )}
                </motion.div>
              )
            })}
          </nav>
        </motion.div>
      </motion.header>

      {/* Mobile menu - fullscreen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 z-40 lg:hidden',
              'bg-gray-900/40 backdrop-blur-sm dark:bg-black/50'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className={cn(
                'absolute right-0 top-0 bottom-0 w-80 max-w-[90vw]',
                'bg-white dark:bg-gray-900',
                'shadow-2xl dark:shadow-black/50',
                'border-l border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'p-2 rounded-lg',
                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'transition-colors duration-150'
                  )}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1" aria-label="Mobile navigation">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    custom={index}
                    variants={mobileItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {isHome ? (
                      <button
                        type="button"
                        className={cn(
                          'w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          activeHomeSection === item.anchor
                            ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                        onClick={() => {
                          setMobileOpen(false)
                          scrollToHomeSection(item.anchor)
                        }}
                      >
                        {t.nav[item.key]}
                      </button>
                    ) : (
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          )
                        }
                      >
                        {t.nav[item.key]}
                      </NavLink>
                    )}
                  </motion.div>
                ))}
              </nav>

              {/* Mobile language options */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setMobileOpen(false)
                      }}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                        language === lang.code
                          ? 'bg-brand-green text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {lang.short}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}