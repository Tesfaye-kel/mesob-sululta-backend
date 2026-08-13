import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GallerySection from '@/components/sections/GallerySection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GalleryPage() {
  const { t, language } = useLanguage()

  const backLabel =
    language === 'or' ? 'Fuula Duraa' :
    language === 'am' ? 'ወደ ዋናው ገጽ ተመለስ' :
    'Back to Home'

  useEffect(() => {
    document.title = `${t.gallery.title} | MESOB Center – Sululta Branch`
  }, [t])

  return (
    <div className="section-padding">
      <div className="container-gov">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-brand-green hover:text-brand-green/80 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <AnimatedHeading as="h1" className="text-center mb-8">{t.gallery.title}</AnimatedHeading>

        {/* Full gallery — no compact limit */}
        <GallerySection />
      </div>
    </div>
  )
}
