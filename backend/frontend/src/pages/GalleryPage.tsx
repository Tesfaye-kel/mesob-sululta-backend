import { useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import GallerySection from '@/components/sections/GallerySection'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GalleryPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Gallery | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.gallery.title}
        subtitle={t.gallery.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.gallery }]}
      />
      <div className="section-padding">
        <GallerySection />
      </div>
    </>
  )
}


