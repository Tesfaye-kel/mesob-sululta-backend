import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, ChevronRight, Loader2, ImageIcon, Play } from 'lucide-react'
import { getImageUrl } from '@/lib/images'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const ITEMS_PER_PAGE = 9
const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'press'> = {
  news: 'default', notice: 'notice', event: 'event', holiday: 'holiday', press: 'press',
}

interface NewsItem {
  _id: string
  title: { en: string; am: string; or: string }
  content: { en: string; am: string; or: string }
  excerpt: { en: string; am: string; or: string }
  category: string
  isFeatured: boolean
  publishedAt: string
  coverImageUrl?: string
  media?: Array<{ type: string; url: string }>
  tags?: string[]
}

export default function NewsPage() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = `${t.news?.title || t.announcements.title} | MESOB Center`
    fetch(`${BASE}/news?published=true`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setItems(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [t])

  const filtered = items.filter(a => {
    const title = language === 'am' ? a.title.am : language === 'or' ? a.title.or : a.title.en
    const matchCat = category === 'all' || a.category === category
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = paginated.length < filtered.length

  const featured = items.find(a => a.isFeatured)
  const featuredTitle = featured ? (language === 'am' ? featured.title.am : language === 'or' ? featured.title.or : featured.title.en) : ''
  const featuredSummary = featured ? (language === 'am' ? (featured.excerpt?.am || featured.content.am) : language === 'or' ? (featured.excerpt?.or || featured.content.or) : (featured.excerpt?.en || featured.content.en)) : ''

  const noResultsMsg = language === 'am' ? 'ምንም ዜና አልተገኘም' : language === 'or' ? 'Oduun hin argamne' : 'No news found'
  const tryAdjust = language === 'am' ? 'ፍለጋዎን ያስተካክሉ።' : language === 'or' ? 'Barbaaduu kee sirreessi.' : 'Try adjusting your search or filter.'

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.news?.title || t.announcements.title}</AnimatedHeading>

        {/* Featured banner */}
        {featured && (
          <motion.div
            className="mb-10 bg-gradient-to-r from-brand-green to-brand-blue text-white rounded-2xl overflow-hidden relative shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {featured.coverImageUrl ? (
              <div className="relative">
                <img src={getImageUrl(featured.coverImageUrl)} alt={featuredTitle} className="w-full h-48 md:h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <Badge className="bg-brand-gold text-white mb-3">{t.common.featuredNews || 'Featured News'}</Badge>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">{featuredTitle}</h2>
                  <p className="text-white/85 mb-4 max-w-2xl leading-relaxed text-sm md:text-base line-clamp-2">{featuredSummary}</p>
                  <div className="flex items-center gap-3 text-white/70 text-sm">
                    <Calendar className="h-4 w-4" aria-hidden />
                    <span>{formatDate(featured.publishedAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                </div>
                <div className="relative z-10">
                  <Badge className="bg-brand-gold text-white mb-3">{t.common.featuredNews || 'Featured News'}</Badge>
                  <h2 className="text-2xl font-bold mb-2">{featuredTitle}</h2>
                  <p className="text-white/85 mb-4 max-w-2xl leading-relaxed">{featuredSummary}</p>
                  <div className="flex items-center gap-3 text-white/70 text-sm">
                    <Calendar className="h-4 w-4" aria-hidden />
                    <span>{formatDate(featured.publishedAt)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}

        {!loading && (
          <>
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 max-w-xs">
                <Input
                  placeholder={`${t.common.search} ${(t.news?.title || t.announcements.title).toLowerCase()}...`}
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
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green dark:hover:text-brand-green-light'
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
                <div className="text-6xl mb-4">📰</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{noResultsMsg}</h3>
                <p className="text-gray-600 dark:text-gray-400">{tryAdjust}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map((ann, i) => {
                  const title = language === 'am' ? ann.title.am : language === 'or' ? ann.title.or : ann.title.en
                  const summary = language === 'am' ? (ann.excerpt?.am || ann.content.am) : language === 'or' ? (ann.excerpt?.or || ann.content.or) : (ann.excerpt?.en || ann.content.en)
                  const hasVideo = ann.media?.some(m => m.type === 'video')
                  return (
                    <Link key={ann._id} to={`/news/${ann._id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % ITEMS_PER_PAGE) * 0.05, duration: 0.4 }}
                        className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                      >
                        {/* Cover image */}
                        <div className="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          {ann.coverImageUrl ? (
                            <img src={getImageUrl(ann.coverImageUrl)} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green/20 to-brand-blue/20">
                              <ImageIcon className="h-10 w-10 text-gray-400" />
                            </div>
                          )}
                          {hasVideo && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full">
                              <Play className="h-4 w-4" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge variant={categoryVariant[ann.category] || 'default'} size="sm">
                              {(t.announcements.categories as Record<string, string>)[ann.category] || ann.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-brand-green dark:group-hover:text-brand-green-light transition-colors line-clamp-2">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">{summary}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3.5 w-3.5" aria-hidden />
                              {formatDate(ann.publishedAt)}
                            </div>
                            <span className="flex items-center gap-1 text-sm font-medium text-brand-green dark:text-brand-green-light group-hover:gap-2 transition-all duration-200">
                              {t.announcements.readMore}
                              <ChevronRight className="h-4 w-4" aria-hidden />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 py-3 border-2 border-brand-green text-brand-green dark:text-brand-green-light rounded-xl font-semibold hover:bg-brand-green hover:text-white transition-all duration-200"
                >
                  {t.common.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}