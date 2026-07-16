import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import ServiceCard from '@/components/services/ServiceCard'
import { services, serviceCategories } from '@/data/services'
import { useLanguage } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/Input'
import AnimatedSection from '@/components/common/AnimatedSection'
import { cn } from '@/lib/utils'

interface ServicesSectionProps {
  compact?: boolean
  showHeader?: boolean
}

export default function ServicesSection({ compact = false, showHeader = true }: ServicesSectionProps) {
  const { t } = useLanguage()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = services.filter(s => {
    const matchCat = category === 'All' || s.category === category
    const matchSearch = !search || s.titleEn.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const content = (
    <div className="container-gov">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light mb-3">
            Government Services
          </span>
          <h2 className="section-title">{t.services.title}</h2>
          <p className="section-subtitle mx-auto">{t.services.subtitle}</p>
        </AnimatedSection>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>
        <div className="flex flex-wrap gap-2">
          {serviceCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', category === cat ? 'bg-brand-green text-white shadow-gov' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green dark:hover:text-brand-green-light')}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((service, i) => (
          <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
            <ServiceCard service={service} />
          </motion.div>
        ))}
      </div>
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}
