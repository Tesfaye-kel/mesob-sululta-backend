import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

// Import all home sections
import Hero from '@/components/home/Hero'
import QuickServices from '@/components/home/QuickServices'
import LatestAnnouncements from '@/components/home/LatestAnnouncements'
import WhyMesob from '@/components/home/WhyMesob'
import Testimonials from '@/components/home/Testimonials'
import Partners from '@/components/home/Partners'
import OfficeHours from '@/components/home/OfficeHours'
import HomeFAQPreview from '@/components/home/HomeFAQPreview'

// Import section components from other pages (we'll convert them)
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import OrganizationSection from '@/components/sections/OrganizationSection'
import AnnouncementsSection from '@/components/sections/AnnouncementsSection'
import GallerySection from '@/components/sections/GallerySection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import Footer from '@/components/layout/Footer'

export default function SinglePageHome() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `${t.siteName} – ${t.siteTagline} | ${t.govName}`
  }, [t])

  return (
    <>
      {/* Home Section */}
      <section id="home">
        <Hero />
        <QuickServices />
        <LatestAnnouncements />
        <WhyMesob />
        <Testimonials />
        <Partners />
      </section>

      {/* About Section */}
      <section id="about">
        <AboutSection />
      </section>

      {/* Services Section */}
      <section id="services">
        <ServicesSection />
      </section>

      {/* Organization Section */}
      <section id="organization">
        <OrganizationSection />
      </section>

      {/* Announcements Section */}
      <section id="announcements">
        <AnnouncementsSection />
      </section>

      {/* Gallery Section */}
      <section id="gallery">
        <GallerySection />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* Contact Section */}
      <section id="contact">
        <ContactSection />
        <OfficeHours />
      </section>

      {/* Footer */}
      <Footer />
    </>
  )
}

