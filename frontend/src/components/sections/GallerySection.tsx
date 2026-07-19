import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, Image, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const categories = ['All', 'Events', 'Building', 'Community', 'Activities']

interface GalleryItem {
  _id: string
  title: { en: string; am: string; or: string }
  caption: { en: string; am: string; or: string }
  imageUrl: string
  category: string
}

export default function GallerySection() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  const categoryLabels: Record<string, string> = {
    All: t.gallery.all,
    Events: t.gallery.events,
    Building: t.gallery.building,
    Community: t.gallery.community,
    Activities: t.gallery.activities,
  }

  useEffect(() => {
    fetch(`${BASE}/gallery`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const [activeCategory, setActiveCategory] = useState('All')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)
  const filtered = items.filter(g => activeCategory === 'All' || g.category.toLowerCase() === activeCategory.toLowerCase())

  const getCaption = (item: GalleryItem) => {
    if (language === 'am' && item.caption?.am) return item.caption.am
    if (language === 'or' && item.caption?.or) return item.caption.or
    return item.caption?.en || ''
  }

  const getTitle = (item: GalleryItem) => {
    if (language === 'am' && item.title?.am) return item.title.am
    if (language === 'or' && item.title?.or) return item.title.or
    return item.title?.en || ''
  }

  const getImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${BASE.replace('/api', '')}${url}`
  }

  return (
    <div className="container-gov">
      {/* Filter tabs */}
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
          <Image className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No gallery images found</p>
        </div>
      )}

      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filtered.map((item, i) => {
            const caption = getCaption(item)
            const imgUrl = getImageUrl(item.imageUrl)
            return (
              <motion.div key={item._id} layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => setLightbox(item)}
                className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square bg-gray-100 dark:bg-gray-700"
                role="button" tabIndex={0} aria-label={`View ${getTitle(item)}`}
                onKeyDown={e => e.key === 'Enter' && setLightbox(item)}>
                {imgUrl ? (
                  <img src={imgUrl} alt={getTitle(item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-green to-brand-blue opacity-80" aria-hidden />
                )}
                {/* Caption overlay - centered on image */}
                {caption && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center max-w-[90%] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-95">
                      <p className="text-white text-sm font-medium leading-snug">{caption}</p>
                    </div>
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-black/40 text-white text-xs rounded-full backdrop-blur-sm">
                    {categoryLabels[item.category.charAt(0).toUpperCase() + item.category.slice(1)] ?? item.category}
                  </span>
                </div>
                {/* Hover zoom icon */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <ZoomIn className="h-8 w-8 text-white/70" aria-hidden />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing: ${getTitle(lightbox)}`}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightbox(null)} aria-label="Close">
              <X className="h-7 w-7" />
            </button>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-800 relative">
                {getImageUrl(lightbox.imageUrl) ? (
                  <img src={getImageUrl(lightbox.imageUrl)} alt={getTitle(lightbox)} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-blue">
                    <Image className="h-12 w-12 text-white/60" aria-hidden />
                  </div>
                )}
                {/* Caption in lightbox */}
                {getCaption(lightbox) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                    <p className="text-white text-lg font-medium text-center">{getCaption(lightbox)}</p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-xl">{getTitle(lightbox)}</h3>
                <p className="text-white/60 text-sm">{lightbox.category}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}