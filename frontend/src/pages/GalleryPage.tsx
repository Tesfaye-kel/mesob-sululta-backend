import { useEffect } from 'react'
import GallerySection from '@/components/sections/GallerySection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GalleryPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Gallery | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.gallery.title}</AnimatedHeading>
        <GallerySection />
      </div>
    </div>
  )
}