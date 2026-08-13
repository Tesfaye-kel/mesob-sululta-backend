import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
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
  name: MultiLang
  serviceCount: number
  index?: number
  onClick?: () => void
}

export default function OfficeCard({ id, name, serviceCount, index = 0, onClick }: OfficeCardProps) {
  const { language } = useLanguage()

  const displayName =
    language === 'am' ? (name.am || name.or || name.en) :
    language === 'or' ? (name.or || name.en) : name.en

  const countLabel =
    language === 'am' ? `አገልግሎት ${serviceCount}` :
    language === 'or' ? `Tajaajila ${serviceCount}` :
    `${serviceCount} service${serviceCount !== 1 ? 's' : ''}`

  const { bg, text } = OFFICE_COLORS[index % 4]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'w-full rounded-xl shadow-md hover:shadow-lg',
        'flex flex-col items-center justify-center gap-3 p-6',
        'transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50',
        'h-48 cursor-pointer',
        bg
      )}
      aria-label={`${displayName}`}
    >
      {/* Icon — same style as home page */}
      <div className={cn('h-20 w-20 rounded-full flex items-center justify-center bg-white/70 dark:bg-black/20 shadow-md', text)}>
        <Building2 className="h-10 w-10 opacity-80" aria-hidden />
      </div>

      {/* Service count */}
      {serviceCount > 0 && (
        <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-black/20', text)}>
          {countLabel}
        </span>
      )}

      {/* Name */}
      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 text-center">
        {displayName}
      </h3>
    </motion.button>
  )
}