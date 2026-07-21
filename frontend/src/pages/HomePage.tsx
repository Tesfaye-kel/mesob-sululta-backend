import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

import Hero from '@/components/home/Hero'
import WhyMesob from '@/components/home/WhyMesob'
import OfficeHours from '@/components/home/OfficeHours'
import Testimonials from '@/components/home/Testimonials'
import Partners from '@/components/home/Partners'

// Shared section content — same as navbar pages
import AboutSection from '@/components/sections/AboutSection'
import OrganizationSection from '@/components/sections/OrganizationSection'
import GallerySection from '@/components/sections/GallerySection'
import FeedbackSection from '@/components/sections/FeedbackSection'
import AnnouncementsSection from '@/components/sections/AnnouncementsSection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import { getOrganizations, type Organization } from '@/api/tajaajila'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import OfficeCard from '@/components/tajaajila/OfficeCard'

import { motion } from 'framer-motion'

/** Reusable section wrapper used throughout the homepage */
function HomeSection({
  id,
  title,
  subtitle,
  bg = '',
  children,
}: {
  id: string
  title: string
  subtitle?: string
  bg?: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={`section-padding ${bg}`}
      aria-label={title}
    >
      <div className="container-gov mb-10">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

export default function HomePage() {
  const { t, language } = useLanguage()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServicesContent = () => {
    setLoading(true)
    setError(null)
    getOrganizations()
      .then(setOrgs)
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = `${t.siteName} – ${t.siteTagline} | ${t.govName}`
    loadServicesContent()
  }, [t])

  const officeHeading = language === 'am' ? 'አገልግሎቶች በቢሮ' : language === 'or' ? 'Tajaajiloota Waajjiraa' : 'Services by Office'
  const loadingLabel = language === 'am' ? 'በመጫን ላይ...' : language === 'or' ? "Fe'aa jira..." : 'Loading...'
  const serverErrTitle = language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' : language === 'or' ? 'Server waliin walqunnamuu hin dandeenye' : 'Could not connect to server'
  const serverErrDesc = language === 'am' ? 'ሰርቨሩ ቆሟል። ሙሉ አስተዳዳሪ ሰርቨሩን ያስጀምር።' : language === 'or' ? 'Backend server dhaabatee jira. Bulchiinsi server jalqabsiisuu qaba.' : 'The backend server is stopped. An admin needs to start the server.'
  const retryLabel = language === 'am' ? 'እንደገና ሞክር' : language === 'or' ? "Irra deebi'ii yaalii" : 'Try Again'

  return (
    <>
      <Hero />

      {/* About */}
      <HomeSection
        id="about"
        title={t.about.title}
        subtitle={t.about.subtitle}
      >
        <div className="section-padding pt-0">
          <AboutSection />
        </div>
      </HomeSection>

      {/* Services */}
      <HomeSection
        id="services"
        title={t.services.title}
        subtitle={t.services.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/50"
      >
        <div className="section-padding pt-0">
          <div className="container-gov">
            <section aria-label={officeHeading}>
              <h3 className="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">{officeHeading}</h3>

              {loading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label={loadingLabel} />
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{serverErrTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">{serverErrDesc}</p>
                  </div>
                  <button
                    onClick={loadServicesContent}
                    className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                  >
                    {retryLabel}
                  </button>
                </div>
              )}

              {!loading && !error && (
                <CardGrid>
                  {orgs.map((org, idx) => (
                    <CardItem key={org._id}>
                      <OfficeCard id={org._id} name={org.name} serviceCount={org.serviceCount} index={idx} />
                    </CardItem>
                  ))}
                </CardGrid>
              )}
            </section>
          </div>
        </div>
      </HomeSection>

      <WhyMesob />


      {/* Organization */}
      <HomeSection
        id="organization"
        title={t.organization.title}
        subtitle={t.organization.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <OrganizationSection />
        </div>
      </HomeSection>

      {/* Announcements */}
      <HomeSection
        id="announcements"
        title={t.announcements.title}
        subtitle={t.announcements.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <AnnouncementsSection compact showHeader={false} />
        </div>
      </HomeSection>

      {/* Gallery */}
      <HomeSection
        id="gallery"
        title={t.gallery.title}
        subtitle={t.gallery.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <GallerySection />
        </div>
      </HomeSection>

      <Testimonials />

      {/* FAQ */}
      <HomeSection
        id="faq"
        title={t.faq.title}
        subtitle={t.faq.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <FAQSection compact showHeader={false} />
        </div>
      </HomeSection>

      {/* Contact / Hours */}
      <HomeSection
        id="contact"
        title={t.contact.title}
        subtitle={t.contact.subtitle}
      >
        <div className="section-padding pt-0">
          <ContactSection compact showHeader={false} />
        </div>
      </HomeSection>

      {/* Feedback */}
      <HomeSection
        id="feedback"
        title={t.feedback.title}
        subtitle={t.feedback.subtitle}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <FeedbackSection />
        </div>
      </HomeSection>

      <Partners />
    </>
  )
}

