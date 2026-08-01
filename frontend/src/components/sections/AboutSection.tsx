import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Target, Eye, Heart, Award, TrendingUp, History, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { getAbout, type AboutContent } from '@/api/tajaajila'
import { getImageUrl } from '@/lib/images'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={fadeUp} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Icon mapping ─────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart: Heart,
  Award: Award,
  Eye: Eye,
  TrendingUp: TrendingUp,
  Target: Target,
  History: History,
}

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return iconMap[iconName] || Heart
}

// ─── Static color mapping ──────────────────────────────────────────
// Literal class strings so Tailwind JIT always includes them.
const VALUE_COLORS: Record<string, { text: string; bg: string; glow: string }> = {
  red:    { text: 'text-red-600 dark:text-red-400',                  bg: 'bg-red-100 dark:bg-red-900/30',            glow: 'group-hover:shadow-red-500/20' },
  gold:   { text: 'text-brand-gold',                                 bg: 'bg-brand-gold/10 dark:bg-brand-gold/25',   glow: 'group-hover:shadow-yellow-500/20' },
  blue:   { text: 'text-brand-blue dark:text-blue-300',              bg: 'bg-brand-blue/10 dark:bg-brand-blue/25',   glow: 'group-hover:shadow-blue-500/20' },
  green:  { text: 'text-brand-green dark:text-brand-green-light',    bg: 'bg-brand-green/10 dark:bg-brand-green/25', glow: 'group-hover:shadow-green-500/20' },
  purple: { text: 'text-purple-600 dark:text-purple-400',            bg: 'bg-purple-100 dark:bg-purple-900/30',      glow: 'group-hover:shadow-purple-500/20' },
  teal:   { text: 'text-teal-600 dark:text-teal-400',                bg: 'bg-teal-100 dark:bg-teal-900/30',          glow: 'group-hover:shadow-teal-500/20' },
}

function getValueColor(color = ''): { text: string; bg: string; glow: string } {
  const c = (color || '').toLowerCase()
  if (c.includes('red')) return VALUE_COLORS.red
  if (c.includes('gold') || c.includes('yellow')) return VALUE_COLORS.gold
  if (c.includes('blue')) return VALUE_COLORS.blue
  if (c.includes('purple')) return VALUE_COLORS.purple
  if (c.includes('teal')) return VALUE_COLORS.teal
  if (c.includes('green')) return VALUE_COLORS.green
  return VALUE_COLORS.green
}

// ─── Stat text colors (literal so Tailwind keeps them) ─────────────
const STAT_COLORS: Record<string, string> = {
  red:    'text-red-600',
  gold:   'text-brand-gold',
  blue:   'text-brand-blue',
  green:  'text-brand-green',
  purple: 'text-purple-600',
  teal:   'text-teal-600',
}

function getStatColor(color = ''): string {
  const c = (color || '').toLowerCase()
  if (c.includes('red')) return STAT_COLORS.red
  if (c.includes('gold') || c.includes('yellow')) return STAT_COLORS.gold
  if (c.includes('blue')) return STAT_COLORS.blue
  if (c.includes('purple')) return STAT_COLORS.purple
  if (c.includes('teal')) return STAT_COLORS.teal
  if (c.includes('green')) return STAT_COLORS.green
  return STAT_COLORS.green
}

