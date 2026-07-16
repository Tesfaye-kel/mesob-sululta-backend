import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  1:  ['bg-blue-100 dark:bg-blue-900/30',      'text-blue-700 dark:text-blue-300'],
  2:  ['bg-green-100 dark:bg-green-900/30',    'text-green-700 dark:text-green-300'],
  3:  ['bg-amber-100 dark:bg-amber-900/30',    'text-amber-700 dark:text-amber-300'],
  4:  ['bg-purple-100 dark:bg-purple-900/30',  'text-purple-700 dark:text-purple-300'],
  5:  ['bg-blue-100 dark:bg-blue-900/30',      'text-blue-700 dark:text-blue-300'],
  6:  ['bg-green-100 dark:bg-green-900/30',    'text-green-700 dark:text-green-300'],
  7:  ['bg-amber-100 dark:bg-amber-900/30',    'text-amber-700 dark:text-amber-300'],
  8:  ['bg-purple-100 dark:bg-purple-900/30',  'text-purple-700 dark:text-purple-300'],
  9:  ['bg-blue-100 dark:bg-blue-900/30',      'text-blue-700 dark:text-blue-300'],
  10: ['bg-green-100 dark:bg-green-900/30',    'text-green-700 dark:text-green-300'],
  11: ['bg-amber-100 dark:bg-amber-900/30',    'text-amber-700 dark:text-amber-300'],
}

interface FoddaaCardProps {
  id: string
  number: number
  serviceCount: number
  index?: number
}

export default function FoddaaCard({ id, number, serviceCount, index = 0 }: FoddaaCardProps) {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)

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

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAnimating(true)
    setTimeout(() => {
      navigate(`/tajaajila/foddaa/${number}`)
    }, 500)
  }

  return (
    <motion.div
      onClick={handleCardClick}
      animate={isAnimating ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'group block rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2',
        'flex flex-col items-center justify-center gap-4 p-8',
        'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green/50',
        'h-56',
        'cursor-pointer',
        iconBg
      )}
      aria-label={`${title} — ${ctaLabel}`}
    >
      <div className={cn('h-20 w-20 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 font-bold text-2xl transition-transform duration-300 group-hover:scale-110 shadow-md', iconText)}>
        {number}
      </div>

      <div className="text-center flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{title}</h3>
      </div>
    </motion.div>
  )
}

