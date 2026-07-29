import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, Image } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const categories = ['All', 'Events', 'Building', 'Community', 'Activities']

const galleryItems = [
  { id: 1,  category: 'Events',     title: 'Branch Inauguration Ceremony',    desc: '2023',                color: 'from-brand-green to-brand-blue' },
  { id: 2,  category: 'Building',   title: 'MESOB Sululta Exterior',           desc: 'Main Entrance',       color: 'from-brand-blue to-brand-gold' },
  { id: 3,  category: 'Community',  title: 'Citizen Service Day',              desc: '2024',                color: 'from-brand-gold to-brand-red' },
  { id: 4,  category: 'Events',     title: 'Digital Literacy Workshop',        desc: 'Training Session',    color: 'from-purple-600 to-brand-blue' },
  { id: 5,  category: 'Building',   title: 'Service Counter Hall',             desc: 'Interior View',       color: 'from-teal-600 to-brand-green' },
  { id: 6,  category: 'Community',  title: 'Youth Employment Fair',            desc: 'Annual Event',        color: 'from-brand-red to-brand-gold' },
  { id: 7,  category: 'Activities', title: 'Staff Training Day',               desc: '2024',                color: 'from-brand-green to-teal-600' },
  { id: 8,  category: 'Events',     title: 'Government Partnership Meeting',   desc: '2024',                color: 'from-brand-blue to-purple-600' },
  { id: 9,  category: 'Community',  title: 'Citizen Feedback Session',         desc: 'Community Engagement',color: 'from-brand-gold to-brand-green' },
  { id: 10, category: 'Activities', title: 'ID Registration Drive',            desc: 'Outreach Program',    color: 'from-brand-red to-brand-blue' },
  { id: 11, category: 'Building',   title: 'Waiting Area',                     desc: 'Modern Seating',      color: 'from-indigo-600 to-brand-blue' },
  { id: 12, category: 'Events',     title: 'National Day Celebration',         desc: 'Ethiopia Flag Day',   color: 'from-brand-green to-brand-gold' },
]

export default function GallerySection() {
  const { t, language } = useLanguage()

  const categoryLabels: Record<string, string> = {
    All:        t.gallery.all,
    Events:     t.gallery.events,
    Building:   t.gallery.building,
    Community:  t.gallery.community,
    Activities: t.gallery.activities,
  }

  const galleryItemsLocalized = galleryItems.map(item => ({
    ...item,
    titleLocalized:
      language === 'am'
        ? { 'Branch Inauguration Ceremony': 'የቅርንጫፍ መመረቂያ ሥነ ሥርዓት', 'MESOB Sululta Exterior': 'MESOB ሱሉልታ ውጫዊ', 'Citizen Service Day': 'የዜጎች አገልግሎት ቀን', 'Digital Literacy Workshop': 'ዲጂታል ማንበብና መጻፍ ወርክሾፕ', 'Service Counter Hall': 'የአገልግሎት ቆጠሮ አዳራሽ', 'Youth Employment Fair': 'የወጣቶች ሥራ ትርዒት', 'Staff Training Day': 'የሠራተኞች ስልጠና ቀን', 'Government Partnership Meeting': 'የመንግሥት ሽርክና ስብሰባ', 'Citizen Feedback Session': 'የዜጎች አስተያየት ስብሰባ', 'ID Registration Drive': '​ID ምዝገባ', 'Waiting Area': 'የጥበቃ ቦታ', 'National Day Celebration': 'የብሔራዊ ቀን ምርቃት' }[item.title] ?? item.title
        : language === 'or'
        ? { 'Branch Inauguration Ceremony': 'Sirna Baniinsaa Damee', 'MESOB Sululta Exterior': 'Alaa MESOB Sululta', 'Citizen Service Day': 'Guyyaa Tajaajila Lammiilee', 'Digital Literacy Workshop': 'Worshoopii Barreeffama Dijitaalaa', 'Service Counter Hall': 'Kutaa Kaawuntara Tajaajilaa', 'Youth Employment Fair': 'Feeristii Hojii Dargaggootaa', 'Staff Training Day': 'Guyyaa Leenjii Hojjettoota', 'Government Partnership Meeting': 'Walgahii Gamtaa Mootummaa', 'Citizen Feedback Session': 'Walgahii Yaada Lammiilee', 'ID Registration Drive': 'Galmeensa ID', 'Waiting Area': 'Bakka Eeggannaa', 'National Day Celebration': 'Kabajaa Guyyaa Biyyoolessa' }[item.title] ?? item.title
        : item.title,
  }))

  const [activeCategory, setActiveCategory] = useState('All')
  const [lightbox, setLightbox] = useState<typeof galleryItems[0] | null>(null)
  const filtered = galleryItemsLocalized.filter(g => activeCategory === 'All' || g.category === activeCategory)

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

      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filtered.map((item, i) => (
            <motion.div key={item.id} layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => setLightbox(item)}
              className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square bg-gray-100 dark:bg-gray-700"
              role="button" tabIndex={0} aria-label={`View ${item.titleLocalized}`}
              onKeyDown={e => e.key === 'Enter' && setLightbox(item)}>
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-80`} aria-hidden />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                <Image className="h-8 w-8 mb-2 opacity-50" aria-hidden />
                <p className="text-xs font-semibold text-center leading-tight opacity-80">{item.titleLocalized}</p>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white" aria-hidden />
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 bg-black/40 text-white text-xs rounded-full backdrop-blur-sm">
                  {categoryLabels[item.category] ?? item.category}
                </span>
              </div>
            </motion.div>
          ))}
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
            aria-label={`Viewing: ${lightbox.title}`}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightbox(null)} aria-label="Close">
              <X className="h-7 w-7" />
            </button>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${lightbox.color} flex items-center justify-center mb-4`}>
                <div className="text-center text-white">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-60" aria-hidden />
                  <p className="text-lg font-semibold">{lightbox.title}</p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-xl">{lightbox.title}</h3>
                <p className="text-white/60 text-sm">{lightbox.category} • {lightbox.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
