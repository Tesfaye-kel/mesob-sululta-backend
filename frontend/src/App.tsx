import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ActiveRouteProvider } from '@/contexts/ActiveRouteContext'
import Layout from '@/components/layout/Layout'

import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import OrganizationPage from '@/pages/OrganizationPage'
import AnnouncementsPage from '@/pages/AnnouncementsPage'
import GalleryPage from '@/pages/GalleryPage'
import DownloadsPage from '@/pages/DownloadsPage'
import FAQPage from '@/pages/FAQPage'
import ContactPage from '@/pages/ContactPage'
import FeedbackPage from '@/pages/FeedbackPage'
import NotFoundPage from '@/pages/NotFoundPage'
import TajaajilaaPage from '@/pages/TajaajilaaPage'
import FoddaaServicesPage from '@/pages/FoddaaServicesPage'
import OfficeServicesPage from '@/pages/OfficeServicesPage'
import BarbaachisaaPage from '@/pages/BarbaachisaaPage'

import ScrollToTop from '@/components/common/ScrollToTop'

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ActiveRouteProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AnimatePresence mode="wait" initial={false}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<PageWrapper><HomePage /></PageWrapper>} />
                  <Route path="about" element={<PageWrapper><AboutPage /></PageWrapper>} />

                  <Route path="tajaajila" element={<PageWrapper><TajaajilaaPage /></PageWrapper>} />
                  <Route path="tajaajila/foddaa/:windowId" element={<PageWrapper><FoddaaServicesPage /></PageWrapper>} />
                  <Route path="tajaajila/office/:officeId" element={<PageWrapper><OfficeServicesPage /></PageWrapper>} />
                  <Route path="tajaajila/service/:serviceId/barbaachisa" element={<PageWrapper><BarbaachisaaPage /></PageWrapper>} />

                  <Route path="organization" element={<PageWrapper><OrganizationPage /></PageWrapper>} />
                  <Route path="announcements" element={<PageWrapper><AnnouncementsPage /></PageWrapper>} />
                  <Route path="gallery" element={<PageWrapper><GalleryPage /></PageWrapper>} />
                  <Route path="downloads" element={<PageWrapper><DownloadsPage /></PageWrapper>} />
                  <Route path="faq" element={<PageWrapper><FAQPage /></PageWrapper>} />
                  <Route path="contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                  <Route path="feedback" element={<PageWrapper><FeedbackPage /></PageWrapper>} />
                  <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
                </Route>
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </ActiveRouteProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

