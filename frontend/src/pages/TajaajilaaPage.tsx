import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import FoddaaCard from '@/components/tajaajila/FoddaaCard'
import OfficeCard from '@/components/tajaajila/OfficeCard'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import { getWindows, getOrganizations, type WindowSummary, type Organization } from '@/api/tajaajila'
import { useLanguage } from '@/contexts/LanguageContext'

export default function TajaajilaaPage() {
  const { t } = useLanguage()
  const [windows, setWindows] = useState<WindowSummary[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([getWindows(), getOrganizations()])
      .then(([w, o]) => { setWindows(w); setOrgs(o) })
      .catch(() => setError('Tajaajila fe\'achuun hin danda\'amne. Server irraa deebii hin argamne — server akka naannawu mirkaneessi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Tajaajiloota | MESOB Sululta'
    load()
  }, [])

  return (
    <>
      <PageHeader
        title="Tajaajiloota"
        subtitle="Tajaajila foddaadhaan ykn waajjirraan barbaadi"
        breadcrumbs={[{ label: t.common.home, href: '/' }, { label: 'Tajaajiloota' }]}
      />

      <div className="section-padding">
        <div className="container-gov space-y-16">

          {/* ── Foddaa section ── */}
          <section aria-label="Tajaajiloota Foddaadhaan">
            <AnimatedHeading as="h2" className="mb-6 text-center" delay={0}>
              Tajaajiloota Foddaadhaan Bahe
            </AnimatedHeading>

            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label="Fe'aa jira" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Server waliin walqunnamuu hin dandeenye
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Backend server dhaabatee jira. Bulchiinsi server jalqabsiisuu qaba.
                  </p>
                </div>
                <button
                  onClick={load}
                  className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                  Irra deebi'ii yaalii
                </button>
              </div>
            )}

            {!loading && !error && (
              <CardGrid>
                {windows.map(win => (
                  <CardItem key={win._id}>
                    <FoddaaCard
                      id={win._id}
                      number={win.number}
                      serviceCount={win.serviceCount}
                    />
                  </CardItem>
                ))}
              </CardGrid>
            )}
          </section>

          {/* ── Waajjiraa section — identical animation pattern to Foddaa ── */}
          <section aria-label="Tajaajiloota Waajjiraa">
            <AnimatedHeading as="h2" className="mb-6 text-center" delay={0}>
              Tajaajiloota Waajjiraa
            </AnimatedHeading>

            {!loading && !error && (
              <CardGrid>
                {orgs.map(org => (
                  <CardItem key={org._id}>
                    <OfficeCard
                      id={org._id}
                      nameOr={org.name.or || org.name.en}
                      serviceCount={org.serviceCount}
                    />
                  </CardItem>
                ))}
              </CardGrid>
            )}
          </section>

        </div>
      </div>
    </>
  )
}


