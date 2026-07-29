import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { faqs } from '@/data/faqs'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'

export default function HomeFAQPreview() {
  const { t, language } = useLanguage()
  const [openId, setOpenId] = useState<string | null>(null)
  const popular = faqs.filter(f => f.popular).slice(0, 5)

  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/30" aria-label="FAQ preview">
      <div className="container-gov max-w-3xl">
        <AnimatedSection variant="fadeUp" className="text-center mb-10">
          <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">FAQ</span>
          <h2 className="section-title text-center">{t.faq.title}</h2>
          <p className="section-subtitle mx-auto text-center">{t.faq.subtitle}</p>
        </AnimatedSection>

        <div className="space-y-3">
          {popular.map((faq, i) => {
            const question = language === 'am' ? faq.questionAm : language === 'or' ? faq.questionOr : faq.questionEn
            const answer = language === 'am' ? faq.answerAm : language === 'or' ? faq.answerOr : faq.answerEn
            const isOpen = openId === faq.id

            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                    aria-hidden
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <p className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                        {answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        <AnimatedSection variant="fadeUp" delay={0.3} className="text-center mt-8">
          <Link to="/faq">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All FAQs
            </Button>
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}
