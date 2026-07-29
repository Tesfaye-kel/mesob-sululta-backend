import { useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import DownloadsSection from '@/components/sections/DownloadsSection'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DownloadsPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Downloads | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.downloads.title}
        subtitle={t.downloads.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.downloads }]}
      />
      <div className="section-padding">
        <DownloadsSection />
      </div>
    </>
  )
}


