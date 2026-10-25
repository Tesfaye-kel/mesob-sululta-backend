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
import AboutPage from '@/pages/AboutPage'
import FeedbackPage from '@/pages/FeedbackPage'
import CitizenPortal, { CitizenFirstPasswordPage } from '@/pages/CitizenPortal'
import EmployeePortal, { EmployeeActivationPage } from '@/pages/EmployeePortal'
import ReceiptVerificationPage from '@/pages/ReceiptVerificationPage'
import RegistrarPortal from '@/pages/RegistrarPortal'

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
import AdminRegistrars from '@/pages/admin/AdminRegistrars'
import AdminEmployees from '@/pages/admin/AdminEmployees'
import AdminCitizens from '@/pages/admin/AdminCitizens'
import AdminFeedbackInbox from '@/pages/admin/AdminFeedbackInbox'
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
                  <Route path="about" element={<AboutPage />} />
                  <Route path="feedback" element={<FeedbackPage />} />
                  <Route path="portal" element={<Navigate to="/citizen/" replace />} />
                  <Route path="portal/admin" element={<Navigate to="/Admin" replace />} />
                  <Route path="portal/employee" element={<Navigate to="/employe/" replace />} />
                  <Route path="portal/activate" element={<Navigate to={`/employe/activate${window.location.search}`} replace />} />
                  <Route path="news/:id" element={<NewsDetailPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/citizen/*" element={<CitizenPortal />} />
                <Route path="/citizen/activate" element={<CitizenFirstPasswordPage />} />
                <Route path="/receipt/verify" element={<ReceiptVerificationPage />} />
                <Route path="/registrar/*" element={<Navigate to="/employe" replace />} />
                <Route path="/employe/system-administration" element={<RegistrarPortal />} />
                <Route path="/employe/activate" element={<EmployeeActivationPage />} />
                <Route path="/employe/*" element={<EmployeePortal />} />

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
                    <Route path="offices" element={<Navigate to="/Admin/services" replace />} />
                    <Route path="faqs" element={<AdminFAQs />} />
                    <Route path="gallery" element={<AdminGallery />} />
                    <Route path="contact" element={<AdminContact />} />
                    <Route path="contact-messages" element={<AdminContactMessages />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="appointments" element={<Navigate to="/Admin/citizens#appointments-panel" replace />} />
                    <Route path="registrars" element={<AdminRegistrars />} />
                    <Route path="employees" element={<AdminEmployees />} />
                    <Route path="citizens" element={<AdminCitizens />} />
                    <Route path="feedback-inbox" element={<AdminFeedbackInbox />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route index element={<Navigate to="/Admin/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/Admin/dashboard" replace />} />
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