import { useEffect } from 'react'
import AboutSection from '@/components/sections/AboutSection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AboutPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `About | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.about.title}</AnimatedHeading>
        <AboutSection />
      </div>
    </div>
  )
}