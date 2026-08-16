import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ActiveRouteProvider } from '@/contexts/ActiveRouteContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import Layout from '@/components/layout/Layout'

import HomePage from '@/pages/HomePage'
import NewsDetailPage from '@/pages/NewsDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import GalleryPage from '@/pages/GalleryPage'

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

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ActiveRouteProvider>
          <AdminAuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="tajaajila" element={<Navigate to="/#services" replace />} />
                  <Route path="tajaajila/office" element={<Navigate to="/#services" replace />} />
                  <Route path="gallery" element={<GalleryPage />} />
                  <Route path="news/:id" element={<NewsDetailPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin login */}
                <Route path="/admin" element={<Navigate to="/Admin" replace />} />
                <Route path="/Admin" element={<AdminLogin />} />

                {/* Protected admin routes */}
                <Route path="/Admin/*" element={<AdminRoute />}>
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
                    <Route index element={<Navigate to="/Admin/dashboard" replace />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </AdminAuthProvider>
        </ActiveRouteProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}