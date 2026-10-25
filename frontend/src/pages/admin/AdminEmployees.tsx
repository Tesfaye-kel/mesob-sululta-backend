import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Search, Users } from 'lucide-react'
import { adminWorkflowRequest } from '@/api/adminWorkflows'
import { employeeTypes, type EmployeeType } from '@/types/employee'
import { useLanguage } from '@/contexts/LanguageContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900'
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white'
interface Office {
  _id: string
  name: { en?: string }
}

interface Shift {
  day: string
  shift: string
  startTime: string
  endTime: string
}

interface Employee {
  _id: string
  name: string
  email: string
  status: string
  employeeType: EmployeeType
  createdBy?: { name?: string; email?: string } | string | null
  createdAt?: string
  phone?: string
  profile?: {
    officeId?: Office | string | null
    officeAssignmentLabel?: string
    nationalIdLastFour?: string
    jobTitle?: string
    schedule?: Shift[]
  }
}

interface RemovalRequest {
  _id: string
  targetType: 'citizen' | 'employee'
  createdAt: string
  reason: string
  requestedBy?: { name?: string; email?: string }
  target: {
    name: string
    detail: string
    status: string
    employeeType?: EmployeeType
    jobTitle?: string
    maskedNationalId: string
  }
}

export default function AdminEmployees() {
  const { t } = useLanguage()
  const copy = t.admin.workforce.employeeManagement
  const employeeTypeLabels: Record<EmployeeType, string> = {
    service_window_officer: copy.serviceWindowOfficer,
    security_guard: copy.securityGuard,
    floor_window_manager: copy.floorWindowManager,
    receptionist: copy.receptionist,
    it_support_officer: copy.itSupportOfficer,
    service_requirement_manager: copy.serviceRequirementManager,
  }
  const statusLabel = (status: string) => ({
    pending: copy.pendingStatus,
    approved: copy.approvedStatus,
    active: copy.activeStatus,
    suspended: copy.suspendedStatus,
  }[status] || status)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<EmployeeType>(employeeTypes[0])
  const [removalRequests, setRemovalRequests] = useState<RemovalRequest[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [officeId, setOfficeId] = useState('')
  const [officeAssignmentLabel, setOfficeAssignmentLabel] = useState('')
  const [manualOffice, setManualOffice] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [schedule, setSchedule] = useState<Shift[]>([])
  const [shift, setShift] = useState<Shift>({ day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' })
  const [invitationLink, setInvitationLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const [employeeResult, removalResult] = await Promise.all([
      adminWorkflowRequest<{ employees: Employee[] }>('/employees'),
      adminWorkflowRequest<{ requests: RemovalRequest[] }>('/admin/account-removal-requests'),
    ])
    setEmployees(employeeResult.employees)
    setRemovalRequests(removalResult.requests)
  }, [])

  const selectedEmployeeRecord = employees.find((employee) => employee._id === selectedEmployee)
  const categoryEmployees = employees.filter((employee) => employee.employeeType === selectedEmployeeType)
  const normalizedEmployeeSearch = employeeSearch.trim().toLocaleLowerCase()
  const visibleCategoryEmployees = categoryEmployees.filter((employee) => {
    if (!normalizedEmployeeSearch) return true
    const values = [
      employee.name,
      employee.email,
      employee.phone,
      employee.profile?.nationalIdLastFour,
      employee.profile?.jobTitle,
      employee.profile?.officeAssignmentLabel,
      typeof employee.profile?.officeId === 'object' ? employee.profile.officeId?.name?.en : employee.profile?.officeId,
      employee.status,
    ]
    return values.some((value) => value?.toLocaleLowerCase().includes(normalizedEmployeeSearch))
  })
  const pendingCategoryCount = visibleCategoryEmployees.filter((employee) => employee.status === 'pending').length

  const reviewRemoval = async (request: RemovalRequest, decision: 'approve' | 'reject') => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(
        `/admin/account-removal-requests/${request._id}/review`,
        { method: 'POST', body: JSON.stringify({ decision }) }
      )
      setNotice(result.message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load().catch((err: unknown) =>     setError(err instanceof Error ? err.message : t.admin.failedToLoad))
    fetch(`${BASE}/organizations`).then(async (response) => {
      if (!response.ok) throw new Error(`Office request failed: HTTP ${response.status}`)
      return response.json() as Promise<Office[]>
    }).then((officeList) => {
      setOffices(officeList)
    }).catch((err: unknown) =>     setError(err instanceof Error ? err.message : t.admin.failedToLoad))
  }, [load])

  const changeStatus = async (employee: Employee, status: 'active' | 'suspended') => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(`/employees/${employee._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice(result.message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  const approve = async (employee: Employee) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(`/employees/${employee._id}/approve`, { method: 'POST' })
      setNotice(result.message)
      await load()
      setSelectedEmployee(employee._id)
      setOfficeId('')
      setOfficeAssignmentLabel('')
      setManualOffice(false)
      setJobTitle(employee.profile?.jobTitle || employeeTypeLabels[employee.employeeType])
      setSchedule([])
      setInvitationLink('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  const reject = async (employee: Employee) => {
    if (!window.confirm(copy.rejectConfirm.replace('{name}', employee.name))) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(`/employees/${employee._id}/reject`, { method: 'POST' })
      setNotice(result.message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  const selectEmployee = (id: string) => {
    const employee = employees.find((item) => item._id === id)
    setSelectedEmployee(id)
    const employeeOffice = employee?.profile?.officeId
    setOfficeId(typeof employeeOffice === 'string' ? employeeOffice : employeeOffice?._id || '')
    setOfficeAssignmentLabel(employee?.profile?.officeAssignmentLabel || '')
    setManualOffice(!employeeOffice && Boolean(employee?.profile?.officeAssignmentLabel))
    setJobTitle(employee?.profile?.jobTitle || '')
    setSchedule([...(employee?.profile?.schedule || [])])
    setInvitationLink('')
    setError('')
  }

  const addShift = () => {
    if (!shift.shift.trim() || shift.startTime >= shift.endTime) {
      setError(copy.invalidShift)
      return
    }
    const overlaps = schedule.some((item) =>
      item.day === shift.day && shift.startTime < item.endTime && shift.endTime > item.startTime
    )
    if (overlaps) {
      setError(copy.overlappingShift)
      return
    }
    setSchedule((current) => [...current, shift])
    setError('')
  }

  const saveSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; invitationToken?: string }>(`/employees/${selectedEmployee}/work-schedule`, {
        method: 'PUT',
        body: JSON.stringify({ jobTitle, schedule }),
      })
      setNotice(result.message)
      if (result.invitationToken) {
        setInvitationLink(`${window.location.origin}/employe/activate?token=${encodeURIComponent(result.invitationToken)}`)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  const saveAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedEmployee || (manualOffice ? officeAssignmentLabel.trim().length < 2 : !officeId)) {
      setError(copy.chooseEmployeeOffice)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; invitationToken?: string }>(`/employees/${selectedEmployee}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          ...(manualOffice ? { officeAssignmentLabel: officeAssignmentLabel.trim() } : { officeId }),
        }),
      })
      setNotice(result.message)
      if (result.invitationToken) {
        setInvitationLink(`${window.location.origin}/employe/activate?token=${encodeURIComponent(result.invitationToken)}`)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.admin.employees}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.description}</p></div>
        <button onClick={() => void load().catch((err: unknown) => setError(err instanceof Error ? err.message : t.admin.failedToLoad))} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-gray-700"><RefreshCw className="h-4 w-4" />{t.admin.portal.common.refresh}</button>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
      <section className={`${panelClass} flex flex-wrap items-center justify-between gap-4`} aria-label={copy.total}>
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{copy.total}</h2>
          <p className="mt-1 text-3xl font-bold text-brand-green">{employees.length}</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{copy.totalHint}</p>
      </section>
      {removalRequests.length > 0 && <section className={`${panelClass} space-y-3 border-l-4 border-l-red-600`} aria-labelledby="removal-requests-title">
        <h2 id="removal-requests-title" className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300"><AlertTriangle className="h-5 w-5" />{copy.removalRequests} ({removalRequests.length})</h2>
        {removalRequests.map((request) => <article key={request._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <div>
            <p className="font-semibold text-red-900 dark:text-red-200">{request.target.name} <span className="ml-2 rounded-full bg-red-200 px-2 py-0.5 text-xs text-red-900">{request.targetType === 'citizen' ? copy.citizenRemoval : copy.employeeRemoval}</span></p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{request.target.detail} · ID {request.target.maskedNationalId} · {request.target.status}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{copy.requestedBy} {request.requestedBy?.name || copy.registrar} · {new Date(request.createdAt).toLocaleString()}</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void reviewRemoval(request, 'approve')} disabled={busy} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{copy.approveRemoval}</button>
            <button onClick={() => void reviewRemoval(request, 'reject')} disabled={busy} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700">{copy.reject}</button>
          </div>
        </article>)}
      </section>}
      <section className={`${panelClass} space-y-3`}>
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Users className="h-5 w-5" />{copy.categories}</h2>
          <p className="mt-1 text-sm text-gray-500">{copy.categoryHint}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="tablist" aria-label={copy.categories}>
          {employeeTypes.map((type) => {
            const categoryCount = employees.filter((employee) => employee.employeeType === type).length
            const pendingCount = employees.filter((employee) => employee.employeeType === type && employee.status === 'pending').length
            const selected = selectedEmployeeType === type
            return <button
              key={type}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedEmployeeType(type)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${selected ? 'border-brand-green bg-brand-green/10 text-brand-green dark:bg-brand-green/20' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}
            >
              <span className="font-medium">{employeeTypeLabels[type]}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{categoryCount}</span>
                {pendingCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white" aria-label={copy.waitingForApproval.replace('{count}', String(pendingCount))}>{pendingCount} {copy.pending}</span>}
              </span>
            </button>
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <h3 className="font-semibold">{employeeTypeLabels[selectedEmployeeType]} ({visibleCategoryEmployees.length})</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">{copy.waitingApproval}: {pendingCategoryCount}</p>
        </div>
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={employeeSearch}
            onChange={(event) => setEmployeeSearch(event.target.value)}
            placeholder={copy.searchEmployees}
            aria-label={copy.searchEmployees}
            className={`${inputClass} pl-10`}
          />
        </label>
        {!visibleCategoryEmployees.length && <p className="py-4 text-sm text-gray-500">{categoryEmployees.length ? copy.noEmployeeSearchResults : copy.noCategoryEmployees}</p>}
        {!!visibleCategoryEmployees.length && <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] table-fixed text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="w-[16%] px-2 py-3">{copy.employeeId}</th>
                <th className="w-[18%] px-2 py-3">{copy.contact}</th>
                <th className="w-[17%] px-2 py-3">{copy.categoryJob}</th>
                <th className="w-[17%] px-2 py-3">{copy.submittedOffice}</th>
                <th className="w-[10%] px-2 py-3">{copy.status}</th>
                <th className="sticky right-0 z-10 w-[22%] bg-gray-50 px-2 py-3 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.35)] dark:bg-gray-800">{copy.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleCategoryEmployees.map((employee) => {
                const employeeOffice = employee.profile?.officeId
                const officeName = typeof employeeOffice === 'string'
                  ? employeeOffice
                  : employeeOffice?.name?.en || employee.profile?.officeAssignmentLabel || copy.officeUnassigned
                const creatorName = typeof employee.createdBy === 'object' ? employee.createdBy?.name || employee.createdBy?.email || copy.registrar : copy.registrar
                return <tr key={employee._id} className="align-middle">
                  <td className="break-words px-2 py-3 font-semibold">{employee.name}<p className="mt-1 text-xs font-normal text-gray-500">ID ********{employee.profile?.nationalIdLastFour || '****'}</p></td>
                  <td className="break-words px-2 py-3">{employee.email}<p className="mt-1 text-xs text-gray-500">{employee.phone || copy.noPhone}</p></td>
                  <td className="break-words px-2 py-3">{employeeTypeLabels[employee.employeeType]}<p className="mt-1 text-xs text-gray-500">{employee.profile?.jobTitle || copy.jobTitleMissing}</p></td>
                  <td className="break-words px-2 py-3">{creatorName}<p className="mt-1 text-xs text-gray-500">{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : ''}</p><p className="mt-1 text-xs text-gray-500">{officeName}</p></td>
                  <td className="break-words px-2 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize dark:bg-gray-800">{statusLabel(employee.status)}</span></td>
                  <td className="sticky right-0 z-10 bg-white px-2 py-3 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.35)] dark:bg-gray-900"><div className="flex flex-col items-start gap-1.5">
                    {employee.status === 'pending' && <>
                      <button onClick={() => void approve(employee)} disabled={busy} className="w-full whitespace-normal rounded-lg bg-brand-green px-2 py-2 text-xs font-semibold leading-tight text-white disabled:opacity-50">{copy.approveAssign}</button>
                      <button onClick={() => void reject(employee)} disabled={busy} className="w-full whitespace-normal rounded-lg border border-red-300 px-2 py-2 text-xs font-semibold leading-tight text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300">{copy.rejectRegistration}</button>
                    </>}
                    {['approved', 'active'].includes(employee.status) && <button onClick={() => selectEmployee(employee._id)} className="w-full rounded-lg border px-2 py-2 text-xs dark:border-gray-700">{copy.manage}</button>}
                    {employee.status === 'active' && <button onClick={() => void changeStatus(employee, 'suspended')} disabled={busy} className="w-full rounded-lg border border-red-300 px-2 py-2 text-xs text-red-700 disabled:opacity-50">{copy.suspend}</button>}
                    {employee.status === 'suspended' && <button onClick={() => void changeStatus(employee, 'active')} disabled={busy} className="w-full rounded-lg border px-2 py-2 text-xs dark:border-gray-700 disabled:opacity-50">{copy.reactivate}</button>}
                  </div></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>}
      </section>

      {selectedEmployeeRecord && <section className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={saveAssignment} className={`${panelClass} space-y-3`}>
          <div><h2 className="font-semibold">{copy.officeAssignment}</h2><p className="text-sm text-gray-500">{selectedEmployeeRecord.name} · {statusLabel(selectedEmployeeRecord.status)}. {copy.officeServicesHint}</p></div>
          <label className="block text-sm">{copy.office}
            {manualOffice
              ? <input required minLength={2} maxLength={120} value={officeAssignmentLabel} onChange={(event) => setOfficeAssignmentLabel(event.target.value)} placeholder={copy.enterOffice} className={`${inputClass} mt-1`} />
              : <select required value={officeId} onChange={(event) => setOfficeId(event.target.value)} className={`${inputClass} mt-1`}>
                  <option value="">{copy.selectOffice}</option>{offices.map((office) => <option key={office._id} value={office._id}>{office.name.en || copy.office}</option>)}
                </select>}
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={manualOffice} onChange={(event) => {
            const enabled = event.target.checked
            setManualOffice(enabled)
            setOfficeId('')
            if (!enabled) setOfficeAssignmentLabel('')
          }} />{copy.enterOfficeManually}</label>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {manualOffice ? copy.manualOfficeHint : copy.officeServicesHint}
          </p>
          <button disabled={busy || (manualOffice ? officeAssignmentLabel.trim().length < 2 : !officeId)} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{copy.saveOffice}</button>
        </form>

        <form onSubmit={saveSchedule} className={`${panelClass} space-y-3`}>
          <div><h2 className="font-semibold">{copy.jobSchedule}</h2><p className="text-sm text-gray-500">{copy.scheduleHint}</p></div>
          <input required minLength={2} maxLength={120} aria-label={copy.jobTitle} placeholder={copy.jobTitle} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className={inputClass} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select aria-label={copy.day} value={shift.day} onChange={(event) => setShift({ ...shift, day: event.target.value })} className={inputClass}>{['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => <option key={day} value={day}>{copy[day as keyof typeof copy]}</option>)}</select>
            <select aria-label={copy.shift} value={shift.shift} onChange={(event) => {
              const name = event.target.value
              const hours = name === 'Morning' ? { startTime: '08:00', endTime: '12:00' }
                : name === 'Afternoon' ? { startTime: '13:30', endTime: '17:30' }
                  : { startTime: '08:00', endTime: '17:30' }
              setShift({ ...shift, shift: name, ...hours })
            }} className={inputClass}><option value="Morning">{copy.morning}</option><option value="Afternoon">{copy.afternoon}</option><option value="Full day">{copy.fullDay}</option></select>
            <input aria-label={copy.startTime} type="time" value={shift.startTime} onChange={(event) => setShift({ ...shift, startTime: event.target.value })} className={inputClass} />
            <input aria-label={copy.endTime} type="time" value={shift.endTime} onChange={(event) => setShift({ ...shift, endTime: event.target.value })} className={inputClass} />
          </div>
          <button type="button" onClick={addShift} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700">{copy.addShift}</button>
          {!schedule.length && <p className="text-sm text-gray-500">{copy.noShifts}</p>}
          <ul className="space-y-1 text-sm">{schedule.map((item, index) => <li key={`${item.day}-${item.startTime}-${index}`} className="flex justify-between gap-2 capitalize">{item.day} · {item.shift} · {item.startTime}–{item.endTime}<button type="button" onClick={() => setSchedule((current) => current.filter((_, row) => row !== index))} className="text-red-700 underline">{copy.remove}</button></li>)}</ul>
          <div className="flex gap-2"><button disabled={busy || !schedule.length} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{copy.saveJobSchedule}</button><button type="button" onClick={() => setSelectedEmployee('')} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700">{copy.close}</button></div>
        </form>
      </section>}

      {invitationLink && <section className={panelClass}><p className="mb-2 font-semibold">{copy.setupLink}</p><p className="mb-2 text-sm text-gray-500">{copy.setupLinkHint}</p><input readOnly value={invitationLink} onFocus={(event) => event.currentTarget.select()} className={inputClass} /></section>}
    </main>
  )
}
