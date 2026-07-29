import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import ServiceCard from '@/components/tajaajila/ServiceCard'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import EmptyState from '@/components/tajaajila/EmptyState'
import {
  getOrganizationById,
  getOrganizationServices,
  type Organization,
  type Service,
} from '@/api/tajaajila'

export default function OfficeServicesPage() {
  const { officeId } = useParams<{ officeId: string }>()
  const [org, setOrg] = useState<Organization | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orgName = org ? (org.name.or || org.name.en) : ''
  const fromPath = `/tajaajila/office/${officeId}`

  useEffect(() => {
    if (!officeId) return
    setLoading(true)
    setError(null)
    Promise.all([getOrganizationById(officeId), getOrganizationServices(officeId)])
      .then(([o, svcs]) => {
        setOrg(o)
        setServices(svcs)
        document.title = `${o.name.or || o.name.en} | MESOB Sululta`
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [officeId])

  return (
    <>
      <PageHeader
        title={orgName || 'Waajjira'}
        subtitle="Tajaajiloota Waajjiraa Kaa'ame"
        breadcrumbs={[
          { label: 'Mana', href: '/' },
          { label: 'Tajaajiloota', href: '/tajaajila' },
          { label: orgName || 'Waajjira' },
        ]}
      />

      <div className="section-padding">
        <div className="container-gov">
          <Breadcrumb crumbs={[
            { label: 'Tajaajiloota', to: '/tajaajila' },
            { label: orgName || 'Waajjira' },
          ]} />

          <AnimatedHeading as="h2" className="mb-2">
            {orgName || 'Waajjira'}
          </AnimatedHeading>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
            Tajaajiloota Waajjiraa Kaa&apos;ame — tajaajila {services.length}
          </p>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label="Fe'aa jira" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Server waliin walqunnamuu hin dandeenye. Server naannawa mirkaneessi.
              </p>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <EmptyState
              title="Tajaajilli hin argamne."
              description="Waajjira kana jalatti tajaajilli hin galmeeffamne."
            />
          )}

          {!loading && !error && services.length > 0 && (
            <CardGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <CardItem key={svc._id}>
                  <ServiceCard
                    id={svc._id}
                    nameOr={svc.name.or || svc.name.en}
                    fromPath={fromPath}
                  />
                </CardItem>
              ))}
            </CardGrid>
          )}
        </div>
      </div>
    </>
  )
}

