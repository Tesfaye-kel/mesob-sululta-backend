import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Loader2, X, ChevronRight, Megaphone, Music, FileText, ExternalLink, Youtube, Link2, Download } from 'lucide-react'
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
  media?: Array<{ type: string; url: string; caption?: { en: string; am: string; or: string } }>
}

interface NewsSectionProps {
  compact?: boolean
  showHeader?: boolean
}

const categories = ['All', 'News', 'Notice', 'Event', 'Holiday', 'Document', 'Update']

// Trilingual category labels
const CATEGORY_LABELS: Record<string, { en: string; am: string; or: string }> = {
  All:     { en: 'All',     am: 'ሁሉም',    or: 'Hunda'    },
  News:    { en: 'News',    am: 'ዜና',      or: 'Oduu'     },
  Notice:  { en: 'Notice',  am: 'ማስታወቂያ',  or: 'Beeksisa' },
  Event:   { en: 'Event',   am: 'ዝግጅት',    or: 'Goosaa'   },
  Holiday: { en: 'Holiday', am: 'ዕረፍት',    or: 'Boqonnaa' },
  Document: { en: 'Document', am: 'ሰነድ',    or: 'Dokumentii' },
  Update:  { en: 'Update',  am: 'ዝማኔ',     or: 'Haaromsa' },
}

const categoryImages: Record<string, string> = {
  news: 'https://picsum.photos/seed/news1/800/600',
  notice: 'https://picsum.photos/seed/news2/800/600',
  event: 'https://picsum.photos/seed/news3/800/600',
  holiday: 'https://picsum.photos/seed/news4/800/600',
  document: 'https://picsum.photos/seed/news5/800/600',
  update: 'https://picsum.photos/seed/news6/800/600',
}

const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'document'> = {
  news: 'default', notice: 'notice', event: 'event', holiday: 'holiday', document: 'document',
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
        const newsList = Array.isArray(data) ? data : (data?.news || [])
        if (newsList.length > 0) {
          const sorted = [...newsList].sort((a, b) => {
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

  // Use CATEGORY_LABELS with current language
  const getCatLabel = (cat: string) => {
    const entry = CATEGORY_LABELS[cat]
    if (!entry) return cat
    return language === 'am' ? entry.am : language === 'or' ? entry.or : entry.en
  }

  const content = (
    <div className="container-gov">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">
            Latest Updates
          </span>
<h2 className="section-title text-center">{t.news.title}</h2>
          <p className="section-subtitle mx-auto text-center">{t.news.subtitle}</p>
        </AnimatedSection>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeCategory === cat
                ? 'bg-brand-green text-white shadow-gov'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green')}>
            {getCatLabel(cat)}
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
                      {(t.news.categories as Record<string, string>)[news.category] || news.category}
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
{t.news.readMore} <ChevronRight className="h-3.5 w-3.5" />
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
                        {(t.news.categories as Record<string, string>)[selectedNews.category] || selectedNews.category}
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

              {/* Media gallery */}
              {selectedNews.media && selectedNews.media.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {language === 'or' ? 'Miidiyaa' : language === 'am' ? 'ሚዲያ' : 'Media'}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">({selectedNews.media.length})</span>
                    </h3>
                    <button
                      onClick={async () => {
                        const items = selectedNews.media!.filter(m =>
                          ['image','video','audio','document'].includes(m.type)
                        )
                        const cover = selectedNews.coverImageUrl
                          ? [{ url: getImageUrl(selectedNews.coverImageUrl), name: `cover` }]
                          : []
                        const all = [
                          ...cover,
                          ...items.map(m => ({ url: getImageUrl(m.url), name: m.url.split('/').pop() || 'media' })),
                        ]
                        for (const { url, name } of all) {
                          try {
                            const res = await fetch(url)
                            const blob = await res.blob()
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(blob)
                            a.download = name
                            a.click()
                            URL.revokeObjectURL(a.href)
                            await new Promise(r => setTimeout(r, 300))
                          } catch { window.open(url, '_blank') }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green/90 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {language === 'am' ? 'ሁሉንም አውርድ' : language === 'or' ? 'Hunda Buusi' : 'Download All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedNews.media.map((m, i) => {
                      const mediaUrl = getImageUrl(m.url)
                      const caption = m.caption
                        ? (language === 'am' && m.caption.am ? m.caption.am : language === 'or' && m.caption.or ? m.caption.or : m.caption.en)
                        : ''
                      const isYoutube = m.type === 'youtube'
                      return (
                        <div key={i} className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${isYoutube ? 'col-span-2' : ''}`}>
                          {m.type === 'image' && (
                            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={mediaUrl} alt={caption || 'Media'} className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300" />
                              {caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs">{caption}</p>
                              </div>}
                            </a>
                          )}
                          {m.type === 'video' && (
                            <video src={mediaUrl} controls className="w-full h-36 object-cover" />
                          )}
                          {m.type === 'audio' && (
                            <div className="p-4 flex flex-col items-center justify-center h-36 bg-gray-50 dark:bg-gray-800">
                              <Music className="h-7 w-7 text-brand-green mb-2" />
                              <audio src={mediaUrl} controls className="w-full" />
                              {caption && <p className="text-xs text-gray-500 mt-1">{caption}</p>}
                            </div>
                          )}
                          {m.type === 'document' && (
                            <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
                              className="p-4 flex flex-col items-center justify-center h-36 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <FileText className="h-7 w-7 text-amber-500 mb-2" />
                              <span className="text-xs text-gray-500 truncate max-w-full">{m.url.split('/').pop()}</span>
                              <ExternalLink className="h-3 w-3 text-gray-400 mt-1" />
                              {caption && <p className="text-xs text-gray-500 mt-1">{caption}</p>}
                            </a>
                          )}
                          {m.type === 'youtube' && (() => {
                            const ytMatch = m.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
                            const videoId = ytMatch?.[1]
                            return videoId ? (
                              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={caption || 'YouTube video'}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="absolute inset-0 w-full h-full"
                                />
                              </div>
                            ) : (
                              <a href={m.url} target="_blank" rel="noopener noreferrer"
                                className="p-4 flex flex-col items-center justify-center h-36 bg-red-50 dark:bg-red-900/20">
                                <Youtube className="h-7 w-7 text-red-500 mb-2" />
                                <span className="text-xs text-gray-500 truncate max-w-full text-center">{m.url}</span>
                              </a>
                            )
                          })()}
                          {(m.type === 'other' || !['image','video','audio','document','youtube'].includes(m.type)) && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer"
                              className="p-4 flex flex-col items-center justify-center h-36 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors">
                              <Link2 className="h-7 w-7 text-brand-blue mb-2" />
                              <span className="text-xs text-gray-500 truncate max-w-full text-center break-all">{m.url}</span>
                              <ExternalLink className="h-3 w-3 text-gray-400 mt-1" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}