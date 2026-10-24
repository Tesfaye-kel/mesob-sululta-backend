import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Globe, LogOut, CheckCircle } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

export default function AdminSettings() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const { toggleTheme, isDark } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const admin = t.admin
  const portal = admin.portal
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.settingsTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{admin.settingsDescription}</p>
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
          {admin.applicationTheme}
        </h2>
        <button onClick={() => { toggleTheme(); copySuccess(isDark ? admin.lightModeEnabled : admin.darkModeEnabled) }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-green/50 transition-all w-full">
          {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{isDark ? admin.switchToLight : admin.switchToDark}</p>
            <p className="text-xs text-gray-500">{admin.current}: {isDark ? admin.darkMode : admin.lightMode}</p>
          </div>
        </button>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand-green" /> {admin.language}
        </h2>
        <label className="sr-only" htmlFor="admin-settings-language">{admin.language}</label>
        <select id="admin-settings-language" value={language}
          onChange={event => {
            const nextLanguage = event.target.value as typeof language
            setLanguage(nextLanguage)
            const label = nextLanguage === 'en' ? portal.languageEnglish
              : nextLanguage === 'am' ? portal.languageAmharic : portal.languageOromo
            copySuccess(admin.languageSetTo.replace('{language}', label))
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="en">{portal.languageEnglish}</option>
          <option value="am">{portal.languageAmharic}</option>
          <option value="or">{portal.languageOromo}</option>
        </select>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-medium text-sm">
          <LogOut className="h-5 w-5" />
          {admin.signOut}
        </button>
      </motion.div>
    </div>
  )
}