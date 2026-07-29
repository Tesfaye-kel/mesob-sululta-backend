import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { announcements } from '@/data/announcements'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 6
const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'press'> = {
  news: 'default', notice: 'notice', event: 'event', holiday: 'holiday', press: 'press',
}

export default function AnnouncementsPage() {
  const { t, language } = useLanguage()
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = `Announcements | MESOB Center – Sululta Branch`
  }, [])

  const filtered = announcements.filter(a => {
    const title = language === 'am' ? a.titleAm : language === 'or' ? a.titleOr : a.titleEn
    const matchCat = category === 'all' || a.category === category
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = paginated.length < filtered.length

  const featured = announcements.find(a => a.featured)
  const featuredTitle = featured ? (language === 'am' ? featured.titleAm : language === 'or' ? featured.titleOr : featured.titleEn) : ''
  const featuredSummary = featured ? (language === 'am' ? featured.summaryAm : language === 'or' ? featured.summaryOr : featured.summaryEn) : ''

  return (
    <>
      <PageHeader
        title={t.announcements.title}
        subtitle={t.announcements.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.announcements }]}
      />

      <div className="section-padding">
        <div className="container-gov">
          {/* Featured */}
          {featured && (
            <motion.div
              className="mb-10 bg-gradient-to-r from-brand-green to-brand-blue text-white rounded-2xl p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-brand-gold text-white mb-3">Featured Announcement</Badge>
                <h2 className="text-2xl font-bold mb-2">{featuredTitle}</h2>
                <p className="text-white/80 mb-4 max-w-2xl">{featuredSummary}</p>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <Calendar className="h-4 w-4" aria-hidden />
                  <span>{formatDate(featured.date)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search announcements..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.announcements.categories).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setCategory(key); setPage(1) }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    category === key
                      ? 'bg-brand-green text-white shadow-gov'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green dark:hover:text-brand-green-light'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No announcements found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginated.map((ann, i) => {
                const title = language === 'am' ? ann.titleAm : language === 'or' ? ann.titleOr : ann.titleEn
                const summary = language === 'am' ? ann.summaryAm : language === 'or' ? ann.summaryOr : ann.summaryEn
                return (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % ITEMS_PER_PAGE) * 0.05, duration: 0.4 }}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={categoryVariant[ann.category] || 'default'} size="sm">
                        {t.announcements.categories[ann.category]}
                      </Badge>
                      {ann.featured && <Badge variant="success" size="sm">Featured</Badge>}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-brand-green dark:group-hover:text-brand-green-light transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {formatDate(ann.date)}
                      </div>
                      <button className="flex items-center gap-1 text-sm font-medium text-brand-green dark:text-brand-green-light hover:gap-2 transition-all duration-200">
                        {t.announcements.readMore}
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-8 py-3 border-2 border-brand-green text-brand-green dark:text-brand-green-light rounded-lg font-semibold hover:bg-brand-green hover:text-white transition-all duration-200"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


