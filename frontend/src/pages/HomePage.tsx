import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Building2, Layers, X, CheckCircle2, Circle, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

import Hero from '@/components/home/Hero'
import WhyMesob from '@/components/home/WhyMesob'
import Testimonials from '@/components/home/Testimonials'
import AboutSection from '@/components/sections/AboutSection'
import GallerySection from '@/components/sections/GallerySection'
import FeedbackSection from '@/components/sections/FeedbackSection'
import NewsSection from '@/components/sections/NewsSection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import OfficeCard from '@/components/tajaajila/OfficeCard'
import { CardGrid, CardItem } from '@/components/tajaajila/CardGrid'

import { getWindowsGroupedByFloor, getServiceRequirements, searchServices, getOrganizations } from '@/api/tajaajila'
import type { WindowGroupedByFloorWithName, WindowSummary, Service, Requirement } from '@/api/tajaajila'
import { saveCache, loadCache } from '@/lib/cache'
import { cn } from '@/lib/utils'

// ── Office / Organization icon assets ────────────────────────────────────────
import imgAadaa        from '@/assets/aadaa-turizimii.jpeg'
import imgAbbaaAlangaa from '@/assets/abbaa-alangaa.jpeg'
import imgEgumsaNannoo from '@/assets/egumsa-nannoo.jpeg'
import imgBarnoota     from '@/assets/barnoota.jpeg'
import imgBishaan      from '@/assets/bishaan.jpeg'
import imgBuusaa       from '@/assets/buusaa-gonofaa.jpeg'
import imgCHUO         from '@/assets/CHUO.jpeg'
import imgDabbata      from '@/assets/dabbata-bishaan.jpeg'
import imgDaldala      from '@/assets/Daldala.jpeg'
import imgFayyaa       from '@/assets/fayyaa.jpeg'
import imgGalii        from '@/assets/galii.jpeg'
import imgGalmessa     from '@/assets/galmessa-silii.jpeg'
import imgGeejjiba     from '@/assets/geejjiba.jpeg'
import imgHawaasummaa  from '@/assets/hawaasummaa.jpeg'
import imgInvestimnt   from '@/assets/invenstimentii.png'
import imgKomnikeeshn  from '@/assets/kominikeeshinii.jpeg'
import imgKonstraksh   from '@/assets/konistrakshinii.jpeg'
import imgLafa         from '@/assets/lafa.jpeg'
import imgMallaqaa     from '@/assets/mallaqaa.jpeg'
import imgManaQoph     from '@/assets/mana-qophessaa.jpeg'
import imgPolisii      from '@/assets/polisii.jpeg'
import imgPSMQN        from '@/assets/PSMQN.jpeg'
import imgQonnaa       from '@/assets/qonnaa.jpeg'
import imgSaynsi       from '@/assets/saynsii-technolojii.jpeg'
import imgWajjira      from '@/assets/wajjira-bulchinsaa.jpeg'

