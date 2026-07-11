import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MessageSquare, ThumbsUp, AlertCircle, Lightbulb } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'

export default function FeedbackPreview() {
  const { t } = useLanguage()

  const options = [
    { icon: ThumbsUp,     label: t.feedback.compliment, color: 'bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-green-400' },
    { icon: AlertCircle,  label: t.feedback.complaint,  color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
    { icon: Lightbulb,    label: t.feedback.suggestion, color: 'bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold dark:text-yellow-400' },
    { icon: MessageSquare,label: t.feedback.rate,       color: 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400' },
  ]

  return (
    <section className="section-padding" aria-label="Feedback preview">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="text-center mb-10">
          <h2 className="section-title text-center">{t.feedback.title}</h2>
          <p className="section-subtitle mx-auto text-center">{t.feedback.subtitle}</p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {options.map((opt, i) => {
            const Icon = opt.icon
            return (
              <motion.div
                key={opt.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Link
                  to="/feedback"
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group ${opt.color}`}
                >
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-current/10 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="text-sm font-semibold text-center leading-snug text-gray-800 dark:text-gray-200">
                    {opt.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <AnimatedSection variant="fadeUp" delay={0.2} className="text-center">
          <Link to="/feedback">
            <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.feedback.submit}
            </Button>
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}
