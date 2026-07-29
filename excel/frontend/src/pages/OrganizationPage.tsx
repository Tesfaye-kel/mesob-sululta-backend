import { useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import OrganizationSection from '@/components/sections/OrganizationSection'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OrganizationPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Organization | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.organization.title}
        subtitle={t.organization.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.organization }]}
      />
      <div className="section-padding">
        <OrganizationSection />
      </div>
    </>
  )
}