const ORG_ICON_MAP: Array<{ keywords: string[]; img: string }> = [
  { keywords: ['aadaa', 'turizimii', 'tourism', 'culture'],          img: imgAadaa },
  { keywords: ['abbaa alangaa', 'alangaa', 'attorney'],               img: imgAbbaaAlangaa },
  { keywords: ['egumsa nannoo', 'nannoo', 'environment'],             img: imgEgumsaNannoo },
  { keywords: ['barnoota', 'education'],                              img: imgBarnoota },
  { keywords: ['bishaan', 'water'],                                   img: imgBishaan },
  { keywords: ['buusaa', 'gonofaa'],                                  img: imgBuusaa },
  { keywords: ['chuo'],                                               img: imgCHUO },
  { keywords: ['dabbata', 'dhugaatii'],                               img: imgDabbata },
  { keywords: ['daldala', 'trade', 'commerce'],                       img: imgDaldala },
  { keywords: ['fayyaa', 'health'],                                   img: imgFayyaa },
  { keywords: ['galii', 'revenue', 'tax', 'gibir'],                   img: imgGalii },
  { keywords: ['galmessa', 'silii', 'civil'],                         img: imgGalmessa },
  { keywords: ['geejjiba', 'transport'],                              img: imgGeejjiba },
  { keywords: ['hawaasummaa', 'social'],                              img: imgHawaasummaa },
  { keywords: ['invenstiment', 'investiment', 'investment'],          img: imgInvestimnt },
  { keywords: ['kominikeeshinii', 'communication'],                   img: imgKomnikeeshn },
  { keywords: ['konistrakshinii', 'construction'],                    img: imgKonstraksh },
  { keywords: ['lafa', 'land'],                                       img: imgLafa },
  { keywords: ['mallaqaa', 'finance', 'dinagdee'],                    img: imgMallaqaa },
  { keywords: ['mana qophessaa', 'qophessaa', 'housing'],             img: imgManaQoph },
  { keywords: ['polisii', 'police'],                                  img: imgPolisii },
  { keywords: ['psmqn'],                                              img: imgPSMQN },
  { keywords: ['qonnaa', 'agriculture'],                              img: imgQonnaa },
  { keywords: ['saynsii', 'technolojii', 'technology', 'science'],    img: imgSaynsi },
  { keywords: ['bulchinsaa', 'administration'],                       img: imgWajjira },
]

function getOrgIcon(name: string): string | null {
  const lower = name.toLowerCase()
  for (const { keywords, img } of ORG_ICON_MAP) {
    if (keywords.some(k => lower.includes(k))) return img
  }
  return null
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Section wrapper ───────────────────────────────────────────────────────────
function HomeSection({ id, title, subtitle, bg = '', children }: { id: string; title: string; subtitle?: string; bg?: string; children: React.ReactNode }) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45 }}
      style={{ pointerEvents: 'auto' }}
      className={`section-padding ${bg}`} aria-label={title}>
      <div className="container-gov mb-6">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  )
}

// ── Window icon ───────────────────────────────────────────────────────────────
function WindowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.15" />
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <line x1="10" y1="22" x2="38" y2="22" stroke="currentColor" strokeWidth="2.5" />
      <line x1="24" y1="22" x2="24" y2="38" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14" y="14" width="8" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

