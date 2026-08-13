import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ActiveRouteProvider } from '@/contexts/ActiveRouteContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import Layout from '@/components/layout/Layout'

import HomePage from '@/pages/HomePage'
import NewsDetailPage from '@/pages/NewsDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import GalleryPage from '@/pages/GalleryPage'
import { Navigate } from 'react-router-dom'

// Admin pages
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminAbout from '@/pages/admin/AdminAbout'
import AdminNews from '@/pages/admin/AdminNews'
import AdminServices from '@/pages/admin/AdminServices'
import AdminFAQs from '@/pages/admin/AdminFAQs'
import AdminGallery from '@/pages/admin/AdminGallery'
import AdminContact from '@/pages/admin/AdminContact'
import AdminContactMessages from '@/pages/admin/AdminContactMessages'
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
                  {/* Homepage with all sections (service cards live here) */}
                  <Route index element={<PageWrapper><HomePage /></PageWrapper>} />
                  {/* Service by Window / Office — redirect to home services section
                      (cards are shown on the home page only, no duplication) */}
                  <Route path="tajaajila" element={<Navigate to="/#services" replace />} />
                  <Route path="tajaajila/office" element={<Navigate to="/#services" replace />} />
                  <Route path="gallery" element={<PageWrapper><GalleryPage /></PageWrapper>} />
                  <Route path="news/:id" element={<PageWrapper><NewsDetailPage /></PageWrapper>} />
                  <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
                </Route>

                  {/* Admin routes (also accept lowercase `/admin` -> redirect to `/Admin`) */}
                  <Route path="admin" element={<Navigate to="/Admin" replace />} />
                  <Route path="admin/*" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="about" element={<AdminAbout />} />
                      <Route path="news" element={<AdminNews />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="faqs" element={<AdminFAQs />} />
                      <Route path="gallery" element={<AdminGallery />} />
                      <Route path="contact" element={<AdminContact />} />
                      <Route path="contact-messages" element={<AdminContactMessages />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Route>
                  <Route path="/Admin" element={<AdminLogin />} />
                  <Route path="/Admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="about" element={<AdminAbout />} />
                      <Route path="news" element={<AdminNews />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="faqs" element={<AdminFAQs />} />
                      <Route path="gallery" element={<AdminGallery />} />
                      <Route path="contact" element={<AdminContact />} />
                      <Route path="contact-messages" element={<AdminContactMessages />} />
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

