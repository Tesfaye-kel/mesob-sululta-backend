import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Target, Eye, Heart, Award, TrendingUp, History } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function AboutSection() {
  const { t, language } = useLanguage()

  const values = [
    { icon: Heart,      color: 'bg-red-100    dark:bg-red-900/30    text-red-600    dark:text-red-400',
      glow: 'group-hover:shadow-red-500/20',
      titleEn: 'Citizen-First',   titleAm: 'ዜጎችን ቅድሚያ',        titleOr: 'Lammiilee Dursa Kennu',
      descEn:  'Every decision starts with what is best for citizens.',
      descAm:  'ለዜጎች ምርጥ የሆነው ከማሰብ ጀምሮ እያንዳንዱ ውሳኔ ይወሰናል።',
      descOr:  "Murteen hundi kan jalqaban maal lammiileef gaariidha." },
    { icon: Award,      color: 'bg-brand-gold/10 dark:bg-brand-gold/25 text-brand-gold',
      glow: 'group-hover:shadow-yellow-500/20',
      titleEn: 'Excellence',      titleAm: 'ምርጥነት',              titleOr: 'Caalaatti Hojjechuu',
      descEn:  'We strive for the highest quality in every service delivered.',
      descAm:  'በሚሰጠው እያንዳንዱ አገልግሎት ከፍተኛ ጥራት ለማሳካት እንጥራለን።',
      descOr:  "Tajaajila kennamu kamiyyuu keessatti qulqullina olaanaa galmaasuuf hojjennan." },
    { icon: Eye,        color: 'bg-brand-blue/10 dark:bg-brand-blue/25 text-brand-blue  dark:text-blue-300',
      glow: 'group-hover:shadow-blue-500/20',
      titleEn: 'Transparency',    titleAm: 'ግልጽነት',              titleOr: 'Iftoomina',
      descEn:  'Open, honest, and accountable operations at all times.',
      descAm:  'ሁሌ ጊዜ ክፍት፣ ታማኝ እና ተጠያቂ አሠራር።',
      descOr:  "Hojii baname, dhugaawaa fi itti gaafatamaa yeroo hunda." },
    { icon: TrendingUp, color: 'bg-brand-green/10 dark:bg-brand-green/25 text-brand-green dark:text-brand-green-light',
      glow: 'group-hover:shadow-green-500/20',
      titleEn: 'Innovation',      titleAm: 'ፈጠራ',                titleOr: 'Haaroomsa',
      descEn:  'Embracing digital transformation to modernize service delivery.',
      descAm:  'የዲጂታል ለውጥን ተቀብሎ አገልግሎት አሰጣጥን ዘመናዊ ማድረግ።',
      descOr:  "Jijjiirama dijitaalaa fudhachuun tajaajila kennuu ammayyeessuu." },
    { icon: Target,     color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      glow: 'group-hover:shadow-purple-500/20',
      titleEn: 'Efficiency',      titleAm: 'ቅልጥፍና',              titleOr: 'Hojii Saffisaa',
      descEn:  'Minimizing bureaucracy to maximize value for citizens.',
      descAm:  'ቢሮክራሲን ቀንሶ ለዜጎች ዋጋ ማሳደግ።',
      descOr:  "Biirookratii hir'isuun bu'aa lammiileef guddisuu." },
    { icon: History,    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      glow: 'group-hover:shadow-teal-500/20',
      titleEn: 'Integrity',       titleAm: 'ሐቀኝነት',              titleOr: "Qulqullina Yaadaa",
      descEn:  'Upholding the highest ethical standards in public service.',
      descAm:  'ለህዝብ አገልግሎት ከፍተኛ የስነ-ምግባር ደረጃዎችን ማክበር።',
      descOr:  "Sadarkaa xiyyeeffannoo ol'aanaa tajaajila ummataa keessatti eeguu." },
  ]

  const storyText = {
    p1: {
      en: "MESOB Center was established as part of Ethiopia's digital transformation agenda. The name 'Mesob' refers to the traditional Ethiopian basket — a symbol of unity, sharing, and service.",
      am: "MESOB ማዕከል የኢትዮጵያ ዲጂታል ትሩፋት አጀንዳ አካል ሆኖ ተቋቋመ። 'ሜሶብ' የሚለው ስም አሃድነትን፣ አጋርነትን እና አገልግሎትን ያሳያል።",
      or: "Giddaan MESOB akka kutaa sagantaa jijjiirama dijitaalaa Itoophiyaatti hundaa'e. Maqaan 'Mesob' qorichaa aadaa tokkummaa, qooduu fi tajaajila bakka bu'u.",
    },
    p2: {
      en: "The Sululta Branch brings over 50 federal government services under one roof — making government accessible, efficient, and transparent for every citizen.",
      am: "ሱሉልታ ቅርንጫፍ ከ50 በላይ የፌዴራሌ አገልግሎቶችን ለሁሉም ዜጋ ቀላሉ፣ ቀልጣፋ እና ግልጽ ማድረግ ጀምሯል።",
      or: "Dameen Sululta tajaajila federaalaa 50+ ol takka jalatti argamsiisa — mootummaa dhaqqabamaa, saffisaa fi ifaa lammiilee hunda taasisuu.",
    },
  }

  const get = (obj: { en: string; am: string; or: string }) =>
    language === 'am' ? obj.am : language === 'or' ? obj.or : obj.en

  const valuesSubtitle = language === 'am' ? 'እያንዳንዱ ሥራ የሚመራበት መርህ' : language === 'or' ? 'Gatiileen hojii keenya hundaa kan qajeelchu' : 'The principles that guide everything we do'

  const managerTitle = language === 'am' ? 'የቅርንጫፍ ሥራ አስኪያጅ፣ MESOB ሱሉልታ' : language === 'or' ? 'Hooggana Damee, MESOB Sululta' : 'Branch Manager, MESOB Sululta'

  return (
    <div className="container-gov space-y-28">

      {/* ── Story ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Text side */}
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-blue-light mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-brand-green-light" />
            {t.about.history}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text- mb-6 leading-tight">
            {t.about.ourStory}
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-900 leading-relaxed text-base border-l-4 border-amber-600 pl-4 italic">
            <p>{get(storyText.p1)}</p>
            <p>{get(storyText.p2)}</p>
          </div>
        </Reveal>

        {/* Decorative card side */}
        <Reveal delay={0.15}>
          <div className="relative">
            {/* Floating accent blobs */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-green/10 dark:bg-brand-green/20 rounded-full blur-2xl pointer-events-none" aria-hidden />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full blur-2xl pointer-events-none" aria-hidden />

            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-8 shadow-xl dark:shadow-black/30">
              {/* Stats row */}
              {[
                { valueEn: '50+', labelEn: 'Federal Services', labelAm: 'ፌዴራሌ አገልግሎቶች', labelOr: 'Tajaajila Federaalaa', color: 'text-brand-green' },
                { valueEn: '98%', labelEn: 'Satisfaction Rate', labelAm: 'የእርካታ ደረጃ', labelOr: 'Sadarkaa Quufinsa', color: 'text-brand-blue' },
                { valueEn: '28',  labelEn: 'Partner Offices',   labelAm: 'ሸሪክ ቢሮዎች', labelOr: 'Waajjirawwan Gamtaa', color: 'text-brand-gold' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-700/60 last:border-0"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <span className={cn('text-3xl font-extrabold tabular-nums', stat.color)}>{stat.valueEn}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug font-medium">
                    {language === 'am' ? stat.labelAm : language === 'or' ? stat.labelOr : stat.labelEn}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Mission & Vision ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            icon: Target, bg: 'from-brand-green to-brand-green/80',
            title: t.about.mission,
            text: language === 'am'
              ? 'ለኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ ሁሉም ዜጎች ፈጣን፣ ግልጽ እና ቀላሉ ለማግኘት የሚቻሉ አገልግሎቶችን ማቅረብ።'
              : language === 'or'
              ? "Lammiilee Rippaabliika Dimookiraatawaa Federaalaa Itiyoophiyaa hunda tajaajila saffisaa, ifaa fi dhaqqabamaa kennuu."
              : 'To provide fast, transparent, and accessible government services to all citizens of the Federal Democratic Republic of Ethiopia.',
          },
          {
            icon: Eye, bg: 'from-brand-blue to-brand-blue/80',
            title: t.about.vision,
            text: language === 'am'
              ? 'ዜጎችን የሚፈቱ፣ ቢሮክራሲን የሚቀንሱ እና የኢትዮጵያ አገልግሎት ደረጃዎችን ወደ ዓለም አቀፋዊ ምርጥ ደረጃ ከፍ የሚያደርጉ የአፍሪካ ሞዴል ማዕከል ማድረግ።'
              : language === 'or'
              ? "Giddu-gala tajaajila bakka tokkotti mudelli Afrikaa ta'uu — lammiilee gargaaruu, biirookratii hir'isuu."
              : "To become Africa's model one-stop government service center — empowering citizens and elevating Ethiopia's public service standards.",
          },
        ].map(({ icon: Icon, bg, title, text }, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <motion.div
              className={cn('relative overflow-hidden rounded-2xl p-8 h-full text-white bg-gradient-to-br', bg, 'shadow-lg hover:shadow-2xl transition-shadow duration-300')}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Glow accent */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" aria-hidden />
              <Icon className="h-10 w-10 text-white/70 mb-5" aria-hidden />
              <h3 className="text-2xl font-bold mb-3">{title}</h3>
              <p className="text-white/85 leading-relaxed">{text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      {/* ── Core Values ────────────────────────────────────────────────────── */}
      <div>
        <Reveal className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-green-light mb-3">
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" />
            {t.about.values}
            <span className="h-px w-8 bg-brand-green dark:bg-brand-green-light" />
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-brown">{t.about.values}</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto italic">{valuesSubtitle}</p>
        </Reveal>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {values.map((v) => {
            const Icon = v.icon
            const title = language === 'am' ? v.titleAm : language === 'or' ? v.titleOr : v.titleEn
            const desc  = language === 'am' ? v.descAm  : language === 'or' ? v.descOr  : v.descEn
            return (
              <motion.div
                key={v.titleEn}
                variants={cardVariant}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'group relative bg-white dark:bg-gray-800/90 backdrop-blur-sm',
                  'rounded-2xl p-6 border border-gray-100 dark:border-gray-700/60',
                  'shadow-sm hover:shadow-xl dark:hover:shadow-black/30',
                  'transition-shadow duration-300 overflow-hidden'
                )}
              >
                {/* Animated accent line at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', v.color, 'group-hover:scale-110 transition-transform duration-300 shadow-sm', v.glow, 'group-hover:shadow-lg')}>
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* ── Manager Message ─────────────────────────────────────────────────── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brand-green/25 bg-white dark:bg-gray-800/90 p-10 md:p-14 shadow-lg dark:shadow-black/20">
          {/* Decorative floating circle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" aria-hidden />

          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            {/* Avatar */}
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center text-white text-3xl font-extrabold shrink-0 shadow-lg"
              whileHover={{ rotate: 3, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              A
            </motion.div>

            <div className="flex-1">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-green dark:text-brand-green-light mb-4">
                <span className="h-px w-6 bg-brand-green dark:bg-brand-green-light" />
                {t.about.managerMessage}
              </span>

              {/* Large quote mark */}
              <div className="text-6xl text-brand-green/20 dark:text-brand-green/30 font-serif leading-none mb-2 select-none" aria-hidden>"</div>

              <blockquote className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg md:text-xl font-medium mb-5 -mt-4">
                {t.about.managerQuote}
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 max-w-[3rem] bg-brand-gold" aria-hidden />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Ato Dereje Daba</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{managerTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

    </div>
  )
}
