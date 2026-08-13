import { useState, useEffect, useRef } from 'react'
import { saveCache, loadCache } from '@/lib/cache'
import { motion, useInView } from 'framer-motion'
import { Target, Eye, Heart, Award, TrendingUp, History, Loader2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { getAbout, type AboutContent } from '@/api/tajaajila'
import { getImageUrl } from '@/lib/images'

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Award, Eye, TrendingUp, Target, History,
}
function getIcon(name: string) { return iconMap[name] || Heart }

const VALUE_COLORS: Record<string, { text: string; bg: string }> = {
  red:    { text: 'text-red-600 dark:text-red-400',                bg: 'bg-red-50 dark:bg-red-900/20' },
  gold:   { text: 'text-amber-600 dark:text-amber-400',            bg: 'bg-amber-50 dark:bg-amber-900/20' },
  blue:   { text: 'text-blue-700 dark:text-blue-400',              bg: 'bg-blue-50 dark:bg-blue-900/20' },
  green:  { text: 'text-emerald-700 dark:text-emerald-400',        bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  purple: { text: 'text-violet-700 dark:text-violet-400',          bg: 'bg-violet-50 dark:bg-violet-900/20' },
  teal:   { text: 'text-teal-700 dark:text-teal-400',              bg: 'bg-teal-50 dark:bg-teal-900/20' },
}
function getValueColor(color = '') {
  const c = color.toLowerCase()
  if (c.includes('red'))    return VALUE_COLORS.red
  if (c.includes('gold') || c.includes('yellow')) return VALUE_COLORS.gold
  if (c.includes('blue'))   return VALUE_COLORS.blue
  if (c.includes('purple')) return VALUE_COLORS.purple
  if (c.includes('teal'))   return VALUE_COLORS.teal
  return VALUE_COLORS.green
}

const STAT_COLORS: Record<string, string> = {
  red: 'text-red-600', gold: 'text-amber-600', blue: 'text-blue-700',
  green: 'text-brand-green', purple: 'text-violet-700', teal: 'text-teal-600',
}
function getStatColor(color = '') {
  const c = color.toLowerCase()
  if (c.includes('red'))    return STAT_COLORS.red
  if (c.includes('gold') || c.includes('yellow')) return STAT_COLORS.gold
  if (c.includes('blue'))   return STAT_COLORS.blue
  if (c.includes('purple')) return STAT_COLORS.purple
  if (c.includes('teal'))   return STAT_COLORS.teal
  return STAT_COLORS.green
}

export default function AboutSection() {
  const { t, language } = useLanguage()
  const [about, setAbout] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from cache immediately so content shows even offline
    const cached = loadCache<AboutContent>('about')
    if (cached) { setAbout(cached); setLoading(false) }

    getAbout()
      .then(data => { setAbout(data); saveCache('about', data) })
      .catch(() => { if (!cached) setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const get = (obj?: { en: string; am: string; or: string } | null): string => {
    if (!obj) return ''
    return language === 'am' ? obj.am : language === 'or' ? obj.or : obj.en
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  const story     = about?.story     ? [...about.story].sort((a, b)     => a.order - b.order) : []
  const highlights = about?.highlights ? [...about.highlights].sort((a, b) => a.order - b.order) : []
  const values    = about?.values    ? [...about.values].sort((a, b)    => a.order - b.order) : []
  const stats     = about?.stats     ? [...about.stats].sort((a, b)     => a.order - b.order) : []

  const managerPhoto   = about?.managerPhoto || ''
  const managerName    = about?.managerName  || ''
  const managerTitle   = get(about?.managerTitle)
  const managerMessage = get(about?.managerMessage)
  const managerInitial = managerName ? managerName.charAt(0).toUpperCase() : 'A'

  return (
    <div className="container-gov">

      {/* ══════════════════════════════════════════════════════════
          SEENAA / HISTORY — pure editorial text, no cards
      ══════════════════════════════════════════════════════════ */}
      <Reveal className="mb-3">
        {/* Eyebrow label */}
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green dark:text-brand-green-light">
          <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
          {get(about?.storyBadge) || (language === 'or' ? 'Seenaa' : language === 'am' ? 'ታሪክ' : 'History')}
        </span>
      </Reveal>

      <Reveal className="mb-8" delay={0.05}>
        {/* Section headline */}
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
          {get(about?.storyTitle) || (language === 'or' ? 'Seenaa Keenya' : language === 'am' ? 'ታሪካችን' : 'Our Story')}
        </h2>
        {/* Thin accent underline */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-0.5 w-14 rounded-full bg-brand-green" aria-hidden />
          <div className="h-0.5 w-6 rounded-full bg-brand-gold" aria-hidden />
        </div>
      </Reveal>

      {/* Story body text + highlights — two columns on desktop */}
      <Reveal className="mb-14" delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* LEFT: story paragraphs */}
          <div className="space-y-5 text-gray-700 dark:text-gray-300 text-base md:text-lg leading-[1.85]">
            {story.length > 0
              ? story.map((s, i) => <p key={s._id || i}>{get(s.paragraph)}</p>)
              : (
                <>
                  {get(about?.history) && <p>{get(about?.history)}</p>}
                  {get(about?.branchIntroduction) && <p>{get(about?.branchIntroduction)}</p>}
                </>
              )}
          </div>

          {/* RIGHT: highlights list with checkmark symbols */}
          {highlights.length > 0 && (
            <div>
              {/* Section label */}
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-green dark:text-brand-green-light mb-4">
                {get(about?.highlightsTitle) || (language === 'or' ? 'Waan Nu Addeessu' : language === 'am' ? 'የሚለየን ነገር' : 'What Distinguishes Us')}
              </p>
              <ul className="space-y-3">
                {highlights.map((h, i) => (
                  <motion.li
                    key={h._id || i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-brand-green dark:text-brand-green-light mt-0.5 shrink-0" aria-hidden />
                    <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-snug">
                      {get(h.text)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Reveal>

      {/* Stats row — left / center / right alignment */}
      {stats.length > 0 && (
        <Reveal className="mb-16">
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-10">
            <div className="flex items-start justify-between gap-6">
              {stats.map((stat, i) => {
                const align =
                  i === 0 ? 'text-left' :
                  i === stats.length - 1 ? 'text-right' :
                  'text-center mx-auto'
                return (
                  <motion.div
                    key={stat._id || i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className={cn('flex-1', align)}
                  >
                    <p className={cn('text-4xl md:text-5xl font-extrabold tabular-nums leading-none', getStatColor(stat.color))}>
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 leading-snug">
                      {get(stat.label)}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══════════════════════════════════════════════════════════
          ERGAMA / MUL'ATA / KAYYOO — cards same style as Gatiileen Ijoo
      ══════════════════════════════════════════════════════════ */}
      {(get(about?.mission) || get(about?.vision) || get(about?.objectives)) && (
        <div className="mb-20">
          <Reveal className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green dark:text-brand-green-light mb-3">
              <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
              {language === 'or' ? 'Ergama, Mul\'ata fi Kayyoo' : language === 'am' ? 'ተልዕኮ፣ ራዕይ እና ዓላማ' : 'Mission, Vision & Objectives'}
              <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
            </span>
          </Reveal>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            {/* Mission */}
            {get(about?.mission) && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                className="group bg-[#1e3a5f] dark:bg-gray-900 rounded-2xl p-6 border border-[#1e3a5f] dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/15 text-white">
                  <Target className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-bold text-white dark:text-white mb-2 text-base">
                  {get(about?.missionTitle) || (language === 'or' ? 'Ergama' : language === 'am' ? 'ተልዕኮ' : 'Mission')}
                </h3>
                <p className="text-sm text-blue-100 dark:text-gray-400 leading-relaxed">{get(about?.mission)}</p>
              </motion.div>
            )}

            {/* Vision */}
            {get(about?.vision) && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                className="group bg-[#2d1b69] dark:bg-gray-900 rounded-2xl p-6 border border-[#2d1b69] dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/15 text-white">
                  <Eye className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-bold text-white dark:text-white mb-2 text-base">
                  {get(about?.visionTitle) || (language === 'or' ? "Mul'ata" : language === 'am' ? 'ራዕይ' : 'Vision')}
                </h3>
                <p className="text-sm text-purple-100 dark:text-gray-400 leading-relaxed">{get(about?.vision)}</p>
              </motion.div>
            )}

            {/* Objectives */}
            {get(about?.objectives) && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                className="group bg-[#7b3f00] dark:bg-gray-900 rounded-2xl p-6 border border-[#7b3f00] dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/15 text-white">
                  <Award className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-bold text-white dark:text-white mb-2 text-base">
                  {language === 'or' ? 'Kayyoo' : language === 'am' ? 'ዓላማ' : 'Objectives'}
                </h3>
                <p className="text-sm text-orange-100 dark:text-gray-400 leading-relaxed">{get(about?.objectives)}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          GATIILEEN IJOO / CORE VALUES — cards (unchanged)
      ══════════════════════════════════════════════════════════ */}
      <div>
        <Reveal className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green dark:text-brand-green-light mb-3">
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
            {get(about?.valuesTitle) || t.about.values}
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {get(about?.valuesTitle) || t.about.values}
          </h2>
          {get(about?.valuesSubtitle) && (
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{get(about?.valuesSubtitle)}</p>
          )}
        </Reveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          {values.map((v) => {
            const Icon = getIcon(v.icon)
            const vc = getValueColor(v.color)
            return (
              <motion.div
                key={v._id || v.title.en}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', vc.bg, vc.text)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{get(v.title)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{get(v.description)}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MANAGER MESSAGE
      ══════════════════════════════════════════════════════════ */}
      {managerMessage && (
        <Reveal className="mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 md:p-14 shadow-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" aria-hidden />

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center text-white text-3xl font-extrabold shrink-0 shadow-md overflow-hidden"
                whileHover={{ rotate: 3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {managerPhoto
                  ? <img src={getImageUrl(managerPhoto)} alt={managerName} className="w-full h-full object-cover" />
                  : managerInitial
                }
              </motion.div>

              <div className="flex-1">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green dark:text-brand-green-light mb-4">
                  <span className="h-px w-6 bg-brand-green dark:bg-brand-green-light" aria-hidden />
                  {get(about?.managerMessageTitle) || t.about.managerMessage}
                </span>
                <div className="text-5xl text-brand-green/20 dark:text-brand-green/25 font-serif leading-none mb-1 select-none" aria-hidden>"</div>
                <blockquote className="text-gray-800 dark:text-gray-100 leading-relaxed text-lg md:text-xl font-medium mb-5 -mt-3">
                  {managerMessage}
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-px w-10 bg-brand-gold" aria-hidden />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{managerName || 'Branch Manager'}</p>
                    {managerTitle && <p className="text-sm text-gray-500 dark:text-gray-400">{managerTitle}</p>}
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
