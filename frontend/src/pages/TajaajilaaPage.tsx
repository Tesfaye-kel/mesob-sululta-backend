import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, X, CheckCircle2, Circle, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import OfficeCard from '@/components/tajaajila/OfficeCard'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'
import { getOrganizations, getServiceRequirements, type Organization, type Service, type Requirement } from '@/api/tajaajila'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'



// ── Skeleton card for loading state ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-4 h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ── Office Services Modal — inline, no navigation ────────────────────────────
function OrgModal({ id, name, language, onClose }: {
  id: string
  name: { en: string; am: string; or: string }
  language: string
  onClose: () => void
}) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null)
  const [reqs, setReqs] = useState<Record<string, Requirement[]>>({})
  const [loadingReqs, setLoadingReqs] = useState<Record<string, boolean>>({})

  const orgName = language === 'am' ? (name.am || name.or || name.en) : language === 'or' ? (name.or || name.en) : name.en
  const reqLabel = language === 'or' ? 'Wantoota Barbaachisoo' : language === 'am' ? 'ያስፈልጋሉ ሰነዶች' : 'Requirements'
  const hintLabel = language === 'or' ? 'Tajaajila kamiyyuu cuqaasuun wantoota barbaachisoo argadhaa' : language === 'am' ? 'ያስፈልጉ ሰነዶችን ለማየት ማናቸውንም አገልግሎት ጠቅ ያድርጉ' : 'Click any service to see requirements'
  const noSvc = language === 'or' ? 'Tajaajilli hin jiru' : language === 'am' ? 'ምንም አገልግሎቶች የሉም' : 'No services available'
  const noReq = language === 'or' ? 'Barbaachisoonni hin jiran' : language === 'am' ? 'ምንም መስፈርቶች የሉም' : 'No requirements listed'

  useEffect(() => {
    fetch(`${BASE}/services/by-organization/${id}`)
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d) ? d : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [id])

  const handleSvc = useCallback(async (svcId: string) => {
    if (expandedSvc === svcId) { setExpandedSvc(null); return }
    setExpandedSvc(svcId)
    if (reqs[svcId] !== undefined) return
    setLoadingReqs(p => ({ ...p, [svcId]: true }))
    try {
      const data = await getServiceRequirements(svcId)
      setReqs(p => ({ ...p, [svcId]: Array.isArray(data) ? data : [] }))
    } catch { setReqs(p => ({ ...p, [svcId]: [] })) }
    finally { setLoadingReqs(p => ({ ...p, [svcId]: false })) }
  }, [expandedSvc, reqs])

  const svcCount = language === 'or' ? `Tajaajila ${services.length}` : language === 'am' ? `${services.length} አገልግሎቶች` : `${services.length} Services`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }} transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1a2744] dark:bg-gray-800 px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 shrink-0">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
                  {language === 'or' ? 'WAAJJIRA' : language === 'am' ? 'ቢሮ' : 'OFFICE'}
                </p>
                <h2 className="text-lg font-bold text-white">{orgName}</h2>
                <span className="text-sm text-gray-300">{svcCount}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white shrink-0 mt-0.5">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-xs text-yellow-300/80 flex items-center gap-1.5"><span>👆</span>{hintLabel}</p>
        </div>
        {/* Services */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-green" /></div>}
          {!loading && services.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">{noSvc}</div>}
          {!loading && services.map(svc => {
            const svcName = language === 'am' ? (svc.name.am || svc.name.or || svc.name.en) : language === 'or' ? (svc.name.or || svc.name.en) : svc.name.en
            const isOpen = expandedSvc === svc._id
            const rList = reqs[svc._id]
            return (
              <div key={svc._id} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => handleSvc(svc._id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-[#1a2744] dark:bg-brand-green/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-white dark:text-brand-green" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{svcName}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-green shrink-0">{reqLabel} →</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                        {loadingReqs[svc._id] ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand-green" /></div>
                          : !rList || rList.length === 0 ? <p className="text-sm text-gray-400 py-3 text-center">{noReq}</p>
                          : <div className="space-y-2 mt-2">
                              {[...rList].sort((a, b) => a.sequenceNo - b.sequenceNo).map(req => {
                                const txt = language === 'am' ? (req.requirementText.am || req.requirementText.or || req.requirementText.en) : language === 'or' ? (req.requirementText.or || req.requirementText.en) : req.requirementText.en
                                return (
                                  <div key={req._id} className={cn('flex items-start gap-3 p-3 rounded-lg', req.isMandatory ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700')}>
                                    {req.isMandatory ? <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />}
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{txt}</p>
                                  </div>
                                )
                              })}
                            </div>
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function TajaajilaaPage() {
  const { t, language } = useLanguage()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgModal, setOrgModal] = useState<{ id: string; name: { en: string; am: string; or: string } } | null>(null)

  // ── Localized strings ──────────────────────────────────────────────────────
  const pageTitle    = language === 'am' ? 'አገልግሎት በቢሮ'      : language === 'or' ? 'Tajaajila Waajjiraatiin'      : 'Service by Office'
  const pageSubtitle = language === 'am' ? 'አገልግሎቶችን በቢሮ/ድርጅት ያስሱ' : language === 'or' ? 'Tajaajiloota waajjiraan/orgaanizaashiniin barbaadi' : 'Browse services by office/organization'
  const officeHeading = language === 'am' ? 'አገልግሎቶች በቢሮ' : language === 'or' ? 'Tajaajiloota Waajjiraa'       : 'Services by Office'
  const loadingLabel  = language === 'am' ? 'በመጫን ላይ...'   : language === 'or' ? "Fe'aa jira..."                  : 'Loading...'
  const serverErrTitle = language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' : language === 'or' ? 'Server waliin walqunnamuu hin dandeenye' : 'Could not connect to server'
  const serverErrDesc  = language === 'am' ? 'ሰርቨሩ ቆሟል። ሙሉ አስተዳዳሪ ሰርቨሩን ያስጀምር።' : language === 'or' ? 'Backend server dhaabatee jira. Bulchiinsi server jalqabsiisuu qaba.' : 'The backend server is stopped. An admin needs to start the server.'
  const retryLabel     = language === 'am' ? 'እንደገና ሞክር'   : language === 'or' ? "Irra deebi'ii yaalii"           : 'Try Again'
  const backLabel      = language === 'or' ? 'Foddaadhaan Deebi\'i' : language === 'am' ? 'በፎዳ ወደ ሌሎቹ ተመለስ' : 'Back to Service by Window'

  const load = () => {
    setLoading(true)
    setError(null)
    getOrganizations()
      .then(data => {
        setOrgs(data)
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = `${pageTitle} | MESOB Sululta`
    load()
  }, [language])

  return (
    <div className="section-padding">
      <div className="container-gov">

        {/* Back to Service by Window */}
        <Link
          to="/tajaajila"
          className="inline-flex items-center gap-2 text-sm text-brand-green hover:text-brand-green/80 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <AnimatedHeading as="h1" className="text-center mb-2">{pageTitle}</AnimatedHeading>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-8">{pageSubtitle}</p>

        {/* ── Office section ── */}
        <section aria-label={officeHeading}>

          {/* Skeleton grid while loading */}
          {loading && <LoadingGrid />}

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
              {orgs.map((org, idx) => (
                <CardItem key={org._id}>
                  <OfficeCard
                    id={org._id}
                    name={org.name}
                    serviceCount={org.serviceCount}
                    index={idx}
                    onClick={() => setOrgModal({ id: org._id, name: org.name })}
                  />
                </CardItem>
              ))}
            </CardGrid>
          )}

          {!loading && !error && orgs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>{language === 'am' ? 'ምንም ቢሮዎች አልተገኙም' : language === 'or' ? 'Waajjiraaleen hin argamne' : 'No offices found'}</p>
            </div>
          )}
        </section>

      </div>

      {/* Inline office services modal — no navigation */}
      <AnimatePresence>
        {orgModal && (
          <OrgModal
            id={orgModal.id}
            name={orgModal.name}
            language={language}
            onClose={() => setOrgModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
