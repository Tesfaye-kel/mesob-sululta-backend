import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const ORDINALS_OR: Record<number, string> = {
  1: 'Foddaa Tokkoffaa',    2: 'Foddaa Lammaffaa',
  3: 'Foddaa Sadaffaa',     4: 'Foddaa Afraffaa',
  5: 'Foddaa Shanaffaa',    6: 'Foddaa Jahaffaa',
  7: 'Foddaa Torbaffaa',    8: 'Foddaa Saddeetaffaa',
  9: 'Foddaa Sagalaffaa',  10: 'Foddaa Kurnaffaa',
  11: 'Foddaa Kudha Tokkoffaa',
}

const ORDINALS_AM: Record<number, string> = {
  1: 'ፎዳ አንደኛ',   2: 'ፎዳ ሁለተኛ',   3: 'ፎዳ ሦስተኛ',
  4: 'ፎዳ አራተኛ',  5: 'ፎዳ አምስተኛ',  6: 'ፎዳ ስድስተኛ',
  7: 'ፎዳ ሰባተኛ',  8: 'ፎዳ ስምንተኛ',  9: 'ፎዳ ዘጠነኛ',
  10: 'ፎዳ አስረኛ', 11: 'ፎዳ አስራ አንደኛ',
}

const ORDINALS_EN: Record<number, string> = {
  1: 'Window 1',  2: 'Window 2',  3: 'Window 3',  4: 'Window 4',
  5: 'Window 5',  6: 'Window 6',  7: 'Window 7',  8: 'Window 8',
  9: 'Window 9', 10: 'Window 10', 11: 'Window 11',
}

const COLORS: Record<number, [string, string]> = {
  1:  ['bg-brand-green/10 dark:bg-brand-green/20',  'text-brand-green dark:text-green-400'],
  2:  ['bg-brand-blue/10 dark:bg-brand-blue/20',    'text-brand-blue dark:text-blue-400'],
  3:  ['bg-brand-gold/10 dark:bg-brand-gold/20',    'text-brand-gold dark:text-yellow-400'],
  4:  ['bg-purple-100 dark:bg-purple-900/20',        'text-purple-600 dark:text-purple-400'],
  5:  ['bg-rose-100 dark:bg-rose-900/20',            'text-rose-600 dark:text-rose-400'],
  6:  ['bg-teal-100 dark:bg-teal-900/20',            'text-teal-600 dark:text-teal-400'],
  7:  ['bg-orange-100 dark:bg-orange-900/20',        'text-orange-600 dark:text-orange-400'],
  8:  ['bg-cyan-100 dark:bg-cyan-900/20',            'text-cyan-600 dark:text-cyan-400'],
  9:  ['bg-indigo-100 dark:bg-indigo-900/20',        'text-indigo-600 dark:text-indigo-400'],
  10: ['bg-pink-100 dark:bg-pink-900/20',            'text-pink-600 dark:text-pink-400'],
  11: ['bg-lime-100 dark:bg-lime-900/20',            'text-lime-600 dark:text-lime-400'],
}

interface FoddaaCardProps {
  id: string
  number: number
  serviceCount: number
}

export default function FoddaaCard({ id, number, serviceCount }: FoddaaCardProps) {
  const { language } = useLanguage()

  const title =
    language === 'am' ? (ORDINALS_AM[number] ?? `ፎዳ ${number}`) :
    language === 'or' ? (ORDINALS_OR[number] ?? `Foddaa ${number}`) :
                        (ORDINALS_EN[number] ?? `Window ${number}`)

  const countLabel =
    language === 'am' ? `አገልግሎት ${serviceCount}` :
    language === 'or' ? `Tajaajila ${serviceCount}` :
                        `${serviceCount} service${serviceCount !== 1 ? 's' : ''}`

  const ctaLabel =
    language === 'am' ? 'አገልግሎቶች' :
    language === 'or' ? 'Tajaajiloota' :
                        'View Services'

  const [iconBg, iconText] = COLORS[number] ?? COLORS[1]

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xl transition-transform duration-300 group-hover:scale-110', iconBg, iconText)}>
        {number}
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{countLabel}</p>
      </div>

      <Link
        to={`/tajaajila/foddaa/${number}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green dark:text-green-400 hover:gap-3 transition-all duration-200"
        aria-label={`${title} — ${ctaLabel}`}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden />
      </Link>
    </div>
  )
}
