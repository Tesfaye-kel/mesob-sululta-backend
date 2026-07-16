import { motion } from 'framer-motion'
import { ArrowRight, Clock, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Service } from '@/data/services'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  compact?: boolean
  index?: number
}

const colorMap: Record<string, string> = {
  'brand-green': 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light',
  'brand-blue': 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300',
  'brand-gold': 'bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20',
}

const borderMap: Record<string, string> = {
  'brand-green': 'hover:border-brand-green/30',
  'brand-blue': 'hover:border-brand-blue/30',
  'brand-gold': 'hover:border-brand-gold/30',
}

export default function ServiceCard({ service, compact = false, index = 0 }: ServiceCardProps) {
  const { language, t } = useLanguage()

  const title = language === 'am' ? service.titleAm : language === 'or' ? service.titleOr : service.titleEn
  const description = language === 'am' ? service.descriptionAm : language === 'or' ? service.descriptionOr : service.descriptionEn
  const categoryLabel = {
    Identity: t.services.categories.identity,
    Business: t.services.categories.business,
    Tax: t.services.categories.tax,
    Transport: t.services.categories.transport,
    Land: t.services.categories.land,
    Civil: t.services.categories.civil,
    Digital: t.services.categories.digital,
    Legal: t.services.categories.legal,
    Municipal: t.services.categories.municipal,
    Support: t.services.categories.support,
  }[service.category] ?? service.category
  const docsRequiredLabel = t.services.docsRequired.replace('{count}', service.requiredDocs.length.toString())

  // Dynamically get the Lucide icon
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[service.icon] || Icons.FileText

  return (
    <motion.div
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-default',
        'hover:shadow-card-hover hover:-translate-y-1',
        borderMap[service.color],
        compact ? 'p-4' : 'p-6'
      )}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`flex gap-4 ${compact ? 'items-center' : 'items-start'}`}>
        {/* Icon */}
        <div className={cn(
          'rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
          colorMap[service.color],
          compact ? 'h-10 w-10' : 'h-14 w-14'
        )}>
          <IconComponent className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
        </div>

        <div className="flex-1 min-w-0">
          {/* Category */}
          {!compact && (
            <Badge variant="muted" size="sm" className="mb-2">
              {categoryLabel}
            </Badge>
          )}

          <h3 className={cn(
            'font-bold text-gray-900 dark:text-white leading-tight',
            compact ? 'text-sm' : 'text-base mb-2'
          )}>
            {title}
          </h3>

          {!compact && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              {description}
            </p>
          )}

          {/* Meta */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5 text-brand-gold" aria-hidden />
                <span>{service.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <FileText className="h-3.5 w-3.5 text-brand-green" aria-hidden />
                <span>{docsRequiredLabel}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            to="/services"
            className={cn(
              'inline-flex items-center gap-1.5 font-semibold text-brand-green dark:text-brand-green-light hover:gap-2.5 transition-all duration-200',
              compact ? 'text-xs' : 'text-sm'
            )}
            aria-label={t.services.learnMoreAbout.replace('{service}', title)}
          >
            {t.services.learnMore}
            <ArrowRight className={cn('transition-transform duration-200 group-hover:translate-x-1', compact ? 'h-3 w-3' : 'h-4 w-4')} aria-hidden />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
