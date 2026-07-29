import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Phone, Mail, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FloatingHelp() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 w-64"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
              How can we help?
            </h3>
            <div className="space-y-2">
              <a
                href="tel:+251111110000"
                className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-green/5 dark:bg-brand-green/10 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 transition-colors text-sm"
              >
                <Phone className="h-4 w-4 text-brand-green shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Call Us</p>
                  <p className="text-xs text-gray-500">+251 11 111 0000</p>
                </div>
              </a>
              <a
                href="mailto:info@mesob-sululta.gov.et"
                className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-blue/5 dark:bg-brand-blue/10 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 transition-colors text-sm"
              >
                <Mail className="h-4 w-4 text-brand-blue shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Us</p>
                  <p className="text-xs text-gray-500">24hr response</p>
                </div>
              </a>
              <Link
                to="/feedback"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-gold/5 dark:bg-brand-gold/10 hover:bg-brand-gold/10 dark:hover:bg-brand-gold/20 transition-colors text-sm"
              >
                <MessageSquare className="h-4 w-4 text-brand-gold shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Send Feedback</p>
                  <p className="text-xs text-gray-500">{t.nav.feedback}</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="p-3.5 bg-brand-blue text-white rounded-full shadow-xl hover:bg-brand-blue-dark transition-all duration-200 active:scale-90"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? 'Close help' : 'Open help'}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
