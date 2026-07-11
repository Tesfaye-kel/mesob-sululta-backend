import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { services } from '@/data/services'
import { announcements } from '@/data/announcements'
import { faqs } from '@/data/faqs'
import { useLanguage } from '@/contexts/LanguageContext'

interface SearchModalProps {
  onClose: () => void
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { language } = useLanguage()

  useEffect(() => {
    inputRef.current?.focus()
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const q = query.toLowerCase().trim()

  const results = q.length < 2 ? [] : [
    ...services
      .filter(s => s.titleEn.toLowerCase().includes(q) || s.descriptionEn.toLowerCase().includes(q))
      .slice(0, 3)
      .map(s => ({ title: s.titleEn, path: '/services', type: 'Service' })),
    ...announcements
      .filter(a => a.titleEn.toLowerCase().includes(q))
      .slice(0, 2)
      .map(a => ({ title: a.titleEn, path: '/announcements', type: 'Announcement' })),
    ...faqs
      .filter(f => f.questionEn.toLowerCase().includes(q))
      .slice(0, 2)
      .map(f => ({ title: f.questionEn, path: '/faq', type: 'FAQ' })),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: -20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: -20, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Search"
        aria-modal="true"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search services, FAQs, announcements..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-gray-900 dark:text-white bg-transparent outline-none text-base placeholder-gray-400"
            aria-label="Search query"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.length < 2 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Type at least 2 characters to search
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['National ID', 'Passport', 'Business', 'Working Hours'].map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-brand-green/10 hover:text-brand-green transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
            </div>
          ) : (
            <ul className="p-2">
              {results.map((r, i) => (
                <li key={i}>
                  <Link
                    to={r.path}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                      <span className="text-xs text-brand-green dark:text-brand-green-light">{r.type}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-green transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-3">
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">↵</kbd> to select
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">Esc</kbd> to close
        </div>
      </motion.div>
    </motion.div>
  )
}
