import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Loader2, X, ChevronRight, Megaphone } from 'lucide-react'
import { getImageUrl } from '@/lib/images'
import { useLanguage } from '@/contexts/LanguageContext'
import { Badge } from '@/components/ui/Badge'
import AnimatedSection from '@/components/common/AnimatedSection'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface NewsData {
  _id: string
  title: { en: string; am: string; or: string }
  content: { en: string; am: string; or: string }
  excerpt: { en: string; am: string; or: string }
  category: string
  isFeatured: boolean
  publishedAt: string
  coverImageUrl?: string
  media?: Array<{ type: string; url: string }>
}

interface NewsSectionProps {
  compact?: boolean
  showHeader?: boolean
}

const categories = ['All', 'News', 'Notice', 'Event', 'Holiday', 'Press', 'Update']

const categoryImages: Record<string, string> = {
  news: 'https://picsum.photos/seed/news1/800/600',
  notice: 'https://picsum.photos/seed/news2/800/600',
  event: 'https://picsum.photos/seed/news3/800/600',
  holiday: 'https://picsum.photos/seed/news4/800/600',
  press: 'https://picsum.photos/seed/news5/800/600',
  update: 'https://picsum.photos/seed/news6/800/600',
}

const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'press'> = {
  news: 'default', notice: 'notice', event: 'event', holiday: 'holiday', press: 'press',
}

// Handles image load errors by hiding the broken img and showing fallback
function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget
  img.style.display = 'none'
  const parent = img.parentElement
  if (!parent) return
  const fallback = parent.querySelector('.img-fallback')
  if (fallback) (fallback as HTMLElement).style.display = 'flex'
}

export default function NewsSection({ compact = false, showHeader = true }: NewsSectionProps) {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<NewsData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedNews, setSelectedNews] = useState<NewsData | null>(null)

  useEffect(() => {
    fetch(`${BASE}/news?published=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1
            if (!a.isFeatured && b.isFeatured) return 1
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          })
          setItems(sorted)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(item =>
    activeCategory === 'All' || item.category.toLowerCase() === activeCategory.toLowerCase()
  )

  const getTitle = (news: NewsData) => {
    if (language === 'am' && news.title?.am) return news.title.am
    if (language === 'or' && news.title?.or) return news.title.or
    return news.title?.en || ''
  }

  const getContent = (news: NewsData) => {
    if (language === 'am' && news.content?.am) return news.content.am
    if (language === 'or' && news.content?.or) return news.content.or
    return news.content?.en || ''
  }

  const getExcerpt = (news: NewsData) => {
    if (language === 'am' && news.excerpt?.am) return news.excerpt.am
    if (language === 'or' && news.excerpt?.or) return news.excerpt.or
    return news.excerpt?.en || ''
  }

  const categoryLabels: Record<string, string> = {
    All: t.gallery?.all || 'All',
    News: 'News',
    Notice: 'Notice',
    Event: 'Event',
    Holiday: 'Holiday',
    Press: 'Press',
    Update: 'Update',
  }

  const content = (
    <div className="container-gov">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">
            Latest Updates
          </span>
          <h2 className="section-title text-center">{t.news?.title || t.announcements.title}</h2>
          <p className="section-subtitle mx-auto text-center">{t.news?.subtitle || t.announcements.subtitle}</p>
        </AnimatedSection>
      )}

      {/* Filter tabs - same as gallery */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeCategory === cat
                ? 'bg-brand-green text-white shadow-gov'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green')}>
            {categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No news available at this time.</p>
        </div>
      )}

      {/* Grid layout - same as gallery */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((news, i) => {
            const title = getTitle(news)
            const excerpt = getExcerpt(news) || getContent(news).substring(0, 150) + '...'
            const imgUrl = news.coverImageUrl || categoryImages[news.category] || ''

            return (
              <motion.div key={news._id} layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => setSelectedNews(news)}
                className="group relative rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-card-hover transition-all duration-300"
                role="button" tabIndex={0} aria-label={`View ${title}`}
                onKeyDown={e => e.key === 'Enter' && setSelectedNews(news)}>
                {/* Cover image */}
                {imgUrl ? (
                  <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={getImageUrl(imgUrl)} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={handleImgError} />
                    <div className="img-fallback absolute inset-0 bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center" style={{ display: 'none' }}>
                      <Megaphone className="h-10 w-10 text-white/50" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                    <Megaphone className="h-10 w-10 text-white/50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={categoryVariant[news.category] || 'default'} size="sm">
                      {(t.announcements.categories as Record<string, string>)[news.category] || news.category}
                    </Badge>
                    {news.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">
                        {t.common?.featuredNews || 'Featured'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1.5 leading-snug group-hover:text-brand-green dark:group-hover:text-brand-green-light transition-colors line-clamp-2">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{excerpt}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(news.publishedAt)}
                    </div>
                    <span className="text-xs font-medium text-brand-green dark:text-brand-green-light flex items-center gap-1">
                      {t.announcements?.readMore || 'Read More'} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Modal for full content - same style as gallery lightbox */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedNews(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing: ${getTitle(selectedNews)}`}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10" onClick={() => setSelectedNews(null)} aria-label="Close">
              <X className="h-7 w-7" />
            </button>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Featured image */}
              {(selectedNews.coverImageUrl || categoryImages[selectedNews.category]) && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-800 relative">
                  <div className="relative w-full h-full">
                    <img
                      src={getImageUrl(selectedNews.coverImageUrl || categoryImages[selectedNews.category])}
                      alt={getTitle(selectedNews)}
                      className="w-full h-full object-contain"
                      onError={handleImgError}
                    />
                    <div className="img-fallback absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-blue" style={{ display: 'none' }}>
                      <Megaphone className="h-12 w-12 text-white/60" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={categoryVariant[selectedNews.category] || 'default'} size="sm">
                        {(t.announcements.categories as Record<string, string>)[selectedNews.category] || selectedNews.category}
                      </Badge>
                      {selectedNews.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green/80 text-white">
                          {t.common?.featuredNews || 'Featured'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-white font-bold text-xl md:text-2xl">{getTitle(selectedNews)}</h2>
                    <div className="flex items-center gap-1.5 mt-2 text-white/60 text-xs">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(selectedNews.publishedAt)}
                    </div>
                  </div>
                </div>
              )}

              {/* Full content */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {getContent(selectedNews)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}