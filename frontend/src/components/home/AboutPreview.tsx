import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Eye, Heart } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Button } from '@/components/ui/Button'

export default function AboutPreview() {
  const { t } = useLanguage()

  const cards = [
    {
      icon: Target,
      label: t.about.mission,
      color: 'bg-brand-green/10 dark:bg-brand-green/20 text-brand-green dark:text-green-400',
      text: 'Tajaajila mootummaa qulqulluu, saffisaa fi walqixa ta\'e kennuudhaan misooma qabeenya namaa guddisuu.',
    },
    {
      icon: Eye,
      label: t.about.vision,
      color: 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400',
      text: 'Wiirtuu Misooma Qabeenya Namaa Oromiyaa kan teknooloojii irratti hundaa\'e fi hawaasni itti amanu ta\'uu.',
    },
    {
      icon: Heart,
      label: t.about.values,
      color: 'bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold dark:text-yellow-400',
      text: 'Bilisummaa, Iftoomina, Amantaa, Ga\'umsa fi Tajaajila Lammiilee Xiyyeeffate.',
    },
  ]

  return (
    <section className="section-padding" aria-label="About MESOB preview">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="section-title">{t.about.title}</h2>
            <p className="section-subtitle">{t.about.subtitle}</p>
          </div>
          <Link to="/about">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.common.viewMore}
            </Button>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{card.label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
