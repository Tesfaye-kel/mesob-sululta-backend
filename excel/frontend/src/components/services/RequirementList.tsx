import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useServiceRequirements } from '@/hooks/useRequirements'
import type { Language } from '@/i18n/translations'
import { cn } from '@/lib/utils'

interface RequirementListProps {
  serviceId: string
  className?: string
}

function getText(
  obj: { en: string; am: string; or: string },
  lang: Language
): string {
  return obj[lang] || obj.en
}

export default function RequirementList({ serviceId, className }: RequirementListProps) {
  const { language, t } = useLanguage()
  const { requirements, loading, error } = useServiceRequirements(serviceId)

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" aria-label={t.common.loading} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-red-600 dark:text-red-400 py-4', className)}>
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  if (requirements.length === 0) {
    return (
      <p className={cn('text-sm text-gray-500 dark:text-gray-400 italic py-4', className)}>
        {t.common.noData}
      </p>
    )
  }

  const mandatory = requirements.filter(r => r.isMandatory)
  const optional = requirements.filter(r => !r.isMandatory)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mandatory requirements */}
      {mandatory.length > 0 && (
        <section aria-label="Mandatory requirements">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {language === 'am' ? 'አስፈላጊ ሰነዶች' : language === 'or' ? 'Barbaachisoo' : 'Required'}
          </h4>
          <AnimatePresence>
            <ul className="space-y-2">
              {mandatory.map((req, i) => (
                <motion.li
                  key={req._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                      {getText(req.requirementText, language)}
                    </p>
                    {getText(req.notes, language) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {getText(req.notes, language)}
                      </p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </section>
      )}

      {/* Optional requirements */}
      {optional.length > 0 && (
        <section aria-label="Optional requirements">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {language === 'am' ? 'አማራጭ' : language === 'or' ? 'Dirqama Miti' : 'Optional'}
          </h4>
          <ul className="space-y-2">
            {optional.map((req, i) => (
              <motion.li
                key={req._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
              >
                <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    {getText(req.requirementText, language)}
                  </p>
                  {getText(req.notes, language) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      {getText(req.notes, language)}
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
