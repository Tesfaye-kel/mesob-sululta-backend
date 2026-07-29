import { Link } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  id: string
  nameOr: string
  officeName?: string
  fromPath: string
}

export default function ServiceCard({ id, nameOr, officeName, fromPath }: ServiceCardProps) {
  const to = `/tajaajila/service/${id}/barbaachisa`

  return (
    <Link
      to={to}
      state={{ from: fromPath }}
      className={cn(
        'group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
        'p-4 flex gap-3 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-green/30',
        'transition-all duration-300 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50'
      )}
      aria-label={`${nameOr} — Wantoota Barbaachisoo ilaali`}
    >
      {/* Icon */}
      <div className={cn(
        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        'bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-green-400',
        'transition-transform duration-200 group-hover:scale-110'
      )}>
        <FileText className="h-5 w-5" aria-hidden />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Office badge */}
        {officeName && (
          <span className="inline-block self-start text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 mb-1.5">
            {officeName}
          </span>
        )}

        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex-1">
          {nameOr}
        </p>

        {/* Bottom CTA row */}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green dark:text-green-400 mt-2 group-hover:gap-2 transition-all duration-200">
          Wantoota Barbaachisoo
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
