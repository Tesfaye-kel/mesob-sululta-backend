import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Badge } from '@/components/ui/Badge'
import AnimatedSection from '@/components/common/AnimatedSection'
import { formatDate } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface AnnouncementData {
  _id: string
  title: { en: string; am: string; or: string }
  content: { en: string; am: string; or: string }
  category: string
  isFeatured: boolean
  publishedAt: string
}

interface AnnouncementsSectionProps {
  compact?: boolean
  showHeader?: boolean
}

export default function AnnouncementsSection({ compact = false, showHeader = true }: AnnouncementsSectionProps) {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<AnnouncementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/announcements?featured=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data.slice(0, 6))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No announcements available at this time.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((ann, i) => {
          const title = language === 'am' ? ann.title.am : language === 'or' ? ann.title.or : ann.title.en
          const summary = language === 'am' ? ann.content.am : language === 'or' ? ann.content.or : ann.content.en
          return (
            <motion.div key={ann._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={ann.category === 'news' ? 'default' : ann.category === 'notice' ? 'notice' : 'event'} size="sm">
                  {(t.announcements.categories as Record<string, string>)[ann.category] || ann.category}
                </Badge>
                {ann.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">Featured</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 leading-snug">{title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">{summary}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {formatDate(ann.publishedAt)}
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