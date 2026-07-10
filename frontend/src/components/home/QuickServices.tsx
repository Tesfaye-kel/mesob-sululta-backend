import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import ServiceCard from '@/components/services/ServiceCard'
import { services } from '@/data/services'
import { Button } from '@/components/ui/Button'

export default function QuickServices() {
  const { t } = useLanguage()
  const featured = services.filter(s => s.featured).slice(0, 6)

  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/50" aria-label="Featured services">
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="gov-badge bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light mb-3">
              {t.services.title}
            </span>
            <h2 className="section-title">{t.services.title}</h2>
            <p className="section-subtitle">{t.services.subtitle}</p>
          </div>
          <Link to="/services">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t.services.viewAll}
            </Button>
          </Link>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((service) => (
            <StaggerItem key={service.id}>
              <ServiceCard service={service} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
