import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
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

  const filtered = services.filter(s => {
    const matchCat = category === 'All' || s.category === category
    const matchSearch = !search || s.titleEn.toLowerCase().includes(search.toLowerCase()) || s.descriptionEn.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <PageHeader
        title={t.services.title}
        subtitle={t.services.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.services }]}
      />

      <div className="section-padding">
        <div className="container-gov">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                aria-label="Search services"
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
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Showing {filtered.length} service{filtered.length !== 1 ? 's' : ''}
            {category !== 'All' && ` in ${category}`}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No services found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
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
    </>
  )
}