export default function AboutSection() {
  const { t, language } = useLanguage()
  const [about, setAbout] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAbout()
      .then(setAbout)
      .catch(() => {}) // Silently fail — render fallbacks
      .finally(() => setLoading(false))
  }, [])

  const get = (obj?: { en: string; am: string; or: string } | null): string => {
    if (!obj) return ''
    return language === 'am' ? obj.am : language === 'or' ? obj.or : obj.en
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    )
  }

  // Sort sub-documents by order
  const story = about?.story ? [...about.story].sort((a, b) => a.order - b.order) : []
  const values = about?.values ? [...about.values].sort((a, b) => a.order - b.order) : []
  const stats = about?.stats ? [...about.stats].sort((a, b) => a.order - b.order) : []

  const managerPhoto = about?.managerPhoto || ''
  const managerName = about?.managerName || ''
  const managerTitle = get(about?.managerTitle)
  const managerMessage = get(about?.managerMessage)
  const managerInitial = managerName ? managerName.charAt(0).toUpperCase() : 'A'

  return (
    <div className="container-gov space-y-28">

      {/* ── Story ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-green-light mb-4">
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" />
            {get(about?.storyBadge) || t.about.history}
          </span>
          {/* Visible on both light and dark backgrounds */}
          <h2 className="text-3xl md:text-4xl font-bold text-brand-blue dark:text-blue-300">
            {get(about?.storyTitle) || t.about.ourStory}
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
            {story.length > 0 ? story.map((s, i) => (
              <p key={s._id || i}>{get(s.paragraph)}</p>
            )) : (
              <>
                <p>{get(about?.history) || ''}</p>
                <p>{get(about?.branchIntroduction) || ''}</p>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-green/10 dark:bg-brand-green/20 rounded-full blur-2xl pointer-events-none" aria-hidden />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full blur-2xl pointer-events-none" aria-hidden />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl dark:shadow-black/30">
              {stats.map((stat, i) => (
                <motion.div key={stat._id || i}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <span className={cn('text-3xl font-extrabold tabular-nums', getStatColor(stat.color))}>{stat.value}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                    {get(stat.label)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Mission & Vision ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: Target, bg: 'from-brand-green to-brand-green/80', title: get(about?.missionTitle) || t.about.mission,
            text: get(about?.mission) },
          { icon: Eye,    bg: 'from-brand-blue to-brand-blue/80',  title: get(about?.visionTitle) || t.about.vision,
            text: get(about?.vision) },
        ].map(({ icon: Icon, bg, title, text }, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <motion.div
              className={cn('relative overflow-hidden rounded-2xl p-8 h-full text-white bg-gradient-to-br', bg, 'shadow-lg hover:shadow-2xl transition-shadow duration-300')}
              whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" aria-hidden />
              <Icon className="h-10 w-10 text-white/70 mb-5" aria-hidden />
              <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
              <p className="text-white/90 leading-relaxed">{text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      {/* ── Core Values ── */}
      <div>
        <Reveal className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-green-light mb-3">
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" />
            {get(about?.valuesTitle) || t.about.values}
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" />
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{get(about?.valuesTitle) || t.about.values}</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto italic">{get(about?.valuesSubtitle) || ''}</p>
        </Reveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={stagger}
        >
          {values.map((v) => {
            const Icon = getIcon(v.icon)
            const title = get(v.title)
            const desc = get(v.description)
            const vc = getValueColor(v.color)
            return (
              <motion.div key={v._id || v.title.en} variants={cardVariant}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-shadow duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', vc.bg, vc.text, 'group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-lg', vc.glow)}>
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* ── Manager Message ── */}
      {managerMessage && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brand-green/25 bg-white dark:bg-gray-800 p-10 md:p-14 shadow-lg dark:shadow-black/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" aria-hidden />

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center text-white text-3xl font-extrabold shrink-0 shadow-lg overflow-hidden"
                whileHover={{ rotate: 3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {managerPhoto ? (
                  <img src={getImageUrl(managerPhoto)} alt={managerName} className="w-full h-full object-cover" />
                ) : (
                  managerInitial
                )}
              </motion.div>

              <div className="flex-1">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-green-light mb-4">
                  <span className="h-px w-6 bg-brand-green dark:bg-brand-green-light" />
                  {get(about?.managerMessageTitle) || t.about.managerMessage}
                </span>
                <div className="text-6xl text-brand-green/20 dark:text-brand-green/30 font-serif leading-none mb-2 select-none" aria-hidden>"</div>
                <blockquote className="text-gray-800 dark:text-gray-100 leading-relaxed text-lg md:text-xl font-medium mb-5 -mt-4">
                  {managerMessage}
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-brand-gold" aria-hidden />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{managerName || 'Branch Manager'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{managerTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}

