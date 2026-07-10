import { useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import FeedbackSection from '@/components/sections/FeedbackSection'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FeedbackPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Feedback | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.feedback.title}
        subtitle={t.feedback.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.feedback }]}
      />
      <div className="section-padding">
        <FeedbackSection />
      </div>
    </>
  )
}


