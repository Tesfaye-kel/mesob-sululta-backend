import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, X, Layers, CheckCircle2, Circle, Building2, Search, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getWindowsGroupedByFloor, getServiceRequirements, searchServices } from '@/api/tajaajila'
import type { WindowGroupedByFloorWithName, WindowSummary, Service, Requirement } from '@/api/tajaajila'
import { saveCache, loadCache } from '@/lib/cache'
import { cn } from '@/lib/utils'
import AnimatedHeading from '@/components/tajaajila/AnimatedHeading'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Window card icon ──────────────────────────────────────────────────────────
function WindowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <line x1="10" y1="22" x2="38" y2="22" stroke="currentColor" strokeWidth="2.5" />
      <line x1="24" y1="22" x2="24" y2="38" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14" y="14" width="8" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

// Each window card — same colorful style as the office (waajjiraalee) cards
const CARD_COLORS = [
  { card: 'bg-blue-100 dark:bg-blue-900/30',                 text: 'text-blue-700 dark:text-blue-300',    numBg: 'bg-white/70 dark:bg-black/20', icon: 'text-blue-600 dark:text-blue-400' },
  { card: 'bg-green-100 dark:bg-green-900/30',               text: 'text-green-700 dark:text-green-300',  numBg: 'bg-white/70 dark:bg-black/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  { card: 'bg-amber-100 dark:bg-amber-900/30',               text: 'text-amber-700 dark:text-amber-300',  numBg: 'bg-white/70 dark:bg-black/20', icon: 'text-amber-600 dark:text-amber-400' },
  { card: 'bg-purple-100 dark:bg-purple-900/30',             text: 'text-purple-700 dark:text-purple-300', numBg: 'bg-white/70 dark:bg-black/20', icon: 'text-violet-600 dark:text-violet-400' },
]

function getCardColor(index: number) {
  return CARD_COLORS[index % CARD_COLORS.length]
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div className="h-14 w-14 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

// ── Window Card ───────────────────────────────────────────────────────────────
interface WindowCardProps {
  win: WindowSummary
  floorName: { en: string; am: string; or: string }
  index: number
  language: string
  onClick: () => void
}

function WindowCard({ win, floorName, index, language, onClick }: WindowCardProps) {
  const windowName =
    language === 'or' ? (win.name?.or || `Foddaa ${win.number}ffaa`) :
    language === 'am' ? (win.name?.am || `ፎዳ ${win.number}ኛ`) :
    (win.name?.en || `Window ${win.number}`)

  const floorLabel =
    language === 'or' ? (floorName.or || floorName.en) :
    language === 'am' ? (floorName.am || floorName.en) :
    floorName.en

  const count = win.serviceCount ?? 0
  const svcLabel =
    language === 'or' ? `Tajaajila ${count}` :
    language === 'am' ? `${count} አገልግሎት` :
    `${count} Service${count !== 1 ? 's' : ''}`

  const { card, text, numBg } = getCardColor(index)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'w-full rounded-2xl shadow-md hover:shadow-lg',
        'flex flex-col items-center justify-center gap-3 p-6',
        'transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50',
        'cursor-pointer h-full',
        card
      )}
      aria-label={windowName}
    >
      {/* Window number circle — same style as office icon */}
      <div className={cn('h-16 w-16 rounded-full flex items-center justify-center shadow-md', numBg, text)}>
        <span className="text-2xl font-extrabold">{win.number}</span>
      </div>

      {/* Service count badge */}
      {count > 0 && (
        <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-black/20', text)}>
          {svcLabel}
        </span>
      )}

      {/* Name */}
      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 text-center">
        {windowName}
      </h3>

      {/* Floor label */}
      <p className={cn('text-xs font-medium', text)}>{floorLabel}</p>
    </motion.button>
  )
}

// ── Window Services Modal ─────────────────────────────────────────────────────
interface ModalProps {
  win: WindowSummary
  floorName: { en: string; am: string; or: string }
  index: number
  language: string
  onClose: () => void
  autoOpenServiceId?: string  // auto-expand this service on open
}

