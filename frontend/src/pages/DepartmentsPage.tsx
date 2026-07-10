import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, Clock } from 'lucide-react'
import * as Icons from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'
import { departments } from '@/data/departments'

const colorMap: Record<string, string> = {
  'brand-green': 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light border-brand-green/20',
  'brand-blue': 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300 border-brand-blue/20',
  'brand-gold': 'bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 border-brand-gold/20',
}

export default function DepartmentsPage() {
  const { t, language } = useLanguage()

  useEffect(() => {
    document.title = `Departments | MESOB Center – Sululta Branch`
  }, [])

  return (
    <>
      <PageHeader
        title={t.nav.departments}
        subtitle="Each department is dedicated to delivering excellent services in its area of expertise."
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.departments }]}
      />

      <div className="section-padding">
        <div className="container-gov">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((dept) => {
              const name = language === 'am' ? dept.nameAm : language === 'or' ? dept.nameOr : dept.nameEn
              const description = language === 'am' ? dept.descriptionAm : language === 'or' ? dept.descriptionOr : dept.descriptionEn
              const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[dept.icon] || Icons.Building

              return (
                <StaggerItem key={dept.id}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all duration-300 group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[dept.color]} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6" aria-hidden />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Key Responsibilities
                      </p>
                      <ul className="space-y-1" role="list">
                        {dept.responsibilities.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" aria-hidden />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3.5 w-3.5 text-brand-green shrink-0" aria-hidden />
                        <span className="truncate">{dept.officeHours.split(',')[0]}</span>
                      </div>
                      <a href={`tel:${dept.phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-green-light transition-colors">
                        <Phone className="h-3.5 w-3.5 text-brand-blue shrink-0" aria-hidden />
                        <span className="truncate">{dept.phone}</span>
                      </a>
                      <a href={`mailto:${dept.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-green-light transition-colors">
                        <Mail className="h-3.5 w-3.5 text-brand-gold shrink-0" aria-hidden />
                        <span className="truncate">Email</span>
                      </a>
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </>
  )
}


