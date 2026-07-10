import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Accessibility, ZoomIn, ZoomOut, Type, X } from 'lucide-react'

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)

  const changeFontSize = (delta: number) => {
    const newSize = Math.min(150, Math.max(80, fontSize + delta))
    setFontSize(newSize)
    document.documentElement.style.fontSize = `${newSize}%`
  }

  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-0 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="bg-brand-blue text-white p-2 rounded-r-lg shadow-lg hover:bg-brand-blue-dark transition-colors"
        aria-label="Accessibility options"
        aria-expanded={open}
      >
        <Accessibility className="h-4 w-4" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-0 left-9 bg-white dark:bg-gray-800 rounded-r-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 w-48"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Accessibility</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Text Size</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeFontSize(-10)}
                  disabled={fontSize <= 80}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
                  aria-label="Decrease text size"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="flex-1 text-center text-sm font-mono text-gray-700 dark:text-gray-200">
                  {fontSize}%
                </span>
                <button
                  onClick={() => changeFontSize(10)}
                  disabled={fontSize >= 150}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
                  aria-label="Increase text size"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              <button
                onClick={() => changeFontSize(100 - fontSize)}
                className="w-full text-xs text-brand-green dark:text-brand-green-light hover:underline"
              >
                Reset to default
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