function WindowModal({ win, floorName, index, language, onClose, autoOpenServiceId }: ModalProps) {
  const c = getCardColor(index)
  const [services, setServices] = useState<Service[]>([])
  const [loadingSvc, setLoadingSvc] = useState(true)
  const [errorSvc, setErrorSvc] = useState(false)
  const [expandedService, setExpandedService] = useState<string | null>(autoOpenServiceId ?? null)
  const [requirements, setRequirements] = useState<Record<string, Requirement[]>>({})
  const [loadingReqs, setLoadingReqs] = useState<Record<string, boolean>>({})

  // Modal title in selected language only
  const modalTitle =
    language === 'or' ? (win.name?.or || `Foddaa ${win.number}ffaa`) :
    language === 'am' ? (win.name?.am || `ፎዳ ${win.number}ኛ`) :
    (win.name?.en || `Window ${win.number}`)

  // Window pill label
  const winPill =
    language === 'or' ? `FODDAA ${win.number}` :
    language === 'am' ? `ፎዳ ${win.number}` :
    `WINDOW ${win.number}`

  const floorLabel =
    language === 'or' ? (floorName.or || floorName.en) :
    language === 'am' ? (floorName.am || floorName.en) :
    floorName.en

  const reqLabel =
    language === 'or' ? 'Wantoota Barbaachisoo' :
    language === 'am' ? 'ያስፈልጋሉ ሰነዶች' :
    'Requirements'

  const noSvcLabel =
    language === 'or' ? 'Tajaajilli hin jiru' :
    language === 'am' ? 'ምንም አገልግሎቶች የሉም' :
    'No services available'

  const noReqLabel =
    language === 'or' ? 'Barbaachisoonni hin jiran' :
    language === 'am' ? 'ምንም መስፈርቶች የሉም' :
    'No requirements listed'

  const hintLabel =
    language === 'or' ? 'Tajaajila kamiyyuu cuqaasuun wantoota barbaachisoo argadhaa' :
    language === 'am' ? 'ያስፈልጉ ሰነዶችን ለማየት ማናቸውንም አገልግሎት ጠቅ ያድርጉ' :
    'Click any service below to see requirements and steps'

  const svcCountLabel =
    language === 'or' ? `Tajaajila ${services.length}` :
    language === 'am' ? `${services.length} አገልግሎቶች` :
    `${services.length} Services`

  // Fetch services when modal opens; keep last cached data if the network is down.
  useEffect(() => {
    const cacheKey = `window_services_${win._id}`
    const cached = loadCache<Service[]>(cacheKey)
    if (cached && cached.length > 0) {
      setServices(cached)
      setLoadingSvc(false)
    } else {
      setLoadingSvc(true)
    }
    setErrorSvc(false)

    fetch(`${BASE}/windows/${win._id}/services`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(async (data) => {
        const list: Service[] = Array.isArray(data) ? data : []
        setServices(list)
        saveCache(cacheKey, list)

        if (autoOpenServiceId && list.find(s => s._id === autoOpenServiceId)) {
          setLoadingReqs(prev => ({ ...prev, [autoOpenServiceId]: true }))
          try {
            const reqs = await getServiceRequirements(autoOpenServiceId)
            const reqList = Array.isArray(reqs) ? reqs : []
            setRequirements(prev => ({ ...prev, [autoOpenServiceId]: reqList }))
            saveCache(`service_requirements_${autoOpenServiceId}`, reqList)
          } catch {
            const lastReqs = loadCache<Requirement[]>(`service_requirements_${autoOpenServiceId}`) || []
            setRequirements(prev => ({ ...prev, [autoOpenServiceId]: lastReqs }))
          } finally {
            setLoadingReqs(prev => ({ ...prev, [autoOpenServiceId]: false }))
          }
        }
      })
      .catch(() => {
        const fallback = loadCache<Service[]>(cacheKey)
        if (fallback) setServices(fallback)
        else setErrorSvc(true)
      })
      .finally(() => setLoadingSvc(false))
  }, [win._id])

  const handleServiceClick = useCallback(async (svcId: string) => {
    if (expandedService === svcId) { setExpandedService(null); return }
    setExpandedService(svcId)
    if (requirements[svcId] !== undefined) return
    setLoadingReqs(prev => ({ ...prev, [svcId]: true }))
    try {
      const data = await getServiceRequirements(svcId)
      const reqList = Array.isArray(data) ? data : []
      setRequirements(prev => ({ ...prev, [svcId]: reqList }))
      saveCache(`service_requirements_${svcId}`, reqList)
    } catch {
      const fallback = loadCache<Requirement[]>(`service_requirements_${svcId}`) || []
      setRequirements(prev => ({ ...prev, [svcId]: fallback }))
    } finally {
      setLoadingReqs(prev => ({ ...prev, [svcId]: false }))
    }
  }, [expandedService, requirements])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#1a2744] dark:bg-gray-800 px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-white/10', c.icon)}>
                <WindowIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
                  {winPill}
                </p>
                <h2 className="text-xl font-bold text-white leading-tight">{modalTitle}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-sm text-gray-300">{svcCountLabel}</span>
                  <span className="text-gray-500">·</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
                    <Layers className="h-3 w-3" />{floorLabel}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 text-xs text-yellow-300/80 flex items-center gap-1.5">
            <span aria-hidden>👆</span>{hintLabel}
          </p>
        </div>

        {/* Services list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loadingSvc && <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div>}

          {errorSvc && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-gray-500">{language === 'or' ? 'Dogoggora uumame' : 'Failed to load'}</p>
            </div>
          )}

          {!loadingSvc && !errorSvc && services.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">{noSvcLabel}</div>
          )}

          {!loadingSvc && !errorSvc && services.map(svc => {
            const svcName =
              language === 'am' ? (svc.name.am || svc.name.or || svc.name.en) :
              language === 'or' ? (svc.name.or || svc.name.en) :
              svc.name.en
            const isOpen = expandedService === svc._id
            const reqs = requirements[svc._id]

            return (
              <div key={svc._id} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Service row */}
                <button
                  onClick={() => handleServiceClick(svc._id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-[#1a2744] dark:bg-brand-green/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-white dark:text-brand-green" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{svcName}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-green dark:text-green-400 shrink-0 whitespace-nowrap">
                    {reqLabel} →
                  </span>
                </button>

                {/* Requirements expand */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                        {loadingReqs[svc._id] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
                          </div>
                        ) : !reqs || reqs.length === 0 ? (
                          <p className="text-sm text-gray-400 py-3 text-center">{noReqLabel}</p>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {[...reqs]
                              .sort((a, b) => a.sequenceNo - b.sequenceNo)
                              .map(req => {
                                const reqText =
                                  language === 'am' ? (req.requirementText.am || req.requirementText.or || req.requirementText.en) :
                                  language === 'or' ? (req.requirementText.or || req.requirementText.en) :
                                  req.requirementText.en
                                return (
                                  <div key={req._id} className={cn(
                                    'flex items-start gap-3 p-3 rounded-lg',
                                    req.isMandatory
                                      ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20'
                                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                                  )}>
                                    {req.isMandatory
                                      ? <CheckCircle2 className="h-4 w-4 text-brand-green dark:text-green-400 mt-0.5 shrink-0" />
                                      : <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                    }
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{reqText}</p>
                                  </div>
                                )
                              })}
                          </div>
                        )}
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

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return deb
}

// ── Main Page — flat grid of ALL windows ───────────────────────────────────
export default function ServiceByWindowPage() {
  const { language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as { openWindowId?: string; openServiceId?: string } | null
  const openWindowId  = locationState?.openWindowId
  const openServiceId = locationState?.openServiceId

  const [allWindows, setAllWindows] = useState<Array<{
    win: WindowSummary
    floorName: { en: string; am: string; or: string }
    floorNum: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<{
    win: WindowSummary
    floorName: { en: string; am: string; or: string }
    floorNum: number
    index: number
    autoOpenServiceId?: string
  } | null>(null)

  // ── Search state ────────────────────────────────────────────────────────────
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<Service[]>([])
  const [searching, setSearching]   = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
  const searchRef                   = useRef<HTMLDivElement>(null)
  const debouncedQuery              = useDebounce(query, 280)

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 1) { setResults([]); setShowDrop(false); return }
    let cancelled = false
    setSearching(true)
    searchServices(q)
      .then(data => { if (!cancelled) { setResults(data); setShowDrop(true) } })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setSearching(false) })
    return () => { cancelled = true }
  }, [debouncedQuery])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handlePickResult = (svc: Service) => {
    setShowDrop(false); setQuery('')
    const winId = svc.window?._id
    if (!winId) return
    const idx = allWindows.findIndex(f => f.win._id === winId)
    if (idx !== -1) {
      setSelected({ ...allWindows[idx], index: idx, autoOpenServiceId: svc._id })
    }
  }

  const getLocalName = (svc: Service) =>
    language === 'am' ? (svc.name.am || svc.name.en) :
    language === 'or' ? (svc.name.or || svc.name.en) : svc.name.en

  const pageTitle    = language === 'or' ? 'Tajaajila Foddaadhaan' : language === 'am' ? 'አገልግሎት በፎዳ' : 'Service by Window'
  const pageSubtitle = language === 'or' ? 'Foddaa yookan Wajjiralee filachuudhaan tajaajila Barbaddan argadhaa' : language === 'am' ? 'ፎዳ ምርጡ አገልግሎቱን ያግኙ' : 'Select a window to find the services available'
  const officeBtn    = language === 'or' ? 'Wajjiraaleedhaan' : language === 'am' ? 'ቢሮዎቻቸን' : 'Offices'
  const retryLabel   = language === 'or' ? "Irra deebi'ii yaalii" : language === 'am' ? 'እንደገና ሞክር' : 'Try Again'
  const searchPh     = language === 'or' ? 'Tajaajila barbaadi...' : language === 'am' ? 'አገልግሎቶችን ፈልጉ...' : 'Search services...'

  const load = () => {
    const cached = loadCache<WindowGroupedByFloorWithName[]>('windows_grouped')
    if (cached && cached.length > 0) {
      const flat: typeof allWindows = []
      for (const group of cached) {
        for (const win of group.windows) {
          flat.push({ win, floorName: group.floorName, floorNum: group.floor })
        }
      }
      flat.sort((a, b) => Number(a.win.number) - Number(b.win.number))
      setAllWindows(flat)
      setLoading(false)
    } else {
      setLoading(true)
    }

    setError(false)
    getWindowsGroupedByFloor()
      .then(groups => {
        const data = Array.isArray(groups) ? groups : []
        const flat: typeof allWindows = []
        for (const group of data) {
          for (const win of group.windows) {
            flat.push({ win, floorName: group.floorName, floorNum: group.floor })
          }
        }
        flat.sort((a, b) => Number(a.win.number) - Number(b.win.number))
        setAllWindows(flat)
        saveCache('windows_grouped', data)

        if (openWindowId) {
          const idx = flat.findIndex(f => f.win._id === openWindowId)
          if (idx !== -1) {
            setSelected({ ...flat[idx], index: idx, autoOpenServiceId: openServiceId })
          }
        }
      })
      .catch(() => {
        if (!cached || cached.length === 0) setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = `${pageTitle} | MESOB Sululta`
    load()
  }, [language])

  return (
    <div className="section-padding">
      <div className="container-gov">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <AnimatedHeading as="h1" className="mb-1">{pageTitle}</AnimatedHeading>
            <p className="text-sm text-gray-500 dark:text-gray-400">{pageSubtitle}</p>
          </div>
          <Link
            to="/tajaajila/office"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a2744] dark:bg-brand-green text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <Building2 className="h-4 w-4" aria-hidden />
            {officeBtn}
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative mb-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-brand-green" />}
            <input
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) setShowDrop(false) }}
              onFocus={() => query.trim().length > 0 && setShowDrop(true)}
              placeholder={searchPh}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green shadow-sm"
            />
          </div>

          {/* Dropdown results */}
          <AnimatePresence>
            {showDrop && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-40 overflow-hidden">
                {results.length === 0 && !searching && (
                  <p className="px-5 py-4 text-sm text-gray-400 text-center">
                    {language === 'or' ? 'Tajaajilli hin argamne' : language === 'am' ? 'ምንም አልተገኘም' : 'No services found'}
                  </p>
                )}
                {results.map(svc => {
                  const name = getLocalName(svc)
                  const winNum = svc.window ? `Window ${(svc.window as any).number}` : ''
                  return (
                    <button key={svc._id} onClick={() => handlePickResult(svc)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-green transition-colors">{name}</p>
                        {winNum && <p className="text-xs text-gray-400 mt-0.5">{winNum}</p>}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-green shrink-0 transition-colors" />
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 11 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' : 'Could not connect to server.'}
            </p>
            <button onClick={load} className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90 transition-colors">
              {retryLabel}
            </button>
          </div>
        )}

        {/* Flat grid of ALL windows */}
        {!loading && !error && (
          <>
            {allWindows.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-base">{language === 'or' ? 'Foddaawwan hin argamne' : 'No windows found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {allWindows.map(({ win, floorName, floorNum }, idx) => (
                  <motion.div
                    key={win._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                  >
                    <WindowCard
                      win={win}
                      floorName={floorName}
                      index={idx}
                      language={language}
                      onClick={() => setSelected({ win, floorName, floorNum, index: idx })}
                    />                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Services modal */}
      <AnimatePresence>
        {selected && (
          <WindowModal
            win={selected.win}
            floorName={selected.floorName}
            index={selected.index}
            language={language}
            onClose={() => setSelected(null)}
            autoOpenServiceId={selected.autoOpenServiceId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
