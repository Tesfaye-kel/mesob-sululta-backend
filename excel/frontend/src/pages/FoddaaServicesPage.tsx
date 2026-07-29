import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import ServiceCard from '@/components/tajaajila/ServiceCard'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import EmptyState from '@/components/tajaajila/EmptyState'
import { getWindowServices, type Service } from '@/api/tajaajila'

const ORDINALS: Record<number, string> = {
  1: 'Foddaa Tokkoffaa',     2: 'Foddaa Lammaffaa',
  3: 'Foddaa Sadaffaa',      4: 'Foddaa Afraffaa',
  5: 'Foddaa Shanaffaa',     6: 'Foddaa Jahaffaa',
  7: 'Foddaa Torbaffaa',     8: 'Foddaa Saddeetaffaa',
  9: 'Foddaa Sagalaffaa',   10: 'Foddaa Kurnaffaa',
  11: 'Foddaa Kudha Tokkoffaa',
}

export default function FoddaaServicesPage() {
  // windowId is the window NUMBER (1–11) — not a Mongo _id
  const { windowId } = useParams<{ windowId: string }>()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const windowNumber = Number(windowId)
  const windowLabel = ORDINALS[windowNumber] ?? `Foddaa ${windowId}`
  const fromPath = `/tajaajila/foddaa/${windowId}`

  useEffect(() => {
    if (!windowId) return
    document.title = `${windowLabel} | MESOB Sululta`
    setLoading(true)
    setError(null)

    // Pass the number directly — backend supports lookup by number
    getWindowServices(windowId)
      .then(svcs => setServices(svcs))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [windowId, windowLabel])

  return (
    <>
      <PageHeader
        title={windowLabel}
        subtitle="Tajaajiloota Fooddaaf Kaa'ame"
        breadcrumbs={[
          { label: 'Mana', href: '/' },
          { label: 'Tajaajiloota', href: '/tajaajila' },
          { label: windowLabel },
        ]}
      />

      <div className="section-padding">
        <div className="container-gov">
          <Breadcrumb crumbs={[
            { label: 'Tajaajiloota', to: '/tajaajila' },
            { label: windowLabel },
          ]} />

          <AnimatedHeading as="h2" className="mb-2">
            {windowLabel}
          </AnimatedHeading>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
            Tajaajiloota Fooddaaf Kaa&apos;ame — tajaajila {services.length}
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
              <button
                onClick={() => { setLoading(true); setError(null); getWindowServices(windowId!).then(setServices).catch(e => setError(e.message)).finally(() => setLoading(false)) }}
                className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
              >
                Irra deebi'ii yaalii
              </button>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <EmptyState
              title="Tajaajilli hin argamne."
              description="Foddaa kana jalatti tajaajilli hin galmeeffamne."
            />
          )}

          {!loading && !error && services.length > 0 && (
            <CardGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <CardItem key={svc._id}>
                  <ServiceCard
                    id={svc._id}
                    nameOr={svc.name.or || svc.name.en}
                    officeName={
                      svc.organization
                        ? (svc.organization.name.or || svc.organization.name.en)
                        : undefined
                    }
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

