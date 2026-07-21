import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import ServiceCard from '@/components/services/ServiceCard'
import { services, serviceCategories } from '@/data/services'
import { useLanguage } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const { t } = useLanguage()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.title = `Services | MESOB Center – Sululta Branch`
  }, [])

  const categoryLabels: Record<string, string> = {
    All: t.services.categories.all,
    Identity: t.services.categories.identity,
    Business: t.services.categories.business,
    Tax: t.services.categories.tax,
    Transport: t.services.categories.transport,
    Land: t.services.categories.land,
    Civil: t.services.categories.civil,
    Digital: t.services.categories.digital,
    Legal: t.services.categories.legal,
    Municipal: t.services.categories.municipal,
    Support: t.services.categories.support,
  }

  const filtered = services.filter(s => {
    const matchCat = category === 'All' || s.category === category
    const query = search.toLowerCase()
    const searchableText = [s.titleEn, s.titleAm, s.titleOr, s.descriptionEn, s.descriptionAm, s.descriptionOr].join(' ').toLowerCase()
    const matchSearch = !query || searchableText.includes(query)
    return matchCat && matchSearch
  })

  return (
    <div className="section-padding">
      <div className="container-gov">
        <AnimatedHeading as="h1" className="text-center mb-8">{t.services.title}</AnimatedHeading>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={t.services.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label={t.common.search}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  category === cat
                    ? 'bg-brand-green text-white shadow-gov'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green dark:hover:border-brand-green hover:text-brand-green dark:hover:text-brand-green-light'
                )}
                aria-pressed={category === cat}
              >
                {categoryLabels[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {category === 'All'
            ? t.services.resultsShowing.replace('{count}', filtered.length.toString())
            : t.services.resultsInCategory.replace('{count}', filtered.length.toString()).replace('{category}', categoryLabels[category] ?? category)}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.services.noServicesFound}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t.services.noServicesFoundDescription}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}