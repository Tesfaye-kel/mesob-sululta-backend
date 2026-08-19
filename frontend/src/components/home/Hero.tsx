import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Search, ChevronLeft, ChevronRight, Loader2, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useActiveRoute } from '@/contexts/ActiveRouteContext'
import { Badge } from '@/components/ui/Badge'
import MesobLogo from '@/components/brand/MesobLogo'
import { searchServices, Service } from '@/api/tajaajila'

// ─── Per-route background gradients ──────────────────────────────────────────
const getRouteConfig = (t: ReturnType<typeof useLanguage>['t']) => ({
  '/': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.45) 0%,rgba(21,101,192,0.45) 100%)',
    heading: '', subheading: '', showSlideshow: true, showServiceGrid: false,
  },
  '/about': {
    gradient: 'linear-gradient(135deg,rgba(13,71,161,0.96) 0%,rgba(26,107,60,0.96) 100%)',
    heading: t.about.title, subheading: t.about.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/services': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.96) 0%,rgba(13,71,161,0.96) 100%)',
    heading: t.services.title, subheading: t.services.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/tajaajila': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.96) 0%,rgba(13,71,161,0.96) 100%)',
    heading: t.nav.services, subheading: t.services.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/organization': {
    gradient: 'linear-gradient(135deg,rgba(21,101,192,0.96) 0%,rgba(106,27,154,0.96) 100%)',
    heading: t.organization.title, subheading: t.organization.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/announcements': {
    gradient: 'linear-gradient(135deg,rgba(230,81,0,0.97) 0%,rgba(21,101,192,0.97) 100%)',
    heading: t.news.title, subheading: t.news.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/gallery': {
    gradient: 'linear-gradient(135deg,rgba(74,20,140,0.97) 0%,rgba(21,101,192,0.97) 100%)',
    heading: t.gallery.title, subheading: t.gallery.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/faq': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.97) 0%,rgba(0,131,143,0.97) 100%)',
    heading: t.faq.title, subheading: t.faq.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/contact': {
    gradient: 'linear-gradient(135deg,rgba(183,28,28,0.97) 0%,rgba(21,101,192,0.97) 100%)',
    heading: t.contact.title, subheading: t.contact.subtitle, showSlideshow: false, showServiceGrid: false,
  },
  '/feedback': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.97) 0%,rgba(183,28,28,0.97) 100%)',
    heading: t.feedback.title, subheading: t.feedback.subtitle, showSlideshow: false, showServiceGrid: false,
  },
})

const quickServices = [
  { label: 'National ID',       color: 'bg-white/15' },
  { label: 'Passport',          color: 'bg-white/15' },
  { label: 'Business Reg.',     color: 'bg-white/15' },
  { label: 'Civil Registration',color: 'bg-white/15' },
  { label: 'TIN Services',      color: 'bg-white/15' },
  { label: 'Citizen Support',   color: 'bg-white/15' },
]

// ── Cinematic burst slide variants ────────────────────────────────────────────
const slideVariants = {
  enter: {
    opacity: 0.35,
    scale: 1.04,
    filter: 'brightness(0.8) blur(3px)',
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: 'brightness(1) blur(0px)',
  },
  exit: {
    opacity: 0.25,
    scale: 1.08,
    filter: 'brightness(0.65) blur(5px)',
  },
}

const slideTransition = {
  duration: 1.4,
  ease: [0.25, 0.46, 0.45, 0.94] as const, // cubic-bezier — cinematic ease-out
}

