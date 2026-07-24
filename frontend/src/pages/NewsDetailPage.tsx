import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, ArrowLeft, Loader2, Music, FileText, ExternalLink, Tag } from 'lucide-react'
import { getImageUrl } from '@/lib/images'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface NewsDetail {
  _id: string
  title: { en: string; am: string; or: string }
  content: { en: string; am: string; or: string }
  excerpt: { en: string; am: string; or: string }
  category: string
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  coverImageUrl: string
  media: Array<{ type: string; url: string; caption: { en: string; am: string; or: string } }>
  tags: string[]
  createdAt: string
  updatedAt: string
}

const categoryVariant: Record<string, 'default' | 'notice' | 'event' | 'holiday' | 'press'> = {
  news: 'default', notice: 'notice', event: 'event', holiday: 'holiday', press: 'press',
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLanguage()
  const [item, setItem] = useState<NewsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${BASE}/news/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setItem(data)
        document.title = `${data.title.en} | MESOB Center`
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false))
  }, [id])

  const getLocalized = (obj: { en: string; am: string; or: string } | undefined) => {
    if (!obj) return ''
    if (language === 'am' && obj.am) return obj.am
    if (language === 'or' && obj.or) return obj.or
    return obj.en || ''
  }

  if (loading) {
    return (
      <div className="section-padding min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="section-padding min-h-[50vh] flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {language === 'am' ? 'ዜና አልተገኘም' : language === 'or' ? 'Oduun hin argamne' : 'News not found'}
        </h2>
        <Link to="/news" className="mt-4 flex items-center gap-2 text-brand-green hover:underline">
          <ArrowLeft className="h-4 w-4" />
          {language === 'am' ? 'ወደ ዜና ተመለስ' : language === 'or' ? 'Gara Oduutti deebi\'i' : 'Back to News'}
        </Link>
      </div>
    )
  }

  const title = getLocalized(item.title)
  const content = getLocalized(item.content)
  const excerpt = getLocalized(item.excerpt)
  const hasMedia = item.media && item.media.length > 0

  return (
    <div className="section-padding">
      <div className="container-gov max-w-4xl">
        {/* Back link */}
        <Link to="/news" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-green mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {language === 'am' ? 'ወደ ዜና ተመለስ' : language === 'or' ? 'Gara Oduutti deebi\'i' : 'Back to News'}
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Badge variant={categoryVariant[item.category] || 'default'} size="sm">
                {(t.announcements.categories as Record<string, string>)[item.category] || item.category}
              </Badge>
              {item.isFeatured && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">
                  {t.common.featuredNews || 'Featured'}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <Calendar className="h-4 w-4" aria-hidden />
              <span>{formatDate(item.publishedAt)}</span>
            </div>
          </div>

          {/* Cover Image */}
          {item.coverImageUrl && (
            <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
              <img
                src={getImageUrl(item.coverImageUrl)}
                alt={title}
                className="w-full h-auto max-h-[500px] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          {/* Excerpt */}
          {excerpt && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-brand-green">
              <p className="text-lg text-gray-700 dark:text-gray-300 italic leading-relaxed">{excerpt}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none mb-10">
            <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {content}
            </div>
          </div>

          {/* Media Gallery */}
          {hasMedia && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'am' ? 'ሚዲያ' : language === 'or' ? 'Miidiyaa' : 'Media'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.media.map((m, i) => {
                  const mediaUrl = getImageUrl(m.url)
                  const caption = getLocalized(m.caption)
                  return (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {m.type === 'image' && (
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={mediaUrl} alt={caption || 'Media'} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                          {caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs">{caption}</p>
                          </div>}
                        </a>
                      )}
                      {m.type === 'video' && (
                        <div className="relative">
                          <video src={mediaUrl} controls className="w-full h-40 object-cover" />
                          {caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs">{caption}</p>
                          </div>}
                        </div>
                      )}
                      {m.type === 'audio' && (
                        <div className="p-4 flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800">
                          <Music className="h-8 w-8 text-brand-green mb-2" />
                          <audio src={mediaUrl} controls className="w-full" />
                          {caption && <p className="text-xs text-gray-500 mt-1">{caption}</p>}
                        </div>
                      )}
                      {m.type === 'document' && (
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="p-4 flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <FileText className="h-8 w-8 text-amber-500 mb-2" />
                          <span className="text-xs text-gray-500 truncate max-w-full">{mediaUrl.split('/').pop()}</span>
                          <ExternalLink className="h-3 w-3 text-gray-400 mt-1" />
                          {caption && <p className="text-xs text-gray-500 mt-1">{caption}</p>}
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-6 border-t border-gray-200 dark:border-gray-700">
              <Tag className="h-4 w-4 text-gray-400" aria-hidden />
              {item.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Share / Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link to="/news" className="flex items-center gap-2 text-sm text-brand-green hover:underline">
              <ArrowLeft className="h-4 w-4" />
              {language === 'am' ? 'ሌሎች ዜናዎች' : language === 'or' ? 'Oduuwwan biroo' : 'More News'}
            </Link>
          </div>
        </motion.article>
      </div>
    </div>
  )
}