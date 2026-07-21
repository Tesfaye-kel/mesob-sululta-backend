import { useEffect } from 'react'
import FeedbackSection from '@/components/sections/FeedbackSection'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FeedbackPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Feedback | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.feedback.title}</AnimatedHeading>
        <FeedbackSection />
      </div>
    </div>
  )
}