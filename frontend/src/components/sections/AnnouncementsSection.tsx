import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { announcements } from '@/data/announcements'
import { useLanguage } from '@/contexts/LanguageContext'
import { Badge } from '@/components/ui/Badge'
import AnimatedSection from '@/components/common/AnimatedSection'
import { formatDate } from '@/lib/utils'

interface AnnouncementsSectionProps {
  compact?: boolean
  showHeader?: boolean
}

export default function AnnouncementsSection({ compact = false, showHeader = true }: AnnouncementsSectionProps) {
  const { t, language } = useLanguage()
  const latest = announcements.slice(0, 6)

  const content = (
    <div className="container-gov">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">
            Latest Updates
          </span>
          <h2 className="section-title">{t.announcements.title}</h2>
          <p className="section-subtitle mx-auto">{t.announcements.subtitle}</p>
        </AnimatedSection>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {latest.map((ann, i) => {
          const title = language === 'am' ? ann.titleAm : language === 'or' ? ann.titleOr : ann.titleEn
          const summary = language === 'am' ? ann.summaryAm : language === 'or' ? ann.summaryOr : ann.summaryEn
          return (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={ann.category === 'news' ? 'default' : ann.category === 'notice' ? 'notice' : 'event'} size="sm">
                  {t.announcements.categories[ann.category]}
                </Badge>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 leading-snug">{title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{summary}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {formatDate(ann.date)}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}
