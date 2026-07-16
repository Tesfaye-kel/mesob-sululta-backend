import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const SERVICE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  1: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  2: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  3: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
}

interface ServiceCardProps {
  id: string
  nameEn: string
  nameAm?: string
  nameOr?: string
  officeName?: string
  fromPath: string
  index?: number
  style?: 'compact' | 'expanded'
}

export default function ServiceCard({ id, nameEn, nameAm, nameOr, officeName, fromPath, index = 0, style = 'expanded' }: ServiceCardProps) {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)
  const to = `/tajaajila/service/${id}/barbaachisa`

  const displayName = language === 'am' && nameAm ? nameAm : language === 'or' && nameOr ? nameOr : nameEn

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAnimating(true)
    setTimeout(() => {
      navigate(to, { state: { from: fromPath } })
    }, 500)
  }

  const ctaLabel =
    language === 'am' ? 'ያስፈልጋሉ ሰነዶች' :
    language === 'or' ? 'Wantoota Barbaachisoo' :
                        'Requirements'

  if (style === 'compact') {
    return (
      <motion.div
        onClick={handleCardClick}
        animate={isAnimating ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
          'p-4 flex gap-3 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-green/30',
          'transition-all duration-300 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50',
          'cursor-pointer'
        )}
        aria-label={`${displayName} — ${ctaLabel}`}
      >
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-green-400 transition-transform duration-200 group-hover:scale-110">
          <FileText className="h-5 w-5" aria-hidden />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {officeName && (
            <span className="inline-block self-start text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 mb-1.5">
              {officeName}
            </span>
          )}
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex-1">{displayName}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green dark:text-green-400 mt-2 group-hover:gap-2 transition-all duration-200">
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
          </span>
        </div>
      </motion.div>
    )
  }

  const colorIndex = (index ?? 0) % 4
  const { bg, text } = SERVICE_COLORS[colorIndex]

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
      <div className={cn('h-16 w-16 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 shadow-md', text)}>
        <FileText className="h-8 w-8" aria-hidden />
      </div>

      <div className="text-center flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-3">{displayName}</h3>
        {officeName && <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{officeName}</p>}
      </div>

      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green dark:text-green-400 group-hover:gap-2 transition-all duration-200">
        {ctaLabel}
        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
      </span>
    </motion.div>
  )
}
