import { useEffect } from 'react'
import OrganizationSection from '@/components/sections/OrganizationSection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OrganizationPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Organization | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.organization.title}</AnimatedHeading>
        <OrganizationSection />
      </div>
    </div>
  )
}