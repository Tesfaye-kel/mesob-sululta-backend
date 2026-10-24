import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, Download, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { ADMIN_TOKEN_KEY } from '@/api/admin'
import type { EmployeeType } from '@/types/employee'
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
  employeeId?: { name?: string }
}

interface Delivery {
  _id: string
  outcome: string
  deliveryDetails: string
  actualAttendanceAt?: string
  appointmentId?: { appointmentReference?: string; slotDate?: string; session?: string }
  employeeId?: { name?: string }
  serviceId?: { name?: { en?: string } }
}

interface Office {
  _id: string
  name: { en?: string }
}

interface Employee {
  _id: string
  name: string
  email: string
  status: string
  employeeType: EmployeeType
  createdBy?: string
  profile?: {
    officeId?: Office | string | null
  }
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

export default function AdminAppointments() {
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
  const [section, setSection] = useState<'appointments' | 'approvals' | 'employees'>('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [capacityWindows, setCapacityWindows] = useState<WindowCapacity[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [capacityDate, setCapacityDate] = useState(todayInAddis)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [officeId, setOfficeId] = useState('')
  const [invitationLink, setInvitationLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

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

  const loadEmployees = useCallback(async () => {
    const result = await adminRequest<{ employees: Employee[] }>('/employees')
    setEmployees(result.employees)
  }, [])

  const loadApprovals = useCallback(async () => {
    const result = await adminRequest<{ deliveries: Delivery[] }>('/admin/service-deliveries/approvals')
    setDeliveries(result.deliveries)
  }, [])

  const loadCapacity = useCallback(async () => {
    const result = await adminRequest<{ windows: WindowCapacity[] }>(`/admin/appointments/capacity?date=${encodeURIComponent(capacityDate)}`)
    setCapacityWindows(result.windows)
  }, [capacityDate])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([loadAppointments(), loadEmployees(), loadApprovals(), loadCapacity()])
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [loadAppointments, loadEmployees, loadApprovals, loadCapacity])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    fetch(`${BASE}/organizations`).then(async (response) => {
      if (!response.ok) throw new Error(`Office request failed: HTTP ${response.status}`)
      return response.json() as Promise<Office[]>
    }).then((officeList) => {
      setOffices(officeList)
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    })
  }, [])

