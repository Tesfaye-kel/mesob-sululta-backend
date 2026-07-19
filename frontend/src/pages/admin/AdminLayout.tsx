import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, HelpCircle, MessageSquareQuote,
  Building2, Users, UserCircle, Settings, LogOut,
  ChevronLeft, Menu, X, Shield, Sun, Moon,
  Info, Image, Phone, Wrench, MessageSquare,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { to: '/Admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/Admin/about', label: 'About', icon: Info },
  { to: '/Admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/Admin/services', label: 'Services', icon: Wrench },
  { to: '/Admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/Admin/gallery', label: 'Gallery', icon: Image },
  { to: '/Admin/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/Admin/contact', label: 'Contact', icon: Phone },
  { to: '/Admin/contact-messages', label: 'Messages', icon: MessageSquare },
  { to: '/Admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/Admin/users', label: 'Users', icon: Users },
  { to: '/Admin/profile', label: 'Profile', icon: UserCircle },
  { to: '/Admin/settings', label: 'Settings', icon: Settings },
]

const sidebarVariants = {
  open: { width: 240, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { width: 64, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

const itemVariants = {
  hover: { x: 4, transition: { type: 'spring', stiffness: 300, damping: 20 } },
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAdminAuth()
  const { toggleTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/Admin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30',
          'bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-800',
          'shadow-sm'
        )}
      >
        {/* Logo area */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Shield className="h-5 w-5 text-brand-green" />
              <span className="font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap">Admin Panel</span>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => {
            const isActive = location.pathname === link.to
            return (
              <motion.div key={link.to} variants={itemVariants} whileHover="hover">
                <NavLink
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </NavLink>
              </motion.div>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {sidebarOpen && <span>Theme</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebar(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <Shield className="h-5 w-5 text-brand-green" />
            <span className="font-bold text-sm text-gray-900 dark:text-white">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileSidebar(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl"
            >
              <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-green" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Admin Panel</span>
                </div>
                <button
                  onClick={() => setMobileSidebar(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {sidebarLinks.map(link => {
                  const isActive = location.pathname === link.to
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileSidebar(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <link.icon className="h-5 w-5 shrink-0" />
                      {link.label}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => { handleLogout(); setMobileSidebar(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen',
        'lg:ml-16', // sidebar width when closed
        sidebarOpen && 'lg:ml-60', // sidebar width when open
        'pt-14 lg:pt-0' // mobile header offset
      )}>
        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-end h-14 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-brand-green" />
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  )
}