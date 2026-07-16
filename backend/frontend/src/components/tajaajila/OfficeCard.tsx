import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getOfficeIcon } from './officeIconMap'
import { cn } from '@/lib/utils'

interface OfficeCardProps {
  id: string
  nameOr: string
  serviceCount: number
}

export default function OfficeCard({ id, nameOr, serviceCount }: OfficeCardProps) {
  const Icon = getOfficeIcon(nameOr)

  return (
    <Link
      to={`/tajaajila/office/${id}`}
      className={cn(
        'group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
        'p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 hover:border-brand-green/30',
        'transition-all duration-300 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50'
      )}
      aria-label={`${nameOr} tajaajiloota ilaali`}
    >
      {/* Icon */}
      <div className={cn(
        'h-12 w-12 rounded-xl flex items-center justify-center',
        'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400',
        'transition-transform duration-300 group-hover:scale-110'
      )}>
        <Icon className="h-6 w-6" aria-hidden />
      </div>

      {/* Name + count */}
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {nameOr}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tajaajila {serviceCount}
        </p>
      </div>

      {/* CTA row — same style as FoddaaCard */}
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green dark:text-green-400 group-hover:gap-3 transition-all duration-200">
        Tajaajiloota
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden />
      </span>
    </Link>
  )
}
