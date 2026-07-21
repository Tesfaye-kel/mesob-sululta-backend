import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import ServiceCard from '@/components/tajaajila/ServiceCard'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import EmptyState from '@/components/tajaajila/EmptyState'
import { getWindowServices, type Service } from '@/api/tajaajila'
import { useLanguage } from '@/contexts/LanguageContext'

const ORDINALS_OR: Record<number, string> = {
  1: 'Foddaa Tokkoffaa', 2: 'Foddaa Lammaffaa', 3: 'Foddaa Sadaffaa',
  4: 'Foddaa Afraffaa',  5: 'Foddaa Shanaffaa',  6: 'Foddaa Jahaffaa',
  7: 'Foddaa Torbaffaa', 8: 'Foddaa Saddeetaffaa', 9: 'Foddaa Sagalaffaa',
  10: 'Foddaa Kurnaffaa', 11: 'Foddaa Kudha Tokkoffaa',
}
const ORDINALS_AM: Record<number, string> = {
  1: 'ፎዳ አንደኛ', 2: 'ፎዳ ሁለተኛ', 3: 'ፎዳ ሦስተኛ', 4: 'ፎዳ አራተኛ',
  5: 'ፎዳ አምስተኛ', 6: 'ፎዳ ስድስተኛ', 7: 'ፎዳ ሰባተኛ', 8: 'ፎዳ ስምንተኛ',
  9: 'ፎዳ ዘጠነኛ', 10: 'ፎዳ አስረኛ', 11: 'ፎዳ አስራ አንደኛ',
}
const ORDINALS_EN: Record<number, string> = {
  1: 'Window 1', 2: 'Window 2', 3: 'Window 3', 4: 'Window 4',
  5: 'Window 5', 6: 'Window 6', 7: 'Window 7', 8: 'Window 8',
  9: 'Window 9', 10: 'Window 10', 11: 'Window 11',
}

export default function FoddaaServicesPage() {
  const { windowId } = useParams<{ windowId: string }>()
  const { language, t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const windowNumber = Number(windowId)
  const windowLabel =
    language === 'am' ? (ORDINALS_AM[windowNumber] ?? `ፎዳ ${windowId}`) :
    language === 'or' ? (ORDINALS_OR[windowNumber] ?? `Foddaa ${windowId}`) :
                        (ORDINALS_EN[windowNumber] ?? `Window ${windowId}`)

  const fromPath = `/tajaajila/foddaa/${windowId}`

  const subtitle =
    language === 'am' ? `ለዚህ ፎዳ ያሉ አገልግሎቶች — ${services.length}` :
    language === 'or' ? `Tajaajiloota Fooddaaf Kaa'ame — tajaajila ${services.length}` :
                        `Services for this window — ${services.length}`

  const emptyTitle =
    language === 'am' ? 'አገልግሎቶች አልተገኙም' :
    language === 'or' ? 'Tajaajilli hin argamne.' : 'No services found'

  const emptyDesc =
    language === 'am' ? 'ለዚህ ፎዳ አገልግሎቶች አልተመዘገቡም' :
    language === 'or' ? 'Foddaa kana jalatti tajaajilli hin galmeeffamne.' :
                        'No services registered for this window yet.'

  const serverErr =
    language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' :
    language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' :
                        'Could not connect to server.'

  const retryLabel = language === 'am' ? 'እንደገና ሞክር' : language === 'or' ? "Irra deebi'ii yaalii" : 'Try Again'

  useEffect(() => {
    if (!windowId) return
    document.title = `${windowLabel} | MESOB Sululta`
    setLoading(true)
    setError(null)
    getWindowServices(windowId)
      .then(setServices)
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }, [windowId, language])

  return (
    <div className="section-padding">
      <div className="container-gov">
        <Breadcrumb crumbs={[
          { label: language === 'am' ? 'አገልግሎቶች' : language === 'or' ? 'Tajaajilaalee' : 'Services', to: '/tajaajila' },
          { label: windowLabel },
        ]} />

        <AnimatedHeading as="h2" className="mb-2 mt-4">{windowLabel}</AnimatedHeading>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">{subtitle}</p>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-label={t.common.loading} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
            <p className="text-sm text-gray-600 dark:text-gray-400">{serverErr}</p>
            <button onClick={() => { setLoading(true); setError(null); getWindowServices(windowId!).then(setServices).catch(() => setError('error')).finally(() => setLoading(false)) }}
              className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors">
              {retryLabel}
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDesc} />
        )}

        {!loading && !error && services.length > 0 && (
          <CardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, idx) => (
              <CardItem key={svc._id}>
                <ServiceCard
                  id={svc._id}
                  nameEn={svc.name.en}
                  nameAm={svc.name.am}
                  nameOr={svc.name.or}
                  officeName={svc.organization ? (language === 'am' ? (svc.organization.name.am || svc.organization.name.or || svc.organization.name.en) : language === 'or' ? (svc.organization.name.or || svc.organization.name.en) : svc.organization.name.en) : undefined}
                  fromPath={fromPath}
                  index={idx}
                  style="expanded"
                />
              </CardItem>
            ))}
          </CardGrid>
        )}
      </div>
    </div>
  )
}