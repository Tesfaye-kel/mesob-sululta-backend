import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useActiveRoute } from '@/contexts/ActiveRouteContext'
import { Badge } from '@/components/ui/Badge'
import AnimatedCounter from './AnimatedCounter'

// ─── Photos from /public ──────────────────────────────────────────────────────
const slides = [
  {
    src: '/photo_2026-07-03_10-14-43.jpg',
    caption: 'Serving Citizens with Excellence',
  },
  {
    src: '/photo_2026-07-03_10-15-02.jpg',
    caption: 'Modern One-Stop Service Center',
  },
  {
    src: '/photo_2026-07-03_10-15-08.jpg',
    caption: 'Digital Government for Every Citizen',
  },
  {
    src: '/photo_2026-07-03_10-15-14.jpg',
    caption: 'Transparent & Efficient Services',
  },
  {
    src: '/photo_2026-07-03_10-15-27.jpg',
    caption: 'Community-Centered Government',
  },
  {
    src: '/photo_2026-07-03_10-15-38.jpg',
    caption: "Ethiopia's Digital Transformation",
  },
]

// ─── Per-route background gradients ──────────────────────────────────────────
const routeConfig: Record<string, {
  gradient: string
  heading: string
  subheading: string
  showSlideshow: boolean
  showServiceGrid: boolean
}> = {
  '/': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.82) 0%,rgba(21,101,192,0.82) 100%)',
    heading: '', subheading: '',
    showSlideshow: true, showServiceGrid: false,
  },
  '/about': {
    gradient: 'linear-gradient(135deg,rgba(13,71,161,0.88) 0%,rgba(26,107,60,0.88) 100%)',
    heading: 'About MESOB Center', subheading: ', Mission & Vision',
    showSlideshow: false, showServiceGrid: false,
  },
  '/services': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.88) 0%,rgba(13,71,161,0.88) 100%)',
    heading: 'Government Services', subheading: 'Access 50+ Federal Services in One Place',
    showSlideshow: false, showServiceGrid: true,
  },
  '/organization': {
    gradient: 'linear-gradient(135deg,rgba(21,101,192,0.88) 0%,rgba(106,27,154,0.88) 100%)',
    heading: 'Organization Structure', subheading: 'Leadership, Departments & Hierarchy',
    showSlideshow: false, showServiceGrid: true,
  },
  '/departments': {
    gradient: 'linear-gradient(135deg,rgba(0,105,92,0.88) 0%,rgba(21,101,192,0.88) 100%)',
    heading: 'Our Departments', subheading: 'Dedicated Teams Serving Citizens',
    showSlideshow: false, showServiceGrid: true,
  },
  '/announcements': {
    gradient: 'linear-gradient(135deg,rgba(230,81,0,0.88) 0%,rgba(21,101,192,0.88) 100%)',
    heading: 'Announcements', subheading: 'Latest News & Official Notices',
    showSlideshow: false, showServiceGrid: false,
  },
  '/gallery': {
    gradient: 'linear-gradient(135deg,rgba(74,20,140,0.88) 0%,rgba(21,101,192,0.88) 100%)',
    heading: 'Gallery', subheading: 'Moments from MESOB Sululta Branch',
    showSlideshow: false, showServiceGrid: false,
  },
  '/faq': {
    gradient: 'linear-gradient(135deg,rgba(26,107,60,0.88) 0%,rgba(0,131,143,0.88) 100%)',
    heading: 'Frequently Asked Questions', subheading: 'Find Answers to Common Questions',
    showSlideshow: false, showServiceGrid: false,
  },
  '/contact': {
    gradient: 'linear-gradient(135deg,rgba(183,28,28,0.88) 0%,rgba(21,101,192,0.88) 100%)',
    heading: 'Contact Us', subheading: 'Get in Touch with MESOB Sululta Branch',
    showSlideshow: false, showServiceGrid: false,
  },
}

const quickServices = [
  { label: 'National ID',       color: 'bg-white/15' },
  { label: 'Passport',          color: 'bg-white/15' },
  { label: 'Business Reg.',     color: 'bg-white/15' },
  { label: 'Civil Registration',color: 'bg-white/15' },
  { label: 'TIN Services',      color: 'bg-white/15' },
  { label: 'Citizen Support',   color: 'bg-white/15' },
]

// ── Cinematic burst slide variants ────────────────────────────────────────────
// Exit: the current image gently "explodes" outward — scales up while fading out,
//       giving a soft burst/bloom effect before the next image appears.
// Enter: the new image blooms in from a slight under-scale, creating a cinematic
//        "push through" feel with a subtle luminance overlay at peak transition.
const slideVariants = {
  enter: {
    opacity: 0,
    scale: 1.08,
    filter: 'brightness(1.35) blur(6px)',
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: 'brightness(1) blur(0px)',
  },
  exit: {
    opacity: 0,
    scale: 1.18,
    filter: 'brightness(1.6) blur(4px)',
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

export default function Hero() {
  const { t } = useLanguage()
  const { activeRoute } = useActiveRoute()
  const navigate = useNavigate()

  const [query,   setQuery]   = useState('')
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [burst,   setBurst]   = useState(false)   // triggers the flash overlay
  const prevRef               = useRef(current)

  const config = routeConfig[activeRoute] ?? routeConfig['/']

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/services?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <section
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
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
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
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Badge
                  variant="new"
                  size="lg"
                  className="mb-6 bg-white/15 text-white border border-white/25 backdrop-blur-sm"
                >
                  <Star className="h-3.5 w-3.5" aria-hidden />
                  {t.hero.badge}
                </Badge>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 drop-shadow-lg"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.55 }}
              >
                {t.hero.title}{' '}
                <span className="text-brand-gold">{t.hero.titleHighlight}</span>
              </motion.h1>

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

              {/* Search bar */}
              <motion.form
                onSubmit={handleSearch}
                className="w-full max-w-xl mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                role="search"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search for services"
                    className="w-full pl-12 pr-32 py-4 rounded-xl bg-white/95 backdrop-blur text-gray-900 placeholder-gray-400 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    aria-label="Search for services"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 text-sm"
                  >
                    Search
                  </button>
                </div>
              </motion.form>

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
                  <Star className="h-3.5 w-3.5" /> Official Portal
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
                <Star className="h-3.5 w-3.5" /> Official Portal
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
          <path d="M0,80 L0,40 Q180,0 360,30 Q540,60 720,35 Q900,10 1080,40 Q1260,70 1440,30 L1440,80 Z" />
        </svg>
      </div>
    </section>
  )
}
