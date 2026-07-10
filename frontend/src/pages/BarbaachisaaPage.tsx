import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '@/components/common/PageHeader'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import RequirementList from '@/components/tajaajila/RequirementList'
import { getServiceById, getServiceRequirements, type Service, type Requirement } from '@/api/tajaajila'

export default function BarbaachisaaPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const location = useLocation()

  // from state: the path the user came from (foddaa or office page)
  const fromPath: string = (location.state as { from?: string })?.from ?? '/tajaajila'

  const [service, setService] = useState<Service | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceId) return
    document.title = 'Wantoota Barbaachisoo | MESOB Sululta'
    setLoading(true)
    setError(null)
    Promise.all([getServiceById(serviceId), getServiceRequirements(serviceId)])
      .then(([svc, reqs]) => { setService(svc); setRequirements(reqs) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [serviceId])

  const serviceName = service ? (service.name.or || service.name.en) : 'Tajaajila'

  // Build a human-readable back label
  const backLabel = fromPath.includes('foddaa') ? 'Foddaa' : 'Waajjira'

  return (
    <>
      <PageHeader
        title="Wantoota Barbaachisoo"
        breadcrumbs={[
          { label: 'Mana', href: '/' },
          { label: 'Tajaajiloota', href: '/tajaajila' },
          { label: backLabel, href: fromPath },
          { label: 'Barbaachisoo' },
        ]}
      />

      <div className="section-padding">
        <div className="container-gov max-w-3xl">
          <Breadcrumb crumbs={[
            { label: 'Tajaajiloota', to: '/tajaajila' },
            { label: backLabel, to: fromPath },
            { label: 'Barbaachisoo' },
          ]} />

          {/* Service name */}
          <AnimatedHeading as="h2" className="mb-1">
            Wantoota Barbaachisoo
          </AnimatedHeading>

          {service && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed"
            >
              {serviceName}
            </motion.p>
          )}

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label="Fe'aa jira" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 py-6">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <RequirementList requirements={requirements} />
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}

