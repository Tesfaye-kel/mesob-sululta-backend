import { useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import AboutSection from '@/components/sections/AboutSection'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AboutPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `About | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.about.title}
        subtitle={t.about.subtitle}
        breadcrumbs={[{ label: t.common.home, href: '/' }, { label: t.nav.about }]}
      />
      <div className="section-padding">
        <AboutSection />
      </div>
    </>
  )
}

