import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, Layers, ChevronDown, FileText, CheckCircle2, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'
import Breadcrumb from '@/components/tajaajila/Breadcrumb'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Organization {
  _id: string
  name: { en: string; am: string; or: string }
  description: { en: string; am: string; or: string }
  logoUrl: string
  serviceCount: number
}

interface WindowData {
  _id: string
  number: string
  floor: number
  serviceCount: number
  description: { en: string; am: string; or: string }
  organization: { _id: string; name: { en: string; am: string; or: string } }
}

interface WindowGroup {
  floor: number
  windows: WindowData[]
}

interface Service {
  _id: string
  name: { en: string; am: string; or: string }
  description: { en: string; am: string; or: string }
  organization: { _id: string; name: { en: string; am: string; or: string } }
  window: { _id: string; number: string; floor: number } | null
  requiredDocuments: string[]
  fee: number
  processingTime: string
  workingHours: string
  contactPhone: string
}

interface Requirement {
  _id: string
  service: string
  requirementText: { en: string; am: string; or: string }
  notes: { en: string; am: string; or: string }
  isMandatory: boolean
  sequenceNo: number
}

const floorColors = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-amber-500 to-amber-600',
  'from-purple-500 to-purple-600',
  'from-rose-500 to-rose-600',
]

const floorLabels = {
  en: ['Floor 1st', 'Floor 2nd', 'Floor 3rd', 'Floor 4th', 'Floor 5th'],
  am: ['ወለል 1', 'ወለል 2', 'ወለል 3', 'ወለል 4', 'ወለል 5'],
  or: ['Darbii 1ffaa', 'Darbii 2ffaa', 'Darbii 3ffaa', 'Darbii 4ffaa', 'Darbii 5ffaa'],
}

// ── Simple in-memory cache ──────────────────────────────────────────────────
const cache = new Map<string, { data: { organization: Organization; windowGroups: WindowGroup[] }; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: { organization: Organization; windowGroups: WindowGroup[] }) {
  cache.set(key, { data, timestamp: Date.now() })
}

// ── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonRow({ colorClass }: { colorClass: string }) {
  return (
    <div className="animate-pulse">
      <div className={`bg-gradient-to-r ${colorClass} rounded-t-xl px-4 py-3 shadow-md`}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-white/30" />
          <div className="h-5 w-32 rounded bg-white/30" />
        </div>
      </div>
      <div className="rounded-b-xl overflow-hidden border-x border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${colorClass} opacity-50`} />
                <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 mt-8">
      <SkeletonRow colorClass={floorColors[0]} />
      <SkeletonRow colorClass={floorColors[1]} />
      <SkeletonRow colorClass={floorColors[2]} />
    </div>
  )
}

