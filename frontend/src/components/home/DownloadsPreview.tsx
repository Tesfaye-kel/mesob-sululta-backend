import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, Download } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { downloads } from '@/data/downloads'

export default function DownloadsPreview() {
  const { t, language } = useLanguage()
  const featured = downloads.slice(0, 4)

  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/30" aria-label="Downloads preview">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="section-title">{t.downloads.title}</h2>
            <p className="section-subtitle">{t.downloads.subtitle}</p>
          </div>
          <Link to="/downloads">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.common.viewMore}
            </Button>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featured.map((doc, i) => {
            const title = language === 'am' ? doc.titleAm : language === 'or' ? doc.titleOr : doc.titleEn
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="h-10 w-10 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.fileSize} · {doc.fileType}</p>
                </div>
                <a
                  href="#"
                  className="shrink-0 p-2 rounded-lg text-brand-green dark:text-green-400 hover:bg-brand-green/10 transition-colors"
                  aria-label={`Download ${title}`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                </a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
