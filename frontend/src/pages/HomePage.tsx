import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'
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
import DownloadsSection from '@/components/sections/DownloadsSection'
import FeedbackSection from '@/components/sections/FeedbackSection'
import AnnouncementsSection from '@/components/sections/AnnouncementsSection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import { getWindows, getOrganizations, type WindowSummary, type Organization } from '@/api/tajaajila'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import FoddaaCard from '@/components/tajaajila/FoddaaCard'
import OfficeCard from '@/components/tajaajila/OfficeCard'

/** Reusable section wrapper used throughout the homepage */
function HomeSection({
  id,
  title,
  subtitle,
  linkTo,
  linkLabel,
  bg = '',
  children,
}: {
  id: string
  title: string
  subtitle?: string
  linkTo: string
  linkLabel: string
  bg?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={`section-padding ${bg}`} aria-label={title}>
      <div className="container-gov mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green dark:text-brand-green-light hover:gap-3 transition-all duration-200 shrink-0"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
  const { t, language } = useLanguage()
  const [windows, setWindows] = useState<WindowSummary[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServicesContent = () => {
    setLoading(true)
    setError(null)
    Promise.all([getWindows(), getOrganizations()])
      .then(([w, o]) => {
        setWindows(w)
        setOrgs(o)
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = `${t.siteName} – ${t.siteTagline} | ${t.govName}`
    loadServicesContent()
  }, [t])

  const windowHeading = language === 'am' ? 'አገልግሎቶች በፎዳ' : language === 'or' ? 'Tajaajiloota Foddaadhaan Bahe' : 'Services by Window'
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
        linkTo="/about"
        linkLabel={t.common.viewMore}
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
        linkTo="/tajaajila"
        linkLabel={t.services.viewAll}
        bg="bg-gray-50/50 dark:bg-gray-900/50"
      >
        <div className="section-padding pt-0">
          <div className="container-gov space-y-16">
            <section aria-label={windowHeading}>
              <h3 className="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">{windowHeading}</h3>

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
                  {windows.map((win, idx) => (
                    <CardItem key={win._id}>
                      <FoddaaCard id={win._id} number={win.number} serviceCount={win.serviceCount} index={idx} />
                    </CardItem>
                  ))}
                </CardGrid>
              )}
            </section>

            <section aria-label={officeHeading}>
              <h3 className="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">{officeHeading}</h3>

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
        linkTo="/organization"
        linkLabel={t.common.viewMore}
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
        linkTo="/announcements"
        linkLabel={t.common.viewMore}
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
        linkTo="/gallery"
        linkLabel={t.common.viewMore}
        bg="bg-gray-50/50 dark:bg-gray-900/30"
      >
        <div className="section-padding pt-0">
          <GallerySection />
        </div>
      </HomeSection>

      <Testimonials />

      {/* Downloads */}
      <HomeSection
        id="downloads"
        title={t.downloads.title}
        subtitle={t.downloads.subtitle}
        linkTo="/downloads"
        linkLabel={t.common.viewMore}
      >
        <div className="section-padding pt-0">
          <DownloadsSection />
        </div>
      </HomeSection>

      {/* FAQ */}
      <HomeSection
        id="faq"
        title={t.faq.title}
        subtitle={t.faq.subtitle}
        linkTo="/faq"
        linkLabel={t.common.viewMore}
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
        linkTo="/contact"
        linkLabel={t.common.viewMore}
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
        linkTo="/feedback"
        linkLabel={t.common.viewMore}
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

