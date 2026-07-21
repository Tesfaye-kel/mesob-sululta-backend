import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface FAQData {
  _id: string
  question: { en: string; am: string; or: string }
  answer: { en: string; am: string; or: string }
  category: string
  order: number
  isPopular: boolean
}

interface FAQSectionProps {
  compact?: boolean
  showHeader?: boolean
}

// Fallback local FAQs used when backend is unavailable
const localFAQs = [
  { question: { en: 'What is MESOB Center?', am: 'MESOB ማዕከል ምንድን ነው?', or: 'Giddaan MESOB maali?' }, answer: { en: 'MESOB is Ethiopia\'s modern One-Stop Shop government service center that allows citizens to access multiple federal government services in one convenient location.', am: 'MESOB የኢትዮጵያ ዘመናዊ የአንድ ቦታ አቅርቦት የመንግሥት አገልግሎት ማዕከል ነው።', or: 'MESOB giddu-gala tajaajila mootummaa bakka tokkotti argachuu kan dandeessisu Itoophiyaa ti.' } },
  { question: { en: 'What documents do I need to bring?', am: 'ምን ሰነዶች ማምጣት አለብኝ?', or: 'Galmeelee maal fida?' }, answer: { en: 'Always bring your National ID card or Kebele ID. Additional documents vary by service.', am: 'ሁልጊዜ ብሔራዊ መታወቂያ ወይም ቀበሌ መታወቂያ ያምጡ።', or: 'Yeroo hunda ID Biyyoolessa ykn ID Qaballee fida.' } },
  { question: { en: 'How long for a National ID card?', am: 'መታወቂያ ለማግኘት ምን ያህል ጊዜ?', or: 'ID argachuuf yeroon?' }, answer: { en: 'Typically 3–5 working days. You will receive an SMS when ready.', am: 'ብዙውን ጊዜ 3-5 ቀናት።', or: 'Yeroo hojii 3-5.' } },
  { question: { en: 'Can I pay fees online?', am: 'ክፍያ ኦንላይን መክፈል እችላለሁ?', or: 'Kaffaltii onlaayinii?' }, answer: { en: 'Yes! MESOB supports CBE Birr, TeleBirr, and MESOB mobile app payments.', am: 'አዎ! MESOB CBE ቢር፣ ቴሌቢር ይደግፋል።', or: 'Eeyyee! MESOB CBE Birr, TeleBirr ni deeggarsa.' } },
  { question: { en: 'Where is MESOB Sululta Branch?', am: 'MESOB ሱሉልታ የት ነው?', or: 'MESOB Sululta eessa?' }, answer: { en: 'Main road of Sululta Town, Oromia, ~30km north of Addis Ababa.', am: 'በሱሉልታ ከተማ ዋና መንገድ ላይ።', or: 'Daandii guddaa Sululta, Finfinnee kaaba 30km.' } },
]

export default function FAQSection({ compact = false, showHeader = true }: FAQSectionProps) {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<FAQData[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    fetch(`${BASE}/faqs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.slice(0, 6))
        } else {
          setIsOffline(true)
        }
      })
      .catch(() => { setIsOffline(true) })
      .finally(() => setLoading(false))
  }, [])

  const displayItems = items.length > 0 ? items : (isOffline ? localFAQs : [])

  const content = (
    <div className="container-gov max-w-3xl">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-10">
          <span className="gov-badge bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 mb-3">
            FAQ
          </span>
          <h2 className="section-title text-center">{t.faq.title}</h2>
          <p className="section-subtitle mx-auto text-center">{t.faq.subtitle}</p>
        </AnimatedSection>
      )}

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}

      {!loading && displayItems.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No FAQs available at this time.</p>
        </div>
      )}

      <div className="space-y-3">
        {displayItems.map((faq: any, i) => {
          const question = language === 'am' ? faq.question.am : language === 'or' ? faq.question.or : faq.question.en
          const answer = language === 'am' ? faq.answer.am : language === 'or' ? faq.answer.or : faq.answer.en
          const isOpen = openId === faq._id

          return (
            <motion.div key={faq._id || i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors" onClick={() => setOpenId(isOpen ? null : (faq._id || String(i)))} aria-expanded={isOpen}>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{question}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0" aria-hidden>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
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
    </div>
  )

  if (compact) return content

  return <div className="section-padding bg-gray-50/50 dark:bg-gray-900/30">{content}</div>
}
