import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BackToTop from '@/components/common/BackToTop'
import FloatingHelp from '@/components/common/FloatingHelp'
import CookieNotice from '@/components/common/CookieNotice'
import SearchModal from '@/components/common/SearchModal'
import AccessibilityToolbar from '@/components/common/AccessibilityToolbar'

export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden" id="app-root">
      {/* Skip to main content – accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-green focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Navbar with regular routing */}
      <Navbar onSearchOpen={() => setSearchOpen(true)} />

      <main id="main-content" className="flex-1 pt-20" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
      <BackToTop />
      <FloatingHelp />
      <CookieNotice />
      <AccessibilityToolbar />

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
