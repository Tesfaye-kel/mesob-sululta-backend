import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Sun, Moon, Globe, LogOut, Loader2, CheckCircle } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

export default function AdminSettings() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const { toggleTheme, isDark } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [success, setSuccess] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/Admin', { replace: true })
  }

  const copySuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Application preferences and configuration</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {isDark ? <Moon className="h-5 w-5 text-brand-green" /> : <Sun className="h-5 w-5 text-brand-green" />}
          Theme
        </h2>
        <button onClick={() => { toggleTheme(); copySuccess(isDark ? 'Light mode enabled' : 'Dark mode enabled') }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-green/50 transition-all w-full">
          {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Switch to {isDark ? 'Light' : 'Dark'} Mode</p>
            <p className="text-xs text-gray-500">Current: {isDark ? 'Dark' : 'Light'}</p>
          </div>
        </button>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand-green" /> Language
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'en' as const, label: 'English', short: 'EN' },
            { code: 'am' as const, label: 'አማርኛ', short: 'አማ' },
            { code: 'or' as const, label: 'Afaan Oromo', short: 'OR' },
          ].map(lang => (
            <button key={lang.code}
              onClick={() => { setLanguage(lang.code); copySuccess(`Language set to ${lang.label}`) }}
              className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                language === lang.code
                  ? 'bg-brand-green text-white shadow-md'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              <span className="block font-bold">{lang.short}</span>
              <span className="block text-xs mt-0.5 opacity-80">{lang.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </motion.div>
    </div>
  )
}