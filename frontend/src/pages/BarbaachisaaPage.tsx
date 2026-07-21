import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import RequirementList from '@/components/tajaajila/RequirementList'
import { getServiceById, getServiceRequirements, type Service, type Requirement } from '@/api/tajaajila'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BarbaachisaaPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const location = useLocation()
  const { language, t } = useLanguage()

  const fromPath: string = (location.state as { from?: string })?.from ?? '/tajaajila'

  const [service, setService] = useState<Service | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Localized strings
  const pageTitle =
    language === 'am' ? 'ያስፈልጋሉ ሰነዶች' :
    language === 'or' ? 'Wantoota Barbaachisoo' :
                        'Requirements'

  const backLabel =
    fromPath.includes('foddaa')
      ? (language === 'am' ? 'ፎዳ' : language === 'or' ? 'Foddaa' : 'Window')
      : (language === 'am' ? 'ቢሮ' : language === 'or' ? 'Waajjira' : 'Office')

  const servicesNav = language === 'am' ? 'አገልግሎቶች' : language === 'or' ? 'Tajaajilaalee' : 'Services'

  const serverErr =
    language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' :
    language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' :
                        'Could not connect to server.'

  const serviceName = service
    ? (language === 'am' ? (service.name.am || service.name.or || service.name.en)
     : language === 'or' ? (service.name.or || service.name.en)
     : service.name.en)
    : ''

  useEffect(() => {
    if (!serviceId) return
    document.title = `${pageTitle} | MESOB Sululta`
    setLoading(true)
    setError(null)
    Promise.all([getServiceById(serviceId), getServiceRequirements(serviceId)])
      .then(([svc, reqs]) => { setService(svc); setRequirements(reqs) })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }, [serviceId, language])

  return (
    <div className="section-padding">
      <div className="container-gov max-w-3xl">
        <Breadcrumb crumbs={[
          { label: servicesNav, to: '/tajaajila' },
          { label: backLabel, to: fromPath },
          { label: pageTitle },
        ]} />

        <AnimatedHeading as="h2" className="mb-1 mt-4">{pageTitle}</AnimatedHeading>

        {service && (
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed"
          >
            {serviceName}
          </motion.p>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label={t.common.loading} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 py-6">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-sm">{serverErr}</span>
          </div>
        )}

        {!loading && !error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <RequirementList requirements={requirements} />
          </motion.div>
        )}
      </div>
    </div>
  )
}