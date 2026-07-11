import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import ServiceCard from '@/components/tajaajila/ServiceCard'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import EmptyState from '@/components/tajaajila/EmptyState'
import { getOrganizationById, getOrganizationServices, type Organization, type Service } from '@/api/tajaajila'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OfficeServicesPage() {
  const { officeId } = useParams<{ officeId: string }>()
  const { language, t } = useLanguage()
  const [org, setOrg] = useState<Organization | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fromPath = `/tajaajila/office/${officeId}`

  const orgName = org
    ? (language === 'am' ? (org.name.am || org.name.or || org.name.en)
     : language === 'or' ? (org.name.or || org.name.en)
     : org.name.en)
    : ''

  const fallbackOffice = language === 'am' ? 'ቢሮ' : language === 'or' ? 'Waajjira' : 'Office'

  const subtitle =
    language === 'am' ? `ለዚህ ቢሮ ያሉ አገልግሎቶች — ${services.length}` :
    language === 'or' ? `Tajaajiloota Waajjiraa Kaa'ame — tajaajila ${services.length}` :
                        `Services for this office — ${services.length}`

  const emptyTitle = language === 'am' ? 'አገልግሎቶች አልተገኙም' : language === 'or' ? 'Tajaajilli hin argamne.' : 'No services found'
  const emptyDesc  = language === 'am' ? 'ለዚህ ቢሮ አገልግሎቶች አልተመዘገቡም' : language === 'or' ? 'Waajjira kana jalatti tajaajilli hin galmeeffamne.' : 'No services registered for this office yet.'
  const serverErr  = language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' : language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' : 'Could not connect to server.'
  const servicesNav = language === 'am' ? 'አገልግሎቶች' : language === 'or' ? 'Tajaajilaalee' : 'Services'

  useEffect(() => {
    if (!officeId) return
    setLoading(true)
    setError(null)
    Promise.all([getOrganizationById(officeId), getOrganizationServices(officeId)])
      .then(([o, svcs]) => { setOrg(o); setServices(svcs); document.title = `${o.name.or || o.name.en} | MESOB` })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }, [officeId, language])

  return (
    <>
      <PageHeader
        title={orgName || fallbackOffice}
        subtitle={subtitle}
        breadcrumbs={[
          { label: t.common.home, href: '/' },
          { label: servicesNav, href: '/tajaajila' },
          { label: orgName || fallbackOffice },
        ]}
      />

      <div className="section-padding">
        <div className="container-gov">
          <Breadcrumb crumbs={[
            { label: servicesNav, to: '/tajaajila' },
            { label: orgName || fallbackOffice },
          ]} />

          <AnimatedHeading as="h2" className="mb-2">{orgName || fallbackOffice}</AnimatedHeading>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">{subtitle}</p>

          {loading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label={t.common.loading} /></div>}

          {error && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
              <p className="text-sm text-gray-600 dark:text-gray-400">{serverErr}</p>
            </div>
          )}

          {!loading && !error && services.length === 0 && <EmptyState title={emptyTitle} description={emptyDesc} />}

          {!loading && !error && services.length > 0 && (
            <CardGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <CardItem key={svc._id}>
                  <ServiceCard id={svc._id} nameOr={svc.name.or || svc.name.en} fromPath={fromPath} />
                </CardItem>
              ))}
            </CardGrid>
          )}
        </div>
      </div>
    </>
  )
}
