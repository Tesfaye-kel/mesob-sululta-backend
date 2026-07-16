import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getOfficeIcon } from './officeIconMap'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface MultiLang { en: string; am: string; or: string }

const OFFICE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  1: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  2: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  3: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
}

interface OfficeCardProps {
  id: string
  /** Accept full multilingual name object */
  name: MultiLang
  serviceCount: number
  index?: number
}

export default function OfficeCard({ id, name, serviceCount, index = 0 }: OfficeCardProps) {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)

  const displayName =
    language === 'am' ? (name.am || name.or || name.en) :
    language === 'or' ? (name.or || name.en) :
                         name.en

  const countLabel =
    language === 'am' ? `አገልግሎት ${serviceCount}` :
    language === 'or' ? `Tajaajila ${serviceCount}` :
                        `${serviceCount} service${serviceCount !== 1 ? 's' : ''}`

  const ctaLabel =
    language === 'am' ? 'አገልግሎቶች' :
    language === 'or' ? 'Tajaajiloota' :
                        'View Services'

  const Icon = getOfficeIcon(name.or || name.en)
  const colorIndex = index % 4
  const { bg, text } = OFFICE_COLORS[colorIndex]

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAnimating(true)
    setTimeout(() => {
      navigate(`/tajaajila/office/${id}`)
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
        bg
      )}
      aria-label={`${displayName} — ${ctaLabel}`}
    >
      <div className={cn('h-20 w-20 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 shadow-md', text)}>
        <Icon className="h-10 w-10" aria-hidden />
      </div>

      <div className="text-center flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-3">
          {displayName}
        </h3>
      </div>
    </motion.div>
  )
}

