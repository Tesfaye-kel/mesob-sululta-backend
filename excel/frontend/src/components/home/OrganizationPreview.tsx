import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, User } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'

const leaders = [
  { titleEn: 'Branch Manager', titleOr: 'Hooggansa Damee', titleAm: 'የቅርንጫፍ ሥራ አስኪያጅ', color: 'bg-brand-green' },
  { titleEn: 'Deputy Manager', titleOr: 'Itti Aanaa Hooggansa', titleAm: 'ምክትል ሥራ አስኪያጅ', color: 'bg-brand-blue' },
  { titleEn: 'ICT Coordinator', titleOr: 'Qindeessaa ICT', titleAm: 'የICT ቅንጅት', color: 'bg-brand-gold' },
  { titleEn: 'Finance Officer', titleOr: 'Ogeessa Maallaqaa', titleAm: 'የፋይናንስ ኦፊሰር', color: 'bg-purple-600' },
]

export default function OrganizationPreview() {
  const { t, language } = useLanguage()

  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/30" aria-label="Organization preview">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="section-title">{t.organization.title}</h2>
            <p className="section-subtitle">{t.organization.subtitle}</p>
          </div>
          <Link to="/organization">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.common.viewMore}
            </Button>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {leaders.map((leader, i) => (
            <motion.div
              key={leader.titleEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${leader.color}`}>
                <User className="h-7 w-7 text-white" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                {language === 'am' ? leader.titleAm : language === 'or' ? leader.titleOr : leader.titleEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
