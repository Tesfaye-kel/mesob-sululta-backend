import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, Loader2, RefreshCw } from 'lucide-react'
import { ADMIN_TOKEN_KEY } from '@/api/admin'
import { useLanguage } from '@/contexts/LanguageContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900'
const inputClass = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white'

interface Appointment {
  _id: string
  appointmentReference: string
  slotDate: string
  session: string
  queueNumber: number
  status: string
  officeId?: { name?: { en?: string } }
  windowId?: { number?: string | number; floor?: number }
  serviceId?: { name?: { en?: string } }
}

interface AppointmentHistory {
  _id: string
  appointmentReference: string
  slotDate: string
  session: string
  queueNumber: number
  status: string
  citizen: { reference: string; displayName: string }
  officeId?: { name?: { en?: string } }
  windowId?: { number?: string | number; floor?: number }
  serviceId?: { name?: { en?: string } }
}

interface Office {
  _id: string
  name: { en?: string }
}

interface WindowCapacity {
  _id: string
  number: string | number
  floor: number
  organization?: Office
  assignedOrganizations?: Office[]
  sessions: Array<{ session: string; capacity: number; booked: number; remaining: number; status: string }>
}

function todayInAddis() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string> | undefined) || {}),
    },
  })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data as T
}

function label(value?: { en?: string } | string | null) {
  return typeof value === 'string' ? value : value?.en || '—'
}

interface AdminAppointmentsProps {
  view: 'appointments' | 'history'
}