// Burst flash overlay — a radial white glow that pulses at the moment of exit
const burstVariants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: { opacity: 0.18, scale: 2.2 },
  gone:    { opacity: 0, scale: 3.0 },
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function Hero() {
  const { t, language } = useLanguage()
  const { activeRoute } = useActiveRoute()
  const navigate = useNavigate()

  const routeConfig = getRouteConfig(t)

  // Localized slide captions
  const slides = [
    { src: '/photo_2026-07-03_10-14-43.jpg', caption: language === 'am' ? 'ዜጎችን በምርጥነት ማገልገል' : language === 'or' ? 'Lammiilee Caalaattiin Tajaajiluu' : 'Serving Citizens with Excellence' },
    { src: '/photo_2026-07-03_10-15-02.jpg', caption: language === 'am' ? 'ዘመናዊ አንድ-ቦታ አገልግሎት ማዕከል' : language === 'or' ? 'Giddu-gala Tajaajila Ammayyaa' : 'Modern One-Stop Service Center' },
    { src: '/photo_2026-07-03_10-15-08.jpg', caption: language === 'am' ? 'ዲጂታዊ መንግሥት ለሁሉም ዜጋ' : language === 'or' ? 'Mootummaa Dijitaalaa Lammiilee Hunda Dhaaf' : 'Digital Government for Every Citizen' },
    { src: '/photo_2026-07-03_10-15-14.jpg', caption: language === 'am' ? 'ግልጽ እና ቀልጣፋ አገልግሎቶች' : language === 'or' ? 'Tajaajilaalee Ifaa fi Saffisaa' : 'Transparent & Efficient Services' },
    { src: '/photo_2026-07-03_10-15-27.jpg', caption: language === 'am' ? 'ማህበረሰቡን ያማከለ መንግሥት' : language === 'or' ? 'Mootummaa Hawaasa Xiyyeeffate' : 'Community-Centered Government' },
    { src: '/photo_2026-07-03_10-15-38.jpg', caption: language === 'am' ? 'የኢትዮጵያ ዲጂታዊ ሽግግር' : language === 'or' ? "Jijjiirama Dijitaalaa Itoophiyaa" : "Ethiopia's Digital Transformation" },
  ]

  const searchPlaceholder = language === 'am' ? 'አገልግሎቶችን ፈልጉ...' : language === 'or' ? 'Tajaajilaalee barbaadi...' : 'Search for services...'
  const searchBtnLabel    = language === 'am' ? 'ፈልግ' : language === 'or' ? 'Barbaadi' : 'Search'
  const officialBadge     = language === 'am' ? 'ኦፊሴላዊ የመንግሥት ፖርታል' : language === 'or' ? 'Poortaala Mootummaa Rasmaa' : 'Official Government Portal'
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [burst,   setBurst]   = useState(false)   // triggers the flash overlay
  const prevRef               = useRef(current)

  // Narrow activeRoute to keys we know to satisfy TS.
  type RouteKey = keyof typeof routeConfig
  const config = routeConfig[(activeRoute as RouteKey) ?? '/'] ?? routeConfig['/']


  // Fire burst flash whenever the slide changes
  useEffect(() => {
    if (prevRef.current === current) return
    prevRef.current = current
    setBurst(true)
    const t = setTimeout(() => setBurst(false), 700)
    return () => clearTimeout(t)
  }, [current])

  // auto-advance slideshow every 5 s
  useEffect(() => {
    if (!config.showSlideshow || paused) return
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [config.showSlideshow, paused])

  const goTo = (idx: number) => {
    setCurrent(idx)
    setPaused(true)
    setTimeout(() => setPaused(false), 8000)
  }
  const prev = () => goTo((current - 1 + slides.length) % slides.length)
  const next = () => goTo((current + 1) % slides.length)

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Service[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Fetch search results when debounced query changes
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 1) {
      setResults([])
      setShowDropdown(false)
      setSearchError(null)
      return
    }

    let cancelled = false
    setIsSearching(true)
    setSearchError(null)

    searchServices(q)
      .then(data => {
        if (!cancelled) {
          // Hero search leads directly to a window card, where floor and requirements are available.
          setResults(data.filter(service => service.window))
          setShowDropdown(true)
          setIsSearching(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setSearchError(err.message || 'Search failed')
          setResults([])
          setShowDropdown(true)
          setIsSearching(false)
        }
      })

    return () => { cancelled = true }
  }, [debouncedQuery])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      setShowDropdown(false)
      navigate(`/services?q=${encodeURIComponent(q)}`)
    }
  }

  const handleSelectService = useCallback((service: Service) => {
    setShowDropdown(false)
    setQuery('')
    const windowId = typeof service.window === 'object' && service.window
      ? service.window._id
      : typeof service.window === 'string' ? service.window : ''
    const orgId = typeof service.organization === 'object' && service.organization
      ? String((service.organization as any)._id || '')
      : typeof service.organization === 'string' ? service.organization : ''
    // Navigate home (cards live on the home page) and auto-open the correct card
    navigate('/', {
      state: {
        openWindowId: windowId || undefined,
        openOrgId: orgId || undefined,
        openServiceId: service._id,
      },
    })
  }, [navigate, language])

  const getLocalizedName = (service: Service): string => {
    if (language === 'am') return service.name.am || service.name.en
    if (language === 'or') return service.name.or || service.name.en
    return service.name.en
  }

  const getLocalizedOrgName = (service: Service): string => {
    if (!service.organization?.name) return ''
    const orgName = service.organization.name as unknown as string | { en: string; am: string; or: string }
    if (typeof orgName === 'string') return orgName
    if (language === 'am') return (orgName as { en: string; am: string; or: string }).am || (orgName as { en: string; am: string; or: string }).en
    if (language === 'or') return (orgName as { en: string; am: string; or: string }).or || (orgName as { en: string; am: string; or: string }).en
    return (orgName as { en: string; am: string; or: string }).en
  }

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex items-center overflow-hidden w-full"
      aria-label="Hero section"
    >
      {/* ── Layer 1: Photo slideshow — cinematic burst/zoom crossfade (home only) ── */}
      {config.showSlideshow && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {/* Slide images with burst-zoom exit + bloom enter */}
          <AnimatePresence mode="sync">
            <motion.div
              key={slides[current].src}
              className="absolute inset-0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              <img
                src={slides[current].src}
                alt={slides[current].caption}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Per-image dark vignette to deepen cinematic feel */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.55) 100%)',
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Burst flash — blue radial bloom that pulses at the moment of transition */}
          <AnimatePresence>
            {burst && (
              <motion.div
                key="burst"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(21,101,192,0.85) 0%, rgba(21,101,192,0.35) 35%, transparent 70%)',
                  mixBlendMode: 'screen',
                }}
                variants={burstVariants}
                initial="hidden"
                animate="visible"
                exit="gone"
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Layer 2: Cross-fading gradient overlays (all routes) ─── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Object.entries(routeConfig).map(([route, cfg]) => (
          <div
            key={route}
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
            style={{ background: cfg.gradient, opacity: activeRoute === route ? 1 : 0 }}
          />
        ))}
      </div>

      {/* ── Layer 3: subtle vignette ─────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
        aria-hidden
      />

      {/* ── Layer 4: dot-grid texture ────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      {/* ─── Foreground ──────────────────────────────────────────── */}
      <div className="container-gov relative z-10 py-20 lg:py-28 w-full">
        <AnimatePresence mode="wait">

          {/* HOME ──────────────────────────────────────────────────── */}
          {config.showSlideshow && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center text-center text-white max-w-3xl mx-auto"
            >
              {/* Logo row */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-6 flex items-center justify-center gap-6"
              >
                <img
                  src="/hero-icon-left.jpeg"
                  alt=""
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-white shadow-lg"
                  draggable={false}
                />
                <MesobLogo size={64} />
                <img
                  src="/hero-icon.jpg"
                  alt=""
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-white shadow-lg"
                  draggable={false}
                />
              </motion.div>

              {/* Headline */}
              <AnimatePresence mode="wait">
                <motion.h1
                  key={current}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 drop-shadow-lg"
                  initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(2px)' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {t.hero.title}{' '}
                  <span className="text-brand-gold">{t.hero.titleHighlight}</span>
                </motion.h1>
              </AnimatePresence>

              {/* Slide caption */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-white/85 text-lg leading-relaxed mb-8 max-w-xl font-medium drop-shadow"
                >
                  {slides[current].caption}
                </motion.p>
              </AnimatePresence>

              {/* Search bar with live results dropdown */}
              <motion.div
                className="w-full max-w-xl mb-10 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                ref={searchRef}
              >
                <form onSubmit={handleSearch} role="search">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden />
                    <input
                      type="search"
                      value={query}
                      onChange={e => {
                        setQuery(e.target.value)
                        if (e.target.value.trim().length > 0) {
                          setShowDropdown(true)
                        } else {
                          setShowDropdown(false)
                          setResults([])
                        }
                      }}
                      onFocus={() => {
                        if (query.trim().length >= 1) setShowDropdown(true)
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full pl-12 pr-32 py-4 rounded-xl bg-white/95 backdrop-blur text-gray-900 placeholder-gray-400 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label={searchPlaceholder}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 text-sm"
                    >
                      {searchBtnLabel}
                    </button>
                  </div>
                </form>

                {/* Search results dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left"
                    >
                      {/* Loading state */}
                      {isSearching && (
                        <div className="flex items-center gap-3 px-5 py-4 text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
                          <span className="text-sm">
                            {language === 'am' ? 'በመፈለግ ላይ...' : language === 'or' ? 'Barbaadamaa jira...' : 'Searching...'}
                          </span>
                        </div>
                      )}

                      {/* Error state */}
                      {!isSearching && searchError && (
                        <div className="px-5 py-4 text-sm text-red-500">
                          {language === 'am' ? 'ፍለጋው አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : language === 'or' ? 'Barbaadni hin milkoofne. Mee ammas yaali.' : 'Search failed. Please try again.'}
                        </div>
                      )}

                      {/* Empty state */}
                      {!isSearching && !searchError && query.trim().length >= 1 && results.length === 0 && (
                        <div className="px-5 py-6 text-center">
                          <p className="text-gray-400 text-sm">
                            {language === 'am' ? 'ምንም አገልግሎት አልተገኘም' : language === 'or' ? 'Tajaajilli tokkollee hin argamne' : 'No services found'}
                          </p>
                          <p className="text-gray-300 text-xs mt-1">
                            {language === 'am' ? `"${query}" በሚለው ፍለጋ` : language === 'or' ? `Barbaaduu "${query}"` : `for "${query}"`}
                          </p>
                        </div>
                      )}

                      {/* Results */}
                      {!isSearching && results.length > 0 && (
                        <ul>
                          {results.map((service) => (
                            <li key={service._id}>
                              <button
                                onClick={() => handleSelectService(service)}
                                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-green transition-colors truncate">
                                    {getLocalizedName(service)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {getLocalizedOrgName(service) && (
                                      <span className="text-xs text-gray-400 truncate">
                                        {getLocalizedOrgName(service)}
                                      </span>
                                    )}
                                    {service.window && (
                                      <span className="text-xs text-brand-green font-medium shrink-0">
                                        {language === 'am' ? `ፎዳ ${service.window.number} (ወለል ${service.window.floor})` : language === 'or' ? `Foddaa ${service.window.number} (Darbii ${service.window.floor})` : `Window ${service.window.number} (Floor ${service.window.floor})`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-green shrink-0 transition-colors" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* See all results link */}
                      {!isSearching && results.length > 0 && (
                        <button
                          onClick={() => {
                            setShowDropdown(false)
                            navigate(`/services?q=${encodeURIComponent(query.trim())}`)
                          }}
                          className="w-full px-5 py-3 text-center text-sm text-brand-green font-medium hover:bg-brand-green/5 transition-colors border-t border-gray-100"
                        >
                          {language === 'am' ? `ሁሉንም ውጤቶች ለ "${query}" ይመልከቱ` : language === 'or' ? `Bu'aa hunda ilaali "${query}"` : `See all results for "${query}"`}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Slide controls */}
              <motion.div
                className="flex items-center gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <button
                  onClick={prev}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 backdrop-blur-sm transition-all duration-200 active:scale-90"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Dots */}
                <div className="flex gap-2" role="tablist" aria-label="Slide navigation">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === current}
                      onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full ${
                        i === current
                          ? 'w-7 h-2.5 bg-white'
                          : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 backdrop-blur-sm transition-all duration-200 active:scale-90"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* SERVICE GRID ──────────────────────────────────────────── */}
          {config.showServiceGrid && (
            <motion.div
              key={`grid-${activeRoute}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45 }}
              className="text-white"
            >
              <div className="text-center mb-10">
                <Badge variant="new" size="lg" className="mb-4 bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                  <Star className="h-3.5 w-3.5" /> {officialBadge}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">{config.heading}</h1>
                <p className="text-white/80 text-lg">{config.subheading}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
                {quickServices.map((svc, i) => (
                  <motion.div
                    key={svc.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                  >
                    <Link
                      to="/services"
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/25 backdrop-blur-sm hover:bg-white/25 hover:scale-105 transition-all duration-200 ${svc.color} text-white`}
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="text-xs font-semibold text-center leading-tight">{svc.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* GENERIC PAGE HEADING ──────────────────────────────────── */}
          {!config.showSlideshow && !config.showServiceGrid && (
            <motion.div
              key={`heading-${activeRoute}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center text-white max-w-2xl mx-auto"
            >
              <Badge variant="new" size="lg" className="mb-6 bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5" /> {officialBadge}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 drop-shadow-lg">
                {config.heading}
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">{config.subheading}</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden>
 <svg viewBox="0 0 1440 80" className="w-full h-20 fill-current text-background dark:text-gray-900">
  <path d="M0,80 L0,30 H240 V50 H520 V25 H880 V60 H1200 V35 H1440 V80 Z" />
</svg>
      </div>
    </section>
  )
}