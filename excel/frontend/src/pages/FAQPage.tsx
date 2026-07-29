import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { faqs, faqCategories } from '@/data/faqs'
import { Input } from '@/components/ui/Input'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export default function FAQPage() {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    document.title = `FAQ | MESOB Center – Sululta Branch`
  }, [])

  const filtered = faqs.filter(f => {
    const question = language === 'am' ? f.questionAm : language === 'or' ? f.questionOr : f.questionEn
    const matchCat = category === 'All' || f.category === category
    const matchSearch = !search || question.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <PageHeader
        title={t.faq.title}
        subtitle={t.faq.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.faq }]}
      />

      <div className="section-padding">
        <div className="container-gov max-w-4xl">
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder={t.faq.search}
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenId(null) }}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {faqCategories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setOpenId(null) }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  category === cat
                    ? 'bg-brand-green text-white shadow-gov'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green dark:hover:text-brand-green-light'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ items */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400">{t.faq.noResults}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq, i) => {
                const question = language === 'am' ? faq.questionAm : language === 'or' ? faq.questionOr : faq.questionEn
                const answer = language === 'am' ? faq.answerAm : language === 'or' ? faq.answerOr : faq.answerEn
                const isOpen = openId === faq.id

                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${faq.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {faq.popular && (
                          <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-brand-gold" aria-label="Popular question" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 text-gray-400"
                        aria-hidden
                      >
                        <ChevronDown className="h-5 w-5" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-${faq.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                              {answer}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                {faq.category}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


