import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ActiveRouteProvider } from '@/contexts/ActiveRouteContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import Layout from '@/components/layout/Layout'

import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import OrganizationPage from '@/pages/OrganizationPage'
import AnnouncementsPage from '@/pages/AnnouncementsPage'
import GalleryPage from '@/pages/GalleryPage'
import FAQPage from '@/pages/FAQPage'
import ContactPage from '@/pages/ContactPage'
import FeedbackPage from '@/pages/FeedbackPage'
import NotFoundPage from '@/pages/NotFoundPage'
import TajaajilaaPage from '@/pages/TajaajilaaPage'
import FoddaaServicesPage from '@/pages/FoddaaServicesPage'
import OfficeServicesPage from '@/pages/OfficeServicesPage'
import BarbaachisaaPage from '@/pages/BarbaachisaaPage'

// Admin pages
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminAbout from '@/pages/admin/AdminAbout'
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements'
import AdminServices from '@/pages/admin/AdminServices'
import AdminFAQs from '@/pages/admin/AdminFAQs'
import AdminTestimonials from '@/pages/admin/AdminTestimonials'
import AdminOrganizations from '@/pages/admin/AdminOrganizations'
import AdminGallery from '@/pages/admin/AdminGallery'
import AdminContact from '@/pages/admin/AdminContact'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminProfile from '@/pages/admin/AdminProfile'
import AdminSettings from '@/pages/admin/AdminSettings'
import AdminRoute from '@/components/admin/AdminRoute'

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
          <AdminAuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AnimatePresence mode="wait" initial={false}>
                <Routes>
                  {/* Public routes */}
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
                    <Route path="faq" element={<PageWrapper><FAQPage /></PageWrapper>} />
                    <Route path="contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                    <Route path="feedback" element={<PageWrapper><FeedbackPage /></PageWrapper>} />
                    <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
                  </Route>

                  {/* Admin routes - hidden from public nav, accessible only at /Admin */}
                  <Route path="/Admin" element={<AdminLogin />} />
                  <Route path="/Admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="about" element={<AdminAbout />} />
                      <Route path="announcements" element={<AdminAnnouncements />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="faqs" element={<AdminFAQs />} />
                      <Route path="testimonials" element={<AdminTestimonials />} />
                      <Route path="organizations" element={<AdminOrganizations />} />
                      <Route path="gallery" element={<AdminGallery />} />
                      <Route path="contact" element={<AdminContact />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Route>
                </Routes>
              </AnimatePresence>
            </BrowserRouter>
          </AdminAuthProvider>
        </ActiveRouteProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