  const reviewDelivery = async (deliveryId: string, decision: 'approve' | 'reject') => {
    const notes = reviewNotes[deliveryId] || ''
    if (decision === 'reject' && notes.trim().length < 3) {
      setError(copy.rejectionRequired)
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminRequest(`/admin/service-deliveries/${deliveryId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, reviewNotes: notes }),
      })
      setNotice(`Service delivery ${decision}d.`)
      await Promise.all([loadApprovals(), loadAppointments()])
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  const employeeAction = async (employeeId: string, action: 'approve' | 'suspend' | 'active') => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (action === 'approve') {
        await adminRequest(`/employees/${employeeId}/approve`, { method: 'POST', body: '{}' })
      } else {
        await adminRequest(`/employees/${employeeId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: action }),
        })
      }
      setNotice(action === 'approve' ? 'Employee approved. Assign their office and weekly work schedule before activation.' : `Employee ${action === 'active' ? 'reactivated' : 'suspended'}.`)
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update employee.')
    } finally {
      setBusy(false)
    }
  }

  const assignEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedEmployee || !officeId) {
      setError(copy.chooseEmployeeOffice)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    setInvitationLink('')
    try {
      const result = await adminRequest<{ message: string; invitationToken?: string }>(`/employees/${selectedEmployee}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ officeId }),
      })
      setNotice(result.message)
      if (result.invitationToken) {
        setInvitationLink(`${window.location.origin}/employe/activate?token=${encodeURIComponent(result.invitationToken)}`)
      }
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.description}</p>
        </div>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700" disabled={loading}>
          <RefreshCw className="h-4 w-4" /> {copy.refresh}
        </button>
      </div>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">{notice}</div>}
      {invitationLink && <div className={panelClass}><p className="mb-2 text-sm font-semibold">{copy.activationLink}</p><p className="mb-2 text-xs text-gray-500">{copy.activationHint}</p><input readOnly value={invitationLink} onFocus={(event) => event.currentTarget.select()} className={`${inputClass} w-full`} /></div>}

      <div className="flex flex-wrap gap-2">
        {([
          ['appointments', copy.appointments],
          ['approvals', `${copy.attendanceApprovals}${deliveries.length ? ` (${deliveries.length})` : ''}`],
          ['employees', copy.employees],
        ] as const).map(([key, text]) => (
          <button key={key} onClick={() => setSection(key)} className={`rounded-lg px-4 py-2 text-sm font-medium ${section === key ? 'bg-brand-green text-white' : 'bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}>{text}</button>
        ))}
      </div>

      {section === 'appointments' && (
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
                <thead className="border-b text-xs uppercase text-gray-500"><tr>{[copy.referenceDate, copy.officeWindow, copy.service, copy.queue, copy.employee, copy.status].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
                <tbody>{appointments.map((item) => <tr key={item._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-3"><div className="font-medium">{item.appointmentReference}</div><div className="text-xs text-gray-500">{item.slotDate?.slice(0, 10)} · {item.session}</div></td>
                  <td className="px-3 py-3">{label(item.officeId?.name)} · {item.windowId?.number ?? '—'} ({t.admin.portal.offices.floor} {item.windowId?.floor ?? '—'})</td>
                  <td className="px-3 py-3">{label(item.serviceId?.name)}</td>
                  <td className="px-3 py-3">{item.queueNumber}</td>
                  <td className="px-3 py-3">{item.employeeId?.name || '—'}</td>
                  <td className="px-3 py-3">{statusLabel(item.status)}</td>
                </tr>)}</tbody>
              </table>
              {!appointments.length && <p className="py-8 text-center text-sm text-gray-500">{copy.noAppointments}</p>}
            </div>
          )}
        </section>
        </div>
      )}

      {section === 'approvals' && (
        <section className="space-y-3">
          {deliveries.map((item) => <article key={item._id} className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1"><h2 className="font-semibold">{label(item.serviceId?.name)} · {item.appointmentId?.appointmentReference || copy.appointment}</h2><p className="mt-1 text-xs text-gray-500">{item.employeeId?.name || copy.employee} · {item.appointmentId?.slotDate?.slice(0, 10)} · {item.appointmentId?.session}</p><p className="mt-1 text-xs text-gray-500">{copy.actualAttendance}: {item.actualAttendanceAt ? new Date(item.actualAttendanceAt).toLocaleString() : copy.notRecorded}</p><p className="mt-3 text-sm">{item.outcome}</p>{item.deliveryDetails && <p className="mt-2 text-sm text-gray-500">{item.deliveryDetails}</p>}
                <label className="mt-3 block text-xs text-gray-500">{copy.reviewNotes}<textarea className={`${inputClass} mt-1 w-full`} rows={2} maxLength={2000} value={reviewNotes[item._id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [item._id]: event.target.value }))} /></label>
              </div>
              <div className="flex gap-2"><button disabled={busy} onClick={() => void reviewDelivery(item._id, 'approve')} className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-sm text-white disabled:opacity-50"><Check className="h-4 w-4" />{copy.approve}</button><button disabled={busy} onClick={() => void reviewDelivery(item._id, 'reject')} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">{copy.reject}</button></div>
            </div>
          </article>)}
          {!deliveries.length && <div className={panelClass}><p className="text-center text-sm text-gray-500">{copy.noAttendanceApprovals}</p></div>}
        </section>
      )}

      {section === 'employees' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <form onSubmit={assignEmployee} className={`${panelClass} space-y-3`}>
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5" />{copy.assignEmployee}</h2>
            <select required value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)} className={`${inputClass} w-full`}><option value="">{copy.selectApprovedEmployee}</option>{employees.filter((item) => ['approved', 'active'].includes(item.status)).map((item) => <option key={item._id} value={item._id}>{item.name} · {item.email} · {item.status}</option>)}</select>
            <select required value={officeId} onChange={(event) => setOfficeId(event.target.value)} className={`${inputClass} w-full`}><option value="">{copy.selectOffice}</option>{offices.map((office) => <option key={office._id} value={office._id}>{label(office.name)}</option>)}</select>
            <p className="text-sm text-gray-500">{copy.assignmentHint}</p>
            <button disabled={busy || !officeId} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{copy.saveAssignment}</button>
          </form>

          <section className={`${panelClass} xl:col-span-2`}>
            <h2 className="mb-4 font-semibold">{copy.employeeRecords}</h2>
            <div className="space-y-3">{employees.map((employee) => <article key={employee._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div><p className="font-medium">{employee.name} <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{employee.status}</span></p><p className="text-xs text-gray-500">{employee.email} · {label(typeof employee.profile?.officeId === 'string' ? employee.profile.officeId : employee.profile?.officeId?.name)}</p></div>
              <div className="flex gap-2">{employee.status === 'pending' && <button disabled={busy} onClick={() => void employeeAction(employee._id, 'approve')} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700">{copy.approve}</button>}{employee.status === 'active' && <button disabled={busy} onClick={() => void employeeAction(employee._id, 'suspend')} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-900 dark:text-red-300">{t.admin.workforce.employeeManagement.suspend}</button>}{employee.status === 'suspended' && <button disabled={busy} onClick={() => void employeeAction(employee._id, 'active')} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700">{t.admin.workforce.employeeManagement.reactivate}</button>}</div>
            </article>)}</div>
            {!employees.length && <p className="py-5 text-center text-sm text-gray-500">{copy.noEmployees}</p>}
          </section>
        </div>
      )}
    </div>
  )
}