// ── Color palette for windows — soft pastel tints, applied to original layout ─
const CARD_COLORS = [
  { card: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300/70 dark:border-blue-700/50',           icon: 'text-blue-700 dark:text-blue-300',    badge: 'bg-white/90 dark:bg-black/30 text-blue-700 dark:text-blue-300' },
  { card: 'bg-green-100 dark:bg-green-900/40 border-green-300/70 dark:border-green-700/50',        icon: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-white/90 dark:bg-black/30 text-green-700 dark:text-green-300' },
  { card: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300/70 dark:border-amber-700/50',        icon: 'text-amber-700 dark:text-amber-300',  badge: 'bg-white/90 dark:bg-black/30 text-amber-700 dark:text-amber-300' },
  { card: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300/70 dark:border-purple-700/50',    icon: 'text-violet-700 dark:text-violet-300', badge: 'bg-white/90 dark:bg-black/30 text-purple-700 dark:text-purple-300' },
]

// ── Window Card (opens modal inline — no navigation) ─────────────────────────
interface WinCardProps {
  win: WindowSummary
  floorName: { en: string; am: string; or: string }
  index: number
  language: string
  onClick: () => void
}

function WinCard({ win, floorName, index, language, onClick }: WinCardProps) {
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

  const { card, badge, icon } = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 8px 22px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left flex items-center gap-5 p-5 rounded-2xl cursor-pointer transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green',
        'border shadow-sm hover:shadow-lg',
        'min-h-[10rem]',
        card
      )}
      aria-label={windowName}
    >
      {/* Left — window icon box with number badge (original structure) */}
      <div className="relative shrink-0">
        <div className="w-24 h-40 rounded-xl border-2 border-amber-400 dark:border-amber-500 bg-white dark:bg-[#162032] flex items-center justify-center overflow-hidden">
          {/* Window icon — SVG representation of a window pane */}
          <svg viewBox="0 0 48 72" width="80" height="120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            {/* outer frame */}
            <rect x="2" y="2" width="44" height="68" rx="3" stroke="#94a3b8" strokeWidth="2.5" fill="#e2e8f0"/>
            {/* vertical divider */}
            <line x1="24" y1="2" x2="24" y2="70" stroke="#94a3b8" strokeWidth="2"/>
            {/* horizontal divider */}
            <line x1="2" y1="36" x2="46" y2="36" stroke="#94a3b8" strokeWidth="2"/>
            {/* glass panes */}
            <rect x="4" y="4" width="18" height="30" rx="1" fill="#bfdbfe" fillOpacity="0.6"/>
            <rect x="26" y="4" width="18" height="30" rx="1" fill="#bfdbfe" fillOpacity="0.6"/>
            <rect x="4" y="38" width="18" height="30" rx="1" fill="#bfdbfe" fillOpacity="0.4"/>
            <rect x="26" y="38" width="18" height="30" rx="1" fill="#bfdbfe" fillOpacity="0.4"/>
          </svg>
        </div>
        {/* Number badge */}
        <span className={cn('absolute -bottom-2 -right-2 min-w-[28px] h-[28px] px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md', icon)}>
          {win.number}
        </span>
      </div>

      {/* Right — text */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Top row: floor label pushed to top-right */}
        <div className="flex justify-end">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', badge)}>
            {floorLabel}
          </span>
        </div>
        {/* Window identifier */}
        <p className="text-sm font-bold text-[#1a2744] dark:text-white leading-snug">
          {language === 'or' ? `Foddaa ${win.number}ffaa` : language === 'am' ? `ፎዳ ${win.number}ኛ` : `Window ${win.number}`}
        </p>
        {/* Window name */}
        {(win.name?.en || win.name?.or || win.name?.am) && (
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
            {language === 'or' ? (win.name?.or || win.name?.en) : language === 'am' ? (win.name?.am || win.name?.en) : win.name?.en}
          </p>
        )}
        {/* Service count */}
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-auto pt-1">
          {svcLabel}
        </p>
      </div>
    </motion.button>
  )
}

// ── Inline Services Modal (same page, no navigation) ─────────────────────────
interface WinModalProps {
  win: WindowSummary
  floorName: { en: string; am: string; or: string }
  index: number
  language: string
  onClose: () => void
  autoOpenServiceId?: string
}

function WinModal({ win, floorName, index, language, onClose, autoOpenServiceId }: WinModalProps) {
  const c = CARD_COLORS[index % CARD_COLORS.length]
  const [services, setServices]   = useState<Service[]>([])
  const [loadingSvc, setLoadingSvc] = useState(true)
  const [expandedSvc, setExpandedSvc] = useState<string | null>(autoOpenServiceId ?? null)
  const [reqs, setReqs]           = useState<Record<string, Requirement[]>>({})
  const [loadingReqs, setLoadingReqs] = useState<Record<string, boolean>>({})

  const name =
    language === 'or' ? (win.name?.or || `Foddaa ${win.number}ffaa`) :
    language === 'am' ? (win.name?.am || `ፎዳ ${win.number}ኛ`) :
    (win.name?.en || `Window ${win.number}`)

  const pill =
    language === 'or' ? `FODDAA ${win.number}` :
    language === 'am' ? `ፎዳ ${win.number}` :
    `WINDOW ${win.number}`

  const floor =
    language === 'or' ? (floorName.or || floorName.en) :
    language === 'am' ? (floorName.am || floorName.en) :
    floorName.en

  const reqLabel  = language === 'or' ? 'Wantoota Barbaachisoo' : language === 'am' ? 'ያስፈልጋሉ ሰነዶች' : 'Requirements'
  const hintLabel = language === 'or' ? 'Tajaajila kamiyyuu cuqaasuun wantoota barbaachisoo argadhaa' : language === 'am' ? 'ያስፈልጉ ሰነዶችን ለማየት ማናቸውንም አገልግሎት ጠቅ ያድርጉ' : 'Click any service to see requirements'
  const noSvc     = language === 'or' ? 'Tajaajilli hin jiru' : language === 'am' ? 'ምንም አገልግሎቶች የሉም' : 'No services available'
  const noReq     = language === 'or' ? 'Barbaachisoonni hin jiran' : language === 'am' ? 'ምንም መስፈርቶች የሉም' : 'No requirements listed'

  useEffect(() => {
    setLoadingSvc(true)
    fetch(`${BASE}/windows/${win._id}/services`)
      .then(async d => {
        const list: Service[] = Array.isArray(d) ? d : []
        setServices(list)
        // If a specific service was requested, fetch its requirements immediately
        if (autoOpenServiceId && list.find(s => s._id === autoOpenServiceId)) {
          setLoadingReqs(p => ({ ...p, [autoOpenServiceId]: true }))
          try {
            const data = await getServiceRequirements(autoOpenServiceId)
            setReqs(p => ({ ...p, [autoOpenServiceId]: Array.isArray(data) ? data : [] }))
          } catch {
            setReqs(p => ({ ...p, [autoOpenServiceId]: [] }))
          } finally {
            setLoadingReqs(p => ({ ...p, [autoOpenServiceId]: false }))
          }
        }
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingSvc(false))
  }, [win._id])

  const handleSvc = useCallback(async (id: string) => {
    if (expandedSvc === id) { setExpandedSvc(null); return }
    setExpandedSvc(id)
    if (reqs[id] !== undefined) return
    setLoadingReqs(p => ({ ...p, [id]: true }))
    try {
      const data = await getServiceRequirements(id)
      setReqs(p => ({ ...p, [id]: Array.isArray(data) ? data : [] }))
    } catch { setReqs(p => ({ ...p, [id]: [] })) }
    finally { setLoadingReqs(p => ({ ...p, [id]: false })) }
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
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 shrink-0', c.icon)}>
                <WindowIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">{pill}</p>
                <h2 className="text-lg font-bold text-white">{name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-300">{svcCount}</span>
                  <span className="text-gray-500">·</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
                    <Layers className="h-3 w-3" />{floor}
                  </span>
                </div>
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
          {loadingSvc && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-green" /></div>}
          {!loadingSvc && services.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">{noSvc}</div>}
          {!loadingSvc && services.map(svc => {
            const svcName = language === 'am' ? (svc.name.am || svc.name.or || svc.name.en) : language === 'or' ? (svc.name.or || svc.name.en) : svc.name.en
            const isOpen  = expandedSvc === svc._id
            const rList   = reqs[svc._id]
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
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                        {loadingReqs[svc._id] ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand-green" /></div>
                          : !rList || rList.length === 0 ? <p className="text-sm text-gray-400 py-3 text-center">{noReq}</p>
                          : <div className="space-y-2 mt-2">
                              {[...rList].sort((a, b) => a.sequenceNo - b.sequenceNo).map(req => {
                                const txt = language === 'am' ? (req.requirementText.am || req.requirementText.or || req.requirementText.en) : language === 'or' ? (req.requirementText.or || req.requirementText.en) : req.requirementText.en
                                return (
                                  <div key={req._id} className={cn('flex items-start gap-3 p-3 rounded-lg',
                                    req.isMandatory ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700')}>
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

// ── Office Modal — inline, same style as WinModal ────────────────────────────
function OrgModal({ id, name, index, language, onClose, autoOpenServiceId }: { id: string; name: { en: string; am: string; or: string }; index: number; language: string; onClose: () => void; autoOpenServiceId?: string }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSvc, setExpandedSvc] = useState<string | null>(autoOpenServiceId ?? null)
  const [reqs, setReqs] = useState<Record<string, Requirement[]>>({})
  const [loadingReqs, setLoadingReqs] = useState<Record<string, boolean>>({})

  const orgName = language === 'am' ? (name.am || name.or || name.en) : language === 'or' ? (name.or || name.en) : name.en
  const reqLabel = language === 'or' ? 'Wantoota Barbaachisoo' : language === 'am' ? 'ያስፈልጋሉ ሰነዶች' : 'Requirements'
  const hintLabel = language === 'or' ? 'Tajaajila kamiyyuu cuqaasuun wantoota barbaachisoo argadhaa' : language === 'am' ? 'ያስፈልጉ ሰነዶችን ለማየት ያናቸውንም ጠቅ ያድርጉ' : 'Click any service to see requirements'
  const noSvc = language === 'or' ? 'Tajaajilli hin jiru' : language === 'am' ? 'ምንም አገልግሎቶች የሉም' : 'No services available'
  const noReq = language === 'or' ? 'Barbaachisoonni hin jiran' : language === 'am' ? 'ምንም መስፈርቶች የሉም' : 'No requirements listed'

  useEffect(() => {
    fetch(`${BASE}/services/by-organization/${id}`)
      .then(r => r.json())
      .then(async d => {
        const list: Service[] = Array.isArray(d) ? d : []
        setServices(list)
        // If a specific service was requested, fetch its requirements immediately
        if (autoOpenServiceId && list.find(s => s._id === autoOpenServiceId)) {
          setLoadingReqs(p => ({ ...p, [autoOpenServiceId]: true }))
          try {
            const data = await getServiceRequirements(autoOpenServiceId)
            setReqs(p => ({ ...p, [autoOpenServiceId]: Array.isArray(data) ? data : [] }))
          } catch {
            setReqs(p => ({ ...p, [autoOpenServiceId]: [] }))
          } finally {
            setLoadingReqs(p => ({ ...p, [autoOpenServiceId]: false }))
          }
        }
      })
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
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 shrink-0 overflow-hidden">
                {getOrgIcon(name.or || name.en || '')
                  ? <img src={getOrgIcon(name.or || name.en || '')!} alt={orgName} className="w-full h-full object-cover" />
                  : <Building2 className="h-7 w-7 text-white" />
                }
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

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  // When arriving from the hero search, auto-open the correct card
  const locationState = location.state as { openWindowId?: string; openServiceId?: string; openOrgId?: string } | null
  const [groups, setGroups]   = useState<WindowGroupedByFloorWithName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [modal, setModal]     = useState<{ win: WindowSummary; floorName: { en: string; am: string; or: string }; index: number; autoOpenServiceId?: string } | null>(null)
  const [orgModal, setOrgModal] = useState<{ id: string; name: { en: string; am: string; or: string }; index: number; autoOpenServiceId?: string } | null>(null)
  const [activeView, setActiveView] = useState<'windows' | 'offices'>('windows')
  const [orgs, setOrgs] = useState<Array<{ _id: string; name: { en: string; am: string; or: string }; serviceCount: number }>>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  const loadWindows = () => {
    // Show cached data immediately if available
    const cached = loadCache<WindowGroupedByFloorWithName[]>('windows_grouped')
    if (cached && cached.length > 0) {
      setGroups(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(false)
    getWindowsGroupedByFloor()
      .then(d => {
        const data = Array.isArray(d) ? d : []
        setGroups(data)
        saveCache('windows_grouped', data)
      })
      .catch(() => { if (!cached) setError(true) })
      .finally(() => setLoading(false))
  }

  const handleViewChange = (view: 'windows' | 'offices') => {
    setActiveView(view)
    setQuery('')
    if (view === 'offices' && orgs.length === 0) {
      setLoadingOrgs(true)
      // Show cached orgs immediately
      const cachedOrgs = loadCache<typeof orgs>('orgs')
      if (cachedOrgs && cachedOrgs.length > 0) {
        setOrgs(cachedOrgs)
        setLoadingOrgs(false)
      }
      getOrganizations()
        .then(d => {
          const data = Array.isArray(d) ? d : []
          setOrgs(data)
          saveCache('orgs', data)
        })
        .catch(() => {})
        .finally(() => setLoadingOrgs(false))
    }
  }

  useEffect(() => {
    document.title = `${t.siteName} – ${t.siteTagline} | ${t.govName}`
    loadWindows()
    // Load organizations eagerly so the search can always match office cards
    setLoadingOrgs(true)
    const cachedOrgs = loadCache<typeof orgs>('orgs')
    if (cachedOrgs && cachedOrgs.length > 0) setOrgs(cachedOrgs)
    getOrganizations()
      .then(d => {
        const data = Array.isArray(d) ? d : []
        setOrgs(data)
        saveCache('orgs', data)
      })
      .catch(() => {})
      .finally(() => setLoadingOrgs(false))
  }, [t])

  // Flatten + sort windows by number
  const flat = groups
    .flatMap(g => g.windows.map(win => ({ win, floorName: g.floorName, floorNum: g.floor })))
    .sort((a, b) => Number(a.win.number) - Number(b.win.number))

  // ── Search state ──────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ svc: Service; win: typeof flat[0] | null; org: typeof orgs[0] | null }>>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setSearchResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchServices(q)
        // For each service, find its window (for window card) OR its organization (for office card)
        const enriched = results.map(svc => {
          const winId = typeof svc.window === 'object' && svc.window ? svc.window._id : svc.window as string | null
          const orgId = typeof svc.organization === 'object' && svc.organization ? String((svc.organization as any)._id || '') : typeof svc.organization === 'string' ? svc.organization : ''
          const win = flat.find(f => f.win._id === winId) || null
          const org = orgs.find(o => o._id === orgId) || null
          return { svc, win, org }
        })
        // Filter by active tab: windows → only services assigned to a window card;
        // offices → only services assigned to an office card
        const filteredResults = activeView === 'windows'
          ? enriched.filter(r => r.win !== null)
          : enriched.filter(r => r.org !== null)
        setSearchResults(filteredResults)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
  }, [query, flat, orgs, activeView])

  // After initial windows load, if we arrived from hero search, open the right card.
  // location.key ensures this re-runs even when already on the home page
  useEffect(() => {
    if (loading || !locationState) return
    if (locationState.openWindowId) {
      const idx = flat.findIndex(f => f.win._id === locationState.openWindowId)
      if (idx !== -1) {
        setActiveView('windows')
        setModal({ win: flat[idx].win, floorName: flat[idx].floorName, index: idx, autoOpenServiceId: locationState.openServiceId })
      }
    }
    if (locationState.openOrgId && orgs.length > 0) {
      const oIdx = orgs.findIndex(o => o._id === locationState.openOrgId)
      if (oIdx !== -1) {
        setActiveView('offices')
        setOrgModal({ id: orgs[oIdx]._id, name: orgs[oIdx].name, index: oIdx, autoOpenServiceId: locationState.openServiceId })
      }
    }
    window.history.replaceState({}, '')
  }, [loading, orgs, flat, locationState, location.key])

  const svcTitle    = language === 'or' ? 'Tajaajiloota'     : language === 'am' ? 'አገልግሎቶቻችን'    : 'Our Services'
  const svcSubtitle = language === 'or' ? 'Foddaa yookan Wajjiralee filachuudhaan tajaajila Barbaddan argadhaa' : language === 'am' ? 'ፎዳ ምርጡ አገልግሎቱን ያግኙ' : 'Select a window to find available services'
  const officeBtn   = language === 'or' ? 'Wajjiraaleedhaan' : language === 'am' ? 'ቢሮዎቻቸን'        : 'Offices'
  const viewAll     = language === 'or' ? 'Foddaadhaan'      : language === 'am' ? 'በፎዳ ያግኙ'       : 'By Window'
  const retryLabel  = language === 'or' ? "Irra deebi'ii yaalii" : language === 'am' ? 'እንደገና ሞክር' : 'Try Again'
  const searchPlaceholder = language === 'or' ? 'Tajaajila barbaadi...' : language === 'am' ? 'አገልግሎት ፈልግ...' : 'Search services...'

  return (
    <>
      <Hero />

      {/* About */}
      <HomeSection id="about" title={t.about.title} subtitle={t.about.subtitle} bg="bg-white dark:bg-transparent">
        <div className="section-padding pt-0"><AboutSection /></div>
      </HomeSection>

      {/* Services — 11 window cards, modal opens inline */}
      <HomeSection id="services" title={svcTitle} subtitle={svcSubtitle} bg="bg-slate-50/60 dark:bg-gray-900/50">
        <div className="section-padding pt-0">
          <div className="container-gov">

            {/* Toggle buttons — Foddaadhaan / Waajjiralee */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <button
                onClick={() => handleViewChange('windows')}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  activeView === 'windows'
                    ? 'bg-[#1a2744] dark:bg-brand-green text-white'
                    : 'border-2 border-[#1a2744] dark:border-brand-green text-[#1a2744] dark:text-brand-green hover:bg-[#1a2744]/5'
                )}
              >
                {viewAll}
              </button>
              <button
                onClick={() => handleViewChange('offices')}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  activeView === 'offices'
                    ? 'bg-[#1a2744] dark:bg-brand-green text-white'
                    : 'border-2 border-[#1a2744] dark:border-brand-green text-[#1a2744] dark:text-brand-green hover:bg-[#1a2744]/5'
                )}
              >
                <Building2 className="h-4 w-4" />
                {officeBtn}
              </button>
            </div>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-green animate-spin pointer-events-none" />}
              {!searching && query && (
                <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green shadow-sm"
              />

              {/* Search results dropdown */}
              {query.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 right-0 z-30 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-72 overflow-y-auto"
                >
                  {searchResults.length === 0 && !searching ? (
                    <p className="text-center text-sm text-gray-400 py-6">
                      {language === 'or' ? 'Hin argamne' : language === 'am' ? 'አልተገኘም' : 'No results found'}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {searchResults.slice(0, 8).map(({ svc, win: w, org }) => {
                        const svcName = language === 'am' ? (svc.name.am || svc.name.or || svc.name.en) : language === 'or' ? (svc.name.or || svc.name.en) : svc.name.en
                        const winLabel = w ? (language === 'or' ? (w.win.name?.or || `Foddaa ${w.win.number}ffaa`) : language === 'am' ? (w.win.name?.am || `ፎዳ ${w.win.number}ኛ`) : (w.win.name?.en || `Window ${w.win.number}`)) : null
                        const orgLabel = org ? (language === 'or' ? (org.name.or || org.name.en) : language === 'am' ? (org.name.am || org.name.en) : org.name.en) : null
                        return (
                          <li key={svc._id}>
                            <button
                              onClick={() => {
                                setQuery('')
                                // If service has a window → open window card; else if has an org → open office card
                                if (w) {
                                  setActiveView('windows')
                                  setModal({ win: w.win, floorName: w.floorName, index: flat.findIndex(f => f.win._id === w.win._id), autoOpenServiceId: svc._id })
                                } else if (org) {
                                  setActiveView('offices')
                                  const oIdx = orgs.findIndex(o => o._id === org._id)
                                  setOrgModal({ id: org._id, name: org.name, index: oIdx === -1 ? 0 : oIdx, autoOpenServiceId: svc._id })
                                }
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left gap-3"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{svcName}</span>
                              {winLabel ? (
                                <span className="text-xs text-brand-green dark:text-green-400 shrink-0 font-semibold">
                                  {winLabel} →
                                </span>
                              ) : orgLabel ? (
                                <span className="text-xs text-orange-600 dark:text-orange-400 shrink-0 font-semibold">
                                  {orgLabel} →
                                </span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </motion.div>
              )}
            </div>

            {/* Animated content — windows OR offices */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* ── WINDOWS tab ── */}
                {activeView === 'windows' && (
                  <>
                    {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
                    {!loading && error && (
                      <div className="flex flex-col items-center gap-4 py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {language === 'or' ? 'Server waliin walqunnamuu hin dandeenye.' : 'Could not connect to server.'}
                        </p>
                        <button onClick={loadWindows} className="px-5 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90">
                          {retryLabel}
                        </button>
                      </div>
                    )}
                    {!loading && !error && flat.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {flat.map(({ win, floorName }, idx) => (
                          <WinCard key={win._id} win={win} floorName={floorName} index={idx} language={language}
                            onClick={() => setModal({ win, floorName, index: idx })} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── OFFICES tab ── */}
                {activeView === 'offices' && (
                  <>
                    {loadingOrgs && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
                    {!loadingOrgs && orgs.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {orgs.map((org, idx) => {
                          const orgName = language === 'am' ? (org.name.am || org.name.or || org.name.en) : language === 'or' ? (org.name.or || org.name.en) : org.name.en
                          const count = org.serviceCount ?? 0
                          const svcLabel = language === 'or' ? `Tajaajila ${count}` : language === 'am' ? `${count} አገልግሎት` : `${count} Services`
                          const colors = [
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                            'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                          ]
                          const col = colors[idx % colors.length]
                          const orgIcon = getOrgIcon(org.name.or || org.name.en || '')
                          return (
                            <motion.button
                              key={org._id}
                              type="button"
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              onClick={() => setOrgModal({ id: org._id, name: org.name, index: idx })}
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className={cn('w-full rounded-xl shadow-md hover:shadow-lg flex flex-col items-center justify-center gap-3 p-6 h-48 cursor-pointer transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50', col)}
                            >
                              <div className="h-20 w-20 rounded-full flex items-center justify-center bg-white/70 dark:bg-black/20 shadow-md overflow-hidden">
                                {orgIcon
                                  ? <img src={orgIcon} alt={orgName} className="w-full h-full object-cover rounded-full" />
                                  : <Building2 className="h-10 w-10 opacity-80" />
                                }
                              </div>
                              {count > 0 && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-black/20">{svcLabel}</span>}
                              <p className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 text-center">{orgName}</p>
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                    {!loadingOrgs && orgs.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-12">
                        {language === 'or' ? 'Waajjiraaleen hin argamne' : language === 'am' ? 'ምንም ቢሮ አልተገኘም' : 'No offices found'}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {!loading && !error && flat.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <button type="button" onClick={() => navigate('/tajaajila')} className="text-brand-green hover:underline">{viewAll} →</button>
              </div>
            )}
          </div>
        </div>
      </HomeSection>

      <WhyMesob />

      {/* News */}
      <HomeSection id="news" title={t.news.title} subtitle={t.news.subtitle} bg="bg-slate-50/60 dark:bg-gray-900/30">
        <div className="section-padding pt-0"><NewsSection compact showHeader={false} /></div>
      </HomeSection>

      {/* Gallery */}
      <HomeSection id="gallery" title={t.gallery.title} subtitle={t.gallery.subtitle} bg="bg-slate-50/60 dark:bg-gray-900/30">
        <div className="section-padding pt-0"><GallerySection compact /></div>
      </HomeSection>

      <Testimonials />

      {/* FAQ */}
      <HomeSection id="faq" title={t.faq.title} subtitle={t.faq.subtitle} bg="bg-slate-50/60 dark:bg-gray-900/30">
        <div className="section-padding pt-0"><FAQSection compact showHeader={false} /></div>
      </HomeSection>

      {/* Contact */}
      <HomeSection id="contact" title={t.contact.title} subtitle={t.contact.subtitle}>
        <div className="section-padding pt-0"><ContactSection compact showHeader={false} /></div>
      </HomeSection>

      {/* Feedback */}
      <HomeSection id="feedback" title={t.feedback.title} subtitle={t.feedback.subtitle} bg="bg-slate-50/60 dark:bg-gray-900/30">
        <div className="section-padding pt-0"><FeedbackSection /></div>
      </HomeSection>

      {/* Inline services modal — opens without navigating away */}
      <AnimatePresence>
        {modal && (
          <WinModal win={modal.win} floorName={modal.floorName} index={modal.index} language={language}
            onClose={() => setModal(null)} autoOpenServiceId={modal.autoOpenServiceId} />
        )}
        {orgModal && (
          <OrgModal id={orgModal.id} name={orgModal.name} index={orgModal.index} language={language}
            onClose={() => setOrgModal(null)} autoOpenServiceId={orgModal.autoOpenServiceId} />
        )}
      </AnimatePresence>
    </>
  )
}