export default function AdminAppointments({ view }: AdminAppointmentsProps) {
  const { t } = useLanguage()
  const copy = t.admin.portal.appointments
  const statusLabel = (status: string) => ({
    CONFIRMED: copy.confirmed,
    CHECKED_IN: copy.checkedIn,
    IN_SERVICE: copy.inService,
    AWAITING_APPROVAL: copy.awaitingApproval,
    DELIVERED: copy.delivered,
    CANCELLED: copy.cancelled,
    NO_SHOW: copy.noShow,
  }[status] || status)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [historyAppointments, setHistoryAppointments] = useState<AppointmentHistory[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPages, setHistoryPages] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [capacityWindows, setCapacityWindows] = useState<WindowCapacity[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [capacityDate, setCapacityDate] = useState(todayInAddis)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reportQuery = useMemo(() => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (status) params.set('status', status)
    return params.toString()
  }, [from, to, status])

  const loadAppointments = useCallback(async () => {
    const suffix = reportQuery ? `?${reportQuery}` : ''
    const result = await adminRequest<{ appointments: Appointment[] }>(`/admin/appointments${suffix}`)
    setAppointments(result.appointments)
  }, [reportQuery])

  const loadCapacity = useCallback(async () => {
    const result = await adminRequest<{ windows: WindowCapacity[] }>(`/admin/appointments/capacity?date=${encodeURIComponent(capacityDate)}`)
    setCapacityWindows(result.windows)
  }, [capacityDate])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const result = await adminRequest<{
        bookings: AppointmentHistory[]
        pagination: { page: number; pages: number; total: number }
      }>(`/admin/citizens/history?page=${historyPage}&limit=25`)
      setHistoryAppointments(result.bookings)
      setHistoryPages(Math.max(1, result.pagination.pages))
      setHistoryTotal(result.pagination.total)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setHistoryLoading(false)
    }
  }, [historyPage, t.admin.failedToLoad])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([loadAppointments(), loadCapacity()])
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [loadAppointments, loadCapacity])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (view === 'history') void loadHistory()
  }, [view, loadHistory])

  const downloadReport = async (format: 'xlsx' | 'pdf') => {
    setError('')
    try {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
      const response = await fetch(`${BASE}/admin/appointments/export.${format}${reportQuery ? `?${reportQuery}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const objectUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `appointment-report.${format}`
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{view === 'history' ? copy.appointmentHistory : copy.appointments}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{view === 'history' ? copy.historyRetentionNotice : copy.description}</p>
        </div>
        <button onClick={() => { if (view === 'history') void loadHistory(); else void refresh() }} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700" disabled={view === 'history' ? historyLoading : loading}>
          <RefreshCw className="h-4 w-4" /> {copy.refresh}
        </button>
      </div>

      {view === 'appointments' && error && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {view === 'appointments' && (
        <div className="space-y-5">
        <section className={panelClass}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-semibold">{copy.capacity}</h2><p className="mt-1 text-xs text-gray-500">{copy.capacityHint}</p></div>
            <label className="grid gap-1 text-xs text-gray-500">{copy.date}<input type="date" value={capacityDate} onChange={(event) => setCapacityDate(event.target.value)} className={inputClass} /></label>
            <button onClick={() => void loadCapacity().catch((err: unknown) => setError(err instanceof Error ? err.message : copy.couldNotLoadCapacity))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">{copy.loadCapacity}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500"><tr>{[copy.officeFloorWindow, copy.afternoonSession, copy.morningSession].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
              <tbody>{capacityWindows.map((window) => <tr key={window._id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-3">{(window.assignedOrganizations?.length ? window.assignedOrganizations : window.organization ? [window.organization] : []).map((office) => label(office.name)).join(' / ') || copy.unassigned} · {t.admin.portal.offices.floor} {window.floor} · {t.admin.portal.offices.window} {window.number}</td>
                {window.sessions.map((session) => <td key={session.session} className="px-3 py-3">{session.booked}/{session.capacity} {copy.booked} · {session.remaining} {copy.remaining} · {statusLabel(session.status)}</td>)}
              </tr>)}</tbody>
            </table>
            {!capacityWindows.length && <p className="py-5 text-center text-sm text-gray-500">{copy.noWindows}</p>}
          </div>
        </section>
        <section className={panelClass}>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs text-gray-500">{copy.from}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></label>
            <label className="grid gap-1 text-xs text-gray-500">{copy.to}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></label>
            <label className="grid gap-1 text-xs text-gray-500">{copy.status}<select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="">{copy.all}</option>{['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'DELIVERED', 'CANCELLED', 'NO_SHOW'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
            <button onClick={() => void loadAppointments().catch((err: unknown) => setError(err instanceof Error ? err.message : copy.couldNotFilter))} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white">{copy.applyFilters}</button>
            <button onClick={() => void downloadReport('xlsx')} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700"><Download className="h-4 w-4" />Excel</button>
            <button onClick={() => void downloadReport('pdf')} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700"><Download className="h-4 w-4" />PDF</button>
          </div>
          {loading ? <Loader2 className="mx-auto my-10 h-7 w-7 animate-spin" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500"><tr>{[copy.referenceDate, copy.officeWindow, copy.service, copy.queue, copy.status].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
                <tbody>{appointments.map((item) => <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-3"><div className="font-medium">{item.appointmentReference}</div><div className="text-xs text-gray-500">{item.slotDate?.slice(0, 10)} · {item.session}</div></td>
                  <td className="px-3 py-3">{label(item.officeId?.name)} · {item.windowId?.number ?? '—'} ({t.admin.portal.offices.floor} {item.windowId?.floor ?? '—'})</td>
                  <td className="px-3 py-3">{label(item.serviceId?.name)}</td>
                  <td className="px-3 py-3">{item.queueNumber}</td>
                  <td className="px-3 py-3">{statusLabel(item.status)}</td>
                </tr>)}</tbody>
              </table>
              {!appointments.length && <p className="py-8 text-center text-sm text-gray-500">{copy.noAppointments}</p>}
            </div>
          )}
        </section>
        </div>
      )}

      {view === 'history' && (
        <section className={`${panelClass} space-y-4`}>
          <div>
            <h2 className="font-semibold">{copy.appointmentHistory}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.historyRetentionNotice}</p>
          </div>
          {historyError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{historyError}</p>}
          {historyLoading ? <Loader2 className="mx-auto my-10 h-7 w-7 animate-spin" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500"><tr>{[copy.referenceDate, copy.citizen, copy.officeWindow, copy.service, copy.queue, copy.status].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
                <tbody>{historyAppointments.map((item) => <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-3"><div className="font-medium">{item.appointmentReference}</div><div className="text-xs text-gray-500">{item.slotDate?.slice(0, 10)} · {item.session}</div></td>
                  <td className="px-3 py-3">{item.citizen.displayName || item.citizen.reference}<span className="block text-xs text-gray-500">{item.citizen.reference}</span></td>
                  <td className="px-3 py-3">{label(item.officeId?.name)} · {item.windowId?.number ?? '—'} ({t.admin.portal.offices.floor} {item.windowId?.floor ?? '—'})</td>
                  <td className="px-3 py-3">{label(item.serviceId?.name)}</td>
                  <td className="px-3 py-3">{item.queueNumber}</td>
                  <td className="px-3 py-3">{statusLabel(item.status)}</td>
                </tr>)}</tbody>
              </table>
              {!historyAppointments.length && <p className="py-8 text-center text-sm text-gray-500">{copy.noAppointmentHistory}</p>}
            </div>
          )}
          <footer className="flex items-center justify-between gap-4 text-sm text-gray-500">
            <span>{historyTotal} · {copy.pageOf.replace('{page}', String(historyPage)).replace('{pages}', String(historyPages))}</span>
            <div className="flex gap-2">
              <button type="button" disabled={historyPage <= 1 || historyLoading} onClick={() => setHistoryPage((page) => page - 1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50 dark:border-gray-700">{copy.previousPage}</button>
              <button type="button" disabled={historyPage >= historyPages || historyLoading} onClick={() => setHistoryPage((page) => page + 1)} className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50 dark:border-gray-700">{copy.nextPage}</button>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}
