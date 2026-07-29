import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

import Hero from '@/components/home/Hero'
import QuickServices from '@/components/home/QuickServices'
import WhyMesob from '@/components/home/WhyMesob'
import LatestAnnouncements from '@/components/home/LatestAnnouncements'
import HomeFAQPreview from '@/components/home/HomeFAQPreview'
import OfficeHours from '@/components/home/OfficeHours'
import Testimonials from '@/components/home/Testimonials'
import Partners from '@/components/home/Partners'

// Shared section content — same as navbar pages
import AboutSection from '@/components/sections/AboutSection'
import OrganizationSection from '@/components/sections/OrganizationSection'
import GallerySection from '@/components/sections/GallerySection'
import DownloadsSection from '@/components/sections/DownloadsSection'
import FeedbackSection from '@/components/sections/FeedbackSection'

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
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `${t.siteName} – ${t.siteTagline} | ${t.govName}`
  }, [t])

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
      <QuickServices />
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
      <LatestAnnouncements />

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
      <HomeFAQPreview />

      {/* Contact / Hours */}
      <OfficeHours />

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

