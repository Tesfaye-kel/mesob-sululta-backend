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
  const { t, language } = useLanguage()
  const [windows, setWindows] = useState<WindowSummary[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Localized strings ──────────────────────────────────────────────────────
  const pageTitle    = language === 'am' ? 'አገልግሎቶች'      : language === 'or' ? 'Tajaajilaalee'      : 'Services'
  const pageSubtitle = language === 'am' ? 'ፎዳ ወይም ቢሮ በማንኛቸውም ይፈልጉ' : language === 'or' ? 'Foddaadhaan ykn waajjirraan barbaadi' : 'Browse by service window or office'
  const foddaaHeading = language === 'am' ? 'አገልግሎቶች በፎዳ' : language === 'or' ? 'Tajaajiloota Foddaadhaan Bahe' : 'Services by Window'
  const officeHeading = language === 'am' ? 'አገልግሎቶች በቢሮ' : language === 'or' ? 'Tajaajiloota Waajjiraa'       : 'Services by Office'
  const loadingLabel  = language === 'am' ? 'በመጫን ላይ...'   : language === 'or' ? "Fe'aa jira..."                  : 'Loading...'
  const serverErrTitle = language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' : language === 'or' ? 'Server waliin walqunnamuu hin dandeenye' : 'Could not connect to server'
  const serverErrDesc  = language === 'am' ? 'ሰርቨሩ ቆሟል። ሙሉ አስተዳዳሪ ሰርቨሩን ያስጀምር።' : language === 'or' ? 'Backend server dhaabatee jira. Bulchiinsi server jalqabsiisuu qaba.' : 'The backend server is stopped. An admin needs to start the server.'
  const retryLabel     = language === 'am' ? 'እንደገና ሞክር'   : language === 'or' ? "Irra deebi'ii yaalii"           : 'Try Again'

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([getWindows(), getOrganizations()])
      .then(([w, o]) => { setWindows(w); setOrgs(o) })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = `${pageTitle} | MESOB Sululta`
    load()
  }, [language])

  return (
    <>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumbs={[{ label: t.common.home, href: '/' }, { label: pageTitle }]}
      />

      <div className="section-padding">
        <div className="container-gov space-y-16">

          {/* ── Foddaa section ── */}
          <section aria-label={foddaaHeading}>
            <AnimatedHeading as="h2" className="mb-6 text-center" delay={0}>
              {foddaaHeading}
            </AnimatedHeading>

            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label={loadingLabel} />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{serverErrTitle}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">{serverErrDesc}</p>
                </div>
                <button
                  onClick={load}
                  className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                  {retryLabel}
                </button>
              </div>
            )}

            {!loading && !error && (
              <CardGrid>
                {windows.map(win => (
                  <CardItem key={win._id}>
                    <FoddaaCard id={win._id} number={win.number} serviceCount={win.serviceCount} />
                  </CardItem>
                ))}
              </CardGrid>
            )}
          </section>

          {/* ── Office section ── */}
          <section aria-label={officeHeading}>
            <AnimatedHeading as="h2" className="mb-6 text-center" delay={0}>
              {officeHeading}
            </AnimatedHeading>

            {!loading && !error && (
              <CardGrid>
                {orgs.map(org => (
                  <CardItem key={org._id}>
                    <OfficeCard
                      id={org._id}
                      name={org.name}
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
