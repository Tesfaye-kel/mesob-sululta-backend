import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getOfficeIcon } from './officeIconMap'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface MultiLang { en: string; am: string; or: string }

interface OfficeCardProps {
  id: string
  /** Accept full multilingual name object */
  name: MultiLang
  serviceCount: number
}

export default function OfficeCard({ id, name, serviceCount }: OfficeCardProps) {
  const { language } = useLanguage()

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

  return (
    <Link
      to={`/tajaajila/office/${id}`}
      className={cn(
        'group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
        'p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 hover:border-brand-green/30',
        'transition-all duration-300 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50'
      )}
      aria-label={`${displayName} — ${ctaLabel}`}
    >
      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400 transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-6 w-6" aria-hidden />
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {displayName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{countLabel}</p>
      </div>

      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green dark:text-green-400 group-hover:gap-3 transition-all duration-200">
        {ctaLabel}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden />
      </span>
    </Link>
  )
}
