import { useState, useEffect, useRef } from 'react'
import { saveCache, loadCache } from '@/lib/cache'
import { motion, useInView } from 'framer-motion'
import { Target, Eye, Heart, Award, TrendingUp, History, Loader2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { getAbout, getFeedbackSummary, getServices, getOrganizations, type AboutContent } from '@/api/tajaajila'
import { getImageUrl } from '@/lib/images'

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
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
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)
  const [showOverallScore, setShowOverallScore] = useState(true)
  const [serviceCount, setServiceCount] = useState<number | null>(null)
  const [officeCount, setOfficeCount] = useState<number | null>(null)

  useEffect(() => {
    // Load from cache immediately so content shows even offline
    const cached = loadCache<AboutContent>('about')
    if (cached) { setAbout(cached); setLoading(false) }

    getAbout()
      .then(data => { setAbout(data); saveCache('about', data) })
      .catch(() => { if (!cached) setLoading(false) })
      .finally(() => setLoading(false))

    const refreshDynamicStats = () => {
      getFeedbackSummary()
        .then(data => {
          setShowOverallScore(data.showOverallProjectScore)
          setFeedbackScore(data.showOverallProjectScore ? data.overallProjectScore : null)
        })
        .catch(() => {})
      getServices()
        .then(data => {
          const uniqueServices = new Set(
            data.map(service => [service.name.en, service.name.am, service.name.or]
              .map(name => name.trim().toLowerCase())
              .join('|'))
          )
          setServiceCount(uniqueServices.size)
        })
        .catch(() => {})
      getOrganizations()
        .then(data => setOfficeCount(data.length))
        .catch(() => {})
    }
    refreshDynamicStats()
    const statsInterval = window.setInterval(refreshDynamicStats, 15000)
    return () => window.clearInterval(statsInterval)
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
          SEENAA / HISTORY — full-bleed visual story
      ══════════════════════════════════════════════════════════ */}
      <Reveal className="mb-14" delay={0.05}>
        <section
          className="relative isolate -mx-4 overflow-hidden border-y border-gray-200 px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 md:py-14"
          style={{ backgroundImage: "url('/photo_2026-07-03_10-15-27.jpg')", backgroundPosition: 'center', backgroundSize: 'cover' }}
        >
          <div className="absolute inset-0 -z-10 bg-white/78 backdrop-blur-[1px]" aria-hidden />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/80 to-white/55" aria-hidden />

          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center">
              <h1 className="max-w-5xl text-3xl font-extrabold leading-tight tracking-tight text-[#102b4e] md:text-5xl">
                {t.about.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
                {t.about.subtitle}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green">
                <span className="h-px w-8 bg-brand-gold" aria-hidden />
                {get(about?.storyBadge) || (language === 'or' ? 'Seenaa' : language === 'am' ? 'ታሪክ' : 'History')}
                <span className="h-px w-8 bg-brand-gold" aria-hidden />
              </span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#102b4e] md:text-5xl">
                {get(about?.storyTitle) || (language === 'or' ? 'Seenaa Keenya' : language === 'am' ? 'ታሪካችን' : 'Our Story')}
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="space-y-5 text-base leading-8 text-gray-800 md:text-lg">
                {story.length > 0
                  ? story.map((s, i) => <p key={s._id || i}>{get(s.paragraph)}</p>)
                  : (
                    <>
                      {get(about?.history) && <p>{get(about?.history)}</p>}
                      {get(about?.branchIntroduction) && <p>{get(about?.branchIntroduction)}</p>}
                    </>
                  )}
              </div>

              {highlights.length > 0 && (
                <div className="self-start border-l-4 border-brand-green bg-white/65 p-6 shadow-sm backdrop-blur-sm md:p-8">
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-green">
                  {get(about?.highlightsTitle) || (language === 'or' ? 'Waan Nu Addeessu' : language === 'am' ? 'የሚለየን ነገር' : 'What Distinguishes Us')}
                </p>
                <ul className="space-y-4">
                  {highlights.map((h, i) => (
                    <motion.li
                      key={h._id || i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.35 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" aria-hidden />
                      <span className="text-sm leading-6 text-gray-800 md:text-base">{get(h.text)}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Stats row — left / center / right alignment */}
      {stats.length > 0 && (
        <Reveal className="mb-16">
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-10">
            <div className="flex items-start justify-between gap-6">
              {stats.map((stat, i) => {
                const isSatisfactionStat = stat.label.en.toLowerCase().includes('satisfaction')
                if (isSatisfactionStat && !showOverallScore) return null
                const align =
                  i === 0 ? 'text-left' :
                  i === stats.length - 1 ? 'text-right' :
                  'text-center mx-auto'
                return (
                  <motion.div
                    key={stat._id || i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className={cn('flex-1', align)}
                  >
                    <p className={cn('text-4xl md:text-5xl font-extrabold tabular-nums leading-none', getStatColor(stat.color))}>
                      {stat.label.en.toLowerCase().includes('service') && serviceCount !== null
                        ? `${serviceCount}+`
                        : stat.label.en.toLowerCase().includes('satisfaction') && feedbackScore !== null
                          ? `${feedbackScore}%`
                          : (stat.label.en.toLowerCase().includes('office') || stat.label.en.toLowerCase().includes('department')) && officeCount !== null
                            ? String(officeCount)
                            : stat.value}
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
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.45 } } }}
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
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.45 } } }}
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
            {t.about.values}
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" aria-hidden />
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {t.about.values}
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
