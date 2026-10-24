import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { adminWorkflowRequest } from '@/api/adminWorkflows'

type Name = { en?: string; am?: string; or?: string }
type Office = { _id: string; name: Name }
type WindowOption = { _id: string; number: string | number; floor: number }
type ServiceOption = { _id: string; name: Name }
type Appointment = {
  _id: string
  appointmentReference: string
  slotDate: string
  session: string
  queueNumber: number
  status: string
  citizen: { reference: string; displayName: string }
  officeId?: { name?: Name }
  windowId?: { number?: string | number; floor?: number }
  serviceId?: { name?: Name }
  deliveryId?: { status?: string }
}
type PageData = { bookings: Appointment[]; pagination: { page: number; pages: number; total: number } }

const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900'
const inputClass = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white'

export default function AdminCitizens() {
  const { t, language } = useLanguage()
  const copy = t.admin.workforce
  const [history, setHistory] = useState(false)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Appointment[]>([])
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [offices, setOffices] = useState<Office[]>([])
  const [windows, setWindows] = useState<WindowOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [filters, setFilters] = useState({ search: '', from: '', to: '', status: '', officeId: '', windowId: '', serviceId: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
      const response = await adminWorkflowRequest<PageData>(`/admin/citizens${history ? '/history' : ''}?${params}`)
      setRows(response.bookings)
      setPages(Math.max(1, response.pagination.pages))
      setTotal(response.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [filters, history, page, t.admin.failedToLoad])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizations`).then(async (response) => {
        if (!response.ok) throw new Error(`Office request failed: HTTP ${response.status}`)
        return response.json() as Promise<Office[]>
      }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/windows`).then(async (response) => {
        if (!response.ok) throw new Error(`Window request failed: HTTP ${response.status}`)
        return response.json() as Promise<WindowOption[]>
      }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/services`).then(async (response) => {
        if (!response.ok) throw new Error(`Service request failed: HTTP ${response.status}`)
        return response.json() as Promise<ServiceOption[]>
      }),
    ]).then(([officeList, windowList, serviceList]) => {
      if (!active) return
      setOffices(officeList)
      setWindows(windowList)
      setServices(serviceList)
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    })
    return () => { active = false }
  }, [t.admin.failedToLoad])

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const name = (value?: Name) => value?.[language] || value?.en || value?.am || value?.or || '—'
  const label = (key: string) => {
    const values: Record<string, string> = {
      CONFIRMED: 'Confirmed', CHECKED_IN: 'Checked in', IN_SERVICE: 'In service',
      AWAITING_APPROVAL: 'Awaiting approval', DELIVERED: 'Delivered', REJECTED: 'Rejected',
      NO_SHOW: 'No show', CANCELLED: 'Cancelled',
    }
    return values[key] || key.replace(/_/g, ' ')
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.citizens}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{copy.visibilityNotice}</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className={`${inputClass} inline-flex items-center gap-2`}><RefreshCw className="h-4 w-4" />{t.common.retry}</button>
      </header>

      <div className="flex gap-2">
        <button onClick={() => { setHistory(false); setPage(1) }} className={`rounded-lg px-4 py-2 text-sm font-medium ${!history ? 'bg-brand-green text-white' : 'bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}>{copy.activeCitizens}</button>
        <button onClick={() => { setHistory(true); setPage(1) }} className={`rounded-lg px-4 py-2 text-sm font-medium ${history ? 'bg-brand-green text-white' : 'bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}>{copy.appointmentHistory}</button>
      </div>

      <section className={`${panelClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
        <input className={inputClass} aria-label={copy.search} placeholder={copy.search} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
        <label className="grid gap-1 text-xs text-gray-500">{copy.from}<input className={inputClass} type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></label>
        <label className="grid gap-1 text-xs text-gray-500">{copy.to}<input className={inputClass} type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></label>
        <select className={inputClass} aria-label={copy.status} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">{copy.status}: {copy.all}</option>{['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'DELIVERED', 'REJECTED', 'NO_SHOW'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select>
        <select className={inputClass} aria-label={copy.office} value={filters.officeId} onChange={(event) => updateFilter('officeId', event.target.value)}><option value="">{copy.office}: {copy.all}</option>{offices.map((office) => <option key={office._id} value={office._id}>{name(office.name)}</option>)}</select>
        <select className={inputClass} aria-label={copy.window} value={filters.windowId} onChange={(event) => updateFilter('windowId', event.target.value)}><option value="">{copy.window}: {copy.all}</option>{windows.map((window) => <option key={window._id} value={window._id}>{copy.location} {window.number} · {window.floor}</option>)}</select>
        <select className={inputClass} aria-label={copy.service} value={filters.serviceId} onChange={(event) => updateFilter('serviceId', event.target.value)}><option value="">{copy.service}: {copy.all}</option>{services.map((service) => <option key={service._id} value={service._id}>{name(service.name)}</option>)}</select>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      <section className={`${panelClass} overflow-x-auto p-0`}>
        {loading ? <p className="p-6 text-sm text-gray-500">{copy.loading}</p> : rows.length === 0 ? <p className="p-6 text-sm text-gray-500">{copy.noAppointments}</p> : (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800"><tr>{[copy.reference, copy.citizen, copy.date, copy.service, copy.office, copy.location, copy.status, copy.deliveryStatus].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((booking) => <tr key={booking._id}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{booking.appointmentReference}<span className="block text-xs text-gray-500">{copy.queue} #{booking.queueNumber}</span></td>
                <td className="px-4 py-3">{booking.citizen.displayName || booking.citizen.reference}<span className="block text-xs text-gray-500">{booking.citizen.reference}</span></td>
                <td className="px-4 py-3">{new Date(booking.slotDate).toLocaleDateString()}<span className="block text-xs text-gray-500">{booking.session}</span></td>
                <td className="px-4 py-3">{name(booking.serviceId?.name)}</td>
                <td className="px-4 py-3">{name(booking.officeId?.name)}</td>
                <td className="px-4 py-3">{booking.windowId ? `${booking.windowId.number} · ${booking.windowId.floor}` : '—'}</td>
                <td className="px-4 py-3">{label(booking.status)}</td>
                <td className="px-4 py-3">{booking.deliveryId?.status?.replace(/_/g, ' ') || '—'}</td>
              </tr>)}
            </tbody>
          </table>
        )}
      </section>
      <footer className="flex items-center justify-between gap-4 text-sm text-gray-500">
        <span>{total} · {copy.page} {page} {copy.of} {pages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className={`${inputClass} disabled:opacity-50`}>{copy.previous}</button>
          <button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className={`${inputClass} disabled:opacity-50`}>{copy.next}</button>
        </div>
      </footer>
    </main>
  )
}