// ── Page Component ───────────────────────────────────────────────────────────
export default function OfficeServicesPage() {
  const { officeId } = useParams<{ officeId: string }>()
  const { language, t } = useLanguage()
  const [searchParams] = useSearchParams()
  const targetWindowId = searchParams.get('window')
  const targetServiceId = searchParams.get('service')
  const [org, setOrg] = useState<Organization | null>(null)
  const [windowGroups, setWindowGroups] = useState<WindowGroup[]>([])
  const [expandedWindow, setExpandedWindow] = useState<string | null>(null)
  const [windowServices, setWindowServices] = useState<Record<string, Service[]>>({})
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [serviceRequirements, setServiceRequirements] = useState<Record<string, Requirement[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const targetWindowRef = useRef<HTMLDivElement>(null)
  const hasAutoExpanded = useRef(false)

  const orgName = org
    ? (language === 'am' ? (org.name.am || org.name.or || org.name.en)
     : language === 'or' ? (org.name.or || org.name.en)
     : org.name.en)
    : ''

  const fallbackOffice = language === 'am' ? 'ቢሮ' : language === 'or' ? 'Waajjira' : 'Office'
  const servicesNav = language === 'am' ? 'አገልግሎቶች' : language === 'or' ? 'Tajaajilaalee' : 'Services'

  useEffect(() => {
    if (!officeId) return

    const cacheKey = `org-windows-${officeId}`
    const cached = getCached(cacheKey)
    if (cached) {
      setOrg(cached.organization)
      setWindowGroups(cached.windowGroups)
      setLoading(false)
      document.title = `${cached.organization.name?.or || cached.organization.name?.en} | MESOB`
      return
    }

    setLoading(true)
    setError(null)
    
    fetch(`${BASE}/organizations/${officeId}/with-windows`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then((data: { organization: Organization; windowGroups: WindowGroup[] }) => {
        setOrg(data.organization)
        setWindowGroups(data.windowGroups)
        setCache(cacheKey, data)
        document.title = `${data.organization.name?.or || data.organization.name?.en} | MESOB`
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }, [officeId, language])

  // Auto-expand target window and service from query params
  useEffect(() => {
    if (loading || !targetWindowId || hasAutoExpanded.current) return

    // Find the window in the groups
    const found = windowGroups.some(g => g.windows.some(w => w._id === targetWindowId))
    if (!found) return

    hasAutoExpanded.current = true

    // Expand the target window
    setExpandedWindow(targetWindowId)

    // Fetch window services if not already loaded
    if (!windowServices[targetWindowId]) {
      fetch(`${BASE}/windows/${targetWindowId}/services`)
        .then(r => r.json())
        .then(data => {
          const services = Array.isArray(data) ? data : []
          setWindowServices(prev => ({ ...prev, [targetWindowId]: services }))
          setCache(`window-services-${targetWindowId}`, { windowGroups: services as unknown as WindowGroup[], organization: {} as Organization })

          // If there's a target service, expand it after services load
          if (targetServiceId && services.some((s: Service) => s._id === targetServiceId)) {
            setTimeout(() => {
              setExpandedService(targetServiceId)
            }, 400)
          }
        })
        .catch(() => {
          setWindowServices(prev => ({ ...prev, [targetWindowId]: [] }))
        })
    } else if (targetServiceId) {
      // Services already loaded, expand the target service
      setTimeout(() => {
        setExpandedService(targetServiceId)
      }, 400)
    }

    // Smooth scroll to the target window after a short delay
    setTimeout(() => {
      const el = document.getElementById(`window-${targetWindowId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 600)
  }, [loading, windowGroups, targetWindowId, targetServiceId, windowServices])

  const handleWindowToggle = useCallback(async (windowId: string) => {
    if (expandedWindow === windowId) {
      setExpandedWindow(null)
      return
    }
    
    setExpandedWindow(windowId)
    setExpandedService(null)
    
    if (!windowServices[windowId]) {
      try {
        const cacheKey = `window-services-${windowId}`
        const cached = getCached(cacheKey)
        if (cached) {
          setWindowServices(prev => ({ ...prev, [windowId]: cached.windowGroups as unknown as Service[] }))
          return
        }
        const res = await fetch(`${BASE}/windows/${windowId}/services`)
        const data = await res.json()
        const services = Array.isArray(data) ? data : []
        setWindowServices(prev => ({ ...prev, [windowId]: services }))
        setCache(cacheKey, { windowGroups: services as unknown as WindowGroup[], organization: {} as Organization })
      } catch {
        setWindowServices(prev => ({ ...prev, [windowId]: [] }))
      }
    }
  }, [expandedWindow, windowServices])

  const handleServiceToggle = useCallback(async (serviceId: string, windowId: string) => {
    if (expandedService === serviceId) {
      setExpandedService(null)
      return
    }
    
    setExpandedService(serviceId)
    
    if (!serviceRequirements[serviceId]) {
      try {
        const cacheKey = `service-requirements-${serviceId}`
        const cached = getCached(cacheKey)
        if (cached) {
          setServiceRequirements(prev => ({ ...prev, [serviceId]: cached.windowGroups as unknown as Requirement[] }))
          return
        }
        const res = await fetch(`${BASE}/services/${serviceId}/requirements`)
        const data = await res.json()
        const reqs = Array.isArray(data) ? data : []
        setServiceRequirements(prev => ({ ...prev, [serviceId]: reqs }))
        setCache(cacheKey, { windowGroups: reqs as unknown as WindowGroup[], organization: {} as Organization })
      } catch {
        setServiceRequirements(prev => ({ ...prev, [serviceId]: [] }))
      }
    }
  }, [expandedService, serviceRequirements])

  return (
    <div className="section-padding">
      <div className="container-gov max-w-5xl">
        <Breadcrumb crumbs={[
          { label: servicesNav, to: '/', state: { scrollTo: 'services' } },
          { label: orgName || fallbackOffice },
        ]} />

        <AnimatedHeading as="h2" className="mb-2 mt-4">{orgName || fallbackOffice}</AnimatedHeading>

        {/* Skeleton loading UI that matches the actual layout */}
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" aria-hidden />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'am' ? 'ሰርቨር ጋር ማገናኘት አልተቻለም' : language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' : 'Could not connect to server.'}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-8">
              {windowGroups.map((group) => (
                <motion.div
                  key={group.floor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: group.floor * 0.1 }}
                >
                  {/* Floor Header — integrated with windows */}
                  <div className={`bg-gradient-to-r ${floorColors[group.floor - 1]} rounded-t-xl px-4 py-3 shadow-md`}>
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-white/80" />
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {language === 'am' ? floorLabels.am[group.floor - 1] : language === 'or' ? floorLabels.or[group.floor - 1] : floorLabels.en[group.floor - 1]}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Windows — attached directly below floor header with no gap */}
                  <div className="rounded-b-xl overflow-hidden border-x border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.windows.map((win) => (
                        <div key={win._id}>
                          {/* Window Header - Clickable */}
                          <button
                            id={`window-${win._id}`}
                            onClick={() => handleWindowToggle(win._id)}
                            className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${floorColors[group.floor - 1]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                {win.number.match(/\d+/)?.[0] || win.number}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">
                                  {language === 'am' ? `ፎዳ ${win.number.match(/\d+/)?.[0] || win.number}ኛ` : language === 'or' ? `Foddaa ${win.number.match(/\d+/)?.[0] || win.number}ffaa` : `Window ${win.number.match(/\d+/)?.[0] || win.number}`}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedWindow === win._id ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                            </motion.div>
                          </button>

                          {/* Expanded Services */}
                          <AnimatePresence>
                            {expandedWindow === win._id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                                  {!windowServices[win._id] && (
                                    <div className="flex justify-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin text-brand-green dark:text-green-400" />
                                    </div>
                                  )}

                                  {windowServices[win._id] && windowServices[win._id].length === 0 && (
                                    <div className="py-8 text-center text-gray-400 dark:text-gray-300 text-sm">
                                      {language === 'am' ? 'ምንም አገልግሎቶች የሉም' : language === 'or' ? 'Tajaajilli hin jiru' : 'No services available'}
                                    </div>
                                  )}

                                {windowServices[win._id] && windowServices[win._id].length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {windowServices[win._id].map((svc) => (
                                        <div key={svc._id} className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                                          <button
                                            onClick={() => handleServiceToggle(svc._id, win._id)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors"
                                          >
                                            <div className="flex items-start gap-3">
                                              <FileText className="h-4 w-4 text-brand-green dark:text-green-400 shrink-0 mt-0.5" />
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {language === 'am' ? (svc.name.am || svc.name.or || svc.name.en)
                                                  : language === 'or' ? (svc.name.or || svc.name.en)
                                                  : svc.name.en}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-brand-green dark:text-green-400 font-medium">
                                                {language === 'am' ? 'ያስፈልጋሉ ሰነዶች' : language === 'or' ? 'Wantoota Barbaachisoo' : 'Requirements'}
                                              </span>
                                              <motion.div animate={{ rotate: expandedService === svc._id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                              <ChevronDown className="h-4 w-4 text-brand-green dark:text-green-400" />
                                              </motion.div>
                                            </div>
                                          </button>

                                          <AnimatePresence>
                                            {expandedService === svc._id && (
                                              <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                              >
                                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                  {!serviceRequirements[svc._id] ? (
                                                    <div className="flex justify-center py-4">
                                                      <Loader2 className="h-5 w-5 animate-spin text-brand-green dark:text-green-400" />
                                                    </div>
                                                  ) : serviceRequirements[svc._id].length === 0 ? (
                                                    <p className="text-sm text-gray-400 dark:text-gray-300 py-3 text-center">
                                                      {language === 'am' ? 'ምንም መስፈርቶች የሉም' : language === 'or' ? 'Barbaachisoonni hin jiran' : 'No requirements listed'}
                                                    </p>
                                                  ) : (
                                                    <div className="space-y-2 mt-2">
                                                      {serviceRequirements[svc._id]
                                                        .sort((a, b) => a.sequenceNo - b.sequenceNo)
                                                        .map((req) => (
                                                          <div key={req._id} className={cn('flex items-start gap-3 p-3 rounded-lg', req.isMandatory ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700')}>
                                                            {req.isMandatory ? <CheckCircle2 className="h-4 w-4 text-brand-green dark:text-green-400 mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-gray-400 dark:text-gray-300 mt-0.5 shrink-0" />}
                                                            <div>
                                                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                {language === 'am' ? (req.requirementText.am || req.requirementText.or || req.requirementText.en) : language === 'or' ? (req.requirementText.or || req.requirementText.en) : req.requirementText.en}
                                                              </p>
                                                              {req.notes && (req.notes.en || req.notes.am || req.notes.or) && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                                                                  {language === 'am' ? (req.notes.am || req.notes.en) : language === 'or' ? (req.notes.or || req.notes.en) : req.notes.en}
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                        ))}
                                                    </div>
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      {group.windows.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-300 text-sm">
                          {language === 'am' ? 'በዚህ ወለል ላይ ምንም ፎዳዎች የሉም' : language === 'or' ? 'Bona kana irratti foddaawwan hin jiran' : 'No windows on this floor'}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {windowGroups.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <Layers className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">
                    {language === 'am' ? 'ምንም ፎዳዎች አልተገኙም' : language === 'or' ? 'Foddaawwan hin argamne' : 'No windows found'}
                  </p>
                  <p className="text-sm mt-1">
                    {language === 'am' ? 'እባክዎ አስተዳዳሪው ፎዳዎችን እስኪፈጥር ይጠብቁ' : language === 'or' ? 'Maaloo bulchiinsi foddaawwan uumuu hanga isaatti eegaa' : 'Please wait for the admin to create windows'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}