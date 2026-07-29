import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { announcements } from '@/data/announcements'
import { formatDate } from '@/lib/utils'

const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'press' | 'success'> = {
  news: 'default',
  notice: 'notice',
  event: 'event',
  holiday: 'holiday',
  press: 'press',
}

export default function LatestAnnouncements() {
  const { t, language } = useLanguage()
  const latest = announcements.slice(0, 4)

  return (
    <section className="section-padding" aria-label="Latest announcements">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">
              Latest Updates
            </span>
            <h2 className="section-title">{t.announcements.title}</h2>
            <p className="section-subtitle">{t.announcements.subtitle}</p>
          </div>
          <Link to="/announcements">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.announcements.viewAll}
            </Button>
          </Link>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {latest.map((ann) => {
            const title = language === 'am' ? ann.titleAm : language === 'or' ? ann.titleOr : ann.titleEn
            const summary = language === 'am' ? ann.summaryAm : language === 'or' ? ann.summaryOr : ann.summaryEn

            return (
              <StaggerItem key={ann.id}>
                <motion.div
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={categoryVariant[ann.category] || 'default'} size="sm">
                      {t.announcements.categories[ann.category]}
                    </Badge>
                    {ann.featured && (
                      <Badge variant="success" size="sm">Featured</Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base leading-snug group-hover:text-brand-green dark:group-hover:text-brand-green-light transition-colors">
                    {title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {summary}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(ann.date)}
                    </div>
                    <Link
                      to="/announcements"
                      className="flex items-center gap-1 text-sm font-medium text-brand-green dark:text-brand-green-light hover:gap-2 transition-all duration-200"
                      aria-label={`Read more about ${title}`}
                    >
                      {t.announcements.readMore}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
