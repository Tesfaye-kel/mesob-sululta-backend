import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'

const photos = [
  '/photo_2026-07-03_10-14-43.jpg',
  '/photo_2026-07-03_10-15-02.jpg',
  '/photo_2026-07-03_10-15-08.jpg',
  '/photo_2026-07-03_10-15-14.jpg',
  '/photo_2026-07-03_10-15-27.jpg',
  '/photo_2026-07-03_10-15-38.jpg',
]

export default function GalleryPreview() {
  const { t } = useLanguage()

  return (
    <section className="section-padding" aria-label="Gallery preview">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="section-title">{t.gallery.title}</h2>
            <p className="section-subtitle">{t.gallery.subtitle}</p>
          </div>
          <Link to="/gallery">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.common.viewMore}
            </Button>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="relative overflow-hidden rounded-xl aspect-video group cursor-pointer"
            >
              <img
                src={src}
                alt={`Gallery photo ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
