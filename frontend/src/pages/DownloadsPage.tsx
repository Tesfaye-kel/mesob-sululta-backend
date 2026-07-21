import { useEffect } from 'react'
import DownloadsSection from '@/components/sections/DownloadsSection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DownloadsPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Downloads | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.downloads.title}</AnimatedHeading>
        <DownloadsSection />
      </div>
    </div>
  )
}