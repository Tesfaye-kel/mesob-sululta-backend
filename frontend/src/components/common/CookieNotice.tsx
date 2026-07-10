import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('mesob-cookies')
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('mesob-cookies', 'accepted')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
          role="dialog"
          aria-label="Cookie notice"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5">
            <button
              onClick={() => setVisible(false)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close cookie notice"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  We use cookies
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  This site uses cookies to improve your experience and provide better government services.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={accept}>Accept All</Button>
                  <Button size="sm" variant="outline" onClick={() => setVisible(false)}>Decline</Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
