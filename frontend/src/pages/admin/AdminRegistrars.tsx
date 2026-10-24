import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { adminWorkflowRequest } from '@/api/adminWorkflows'
import { useLanguage } from '@/contexts/LanguageContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900'
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white'
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface Shift {
  day: string
  shift: string
  startTime: string
  endTime: string
}

interface Office {
  _id: string
  name: { en?: string; am?: string; or?: string }
}

interface Registrar {
  _id: string
  name: string
  email: string
  status: string
  createdAt: string
  maskedNationalId?: string
  profile?: {
    officeId?: Office | string | null
    officeAssignmentLabel?: string
    schedule?: Shift[]
  }
}

function ScheduleEditor({ schedule, onChange }: { schedule: Shift[]; onChange: (schedule: Shift[]) => void }) {
  const { t } = useLanguage()
  const copy = t.admin.registrarManagement
  const dayNames: Record<string, string> = {
    monday: copy.monday, tuesday: copy.tuesday, wednesday: copy.wednesday, thursday: copy.thursday,
    friday: copy.friday, saturday: copy.saturday, sunday: copy.sunday,
  }
  const [draft, setDraft] = useState<Shift>({ day: 'monday', shift: 'Morning', startTime: '08:00', endTime: '12:00' })
  const [validationError, setValidationError] = useState('')
  const selectShift = (shift: string) => setDraft({
    ...draft,
    shift,
    ...(shift === 'Morning' ? { startTime: '08:00', endTime: '12:00' } : { startTime: '13:00', endTime: '17:00' }),
  })

  const addShift = () => {
    if (draft.startTime >= draft.endTime) {
      setValidationError(copy.shiftValidation)
      return
    }
    if (schedule.some((item) => item.day === draft.day && draft.startTime < item.endTime && draft.endTime > item.startTime)) {
      setValidationError(copy.shiftOverlap)
      return
    }
    onChange([...schedule, draft])
    setValidationError('')
  }

  return <div className="space-y-3">
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <select className={inputClass} value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })}>
        {days.map((day) => <option key={day} value={day}>{dayNames[day]}</option>)}
      </select>
      <select className={inputClass} value={draft.shift} onChange={(event) => selectShift(event.target.value)}><option value="Morning">{copy.morning}</option><option value="Afternoon">{copy.afternoon}</option></select>
      <input className={inputClass} type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} />
      <input className={inputClass} type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} />
    </div>
    <button type="button" onClick={addShift} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700"><Plus size={15} />{copy.addShift}</button>
    {validationError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{validationError}</p>}
    {!schedule.length ? <p className="text-sm text-gray-500">{copy.noShifts}</p> : <div className="space-y-2">
      {schedule.map((item, index) => <div key={`${item.day}-${item.startTime}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
        <span>{dayNames[item.day] || item.day} · {item.shift === 'Morning' ? copy.morning : copy.afternoon} · {item.startTime}–{item.endTime}</span>
        <button type="button" aria-label={copy.removeShift.replace('{day}', dayNames[item.day] || item.day).replace('{shift}', item.shift === 'Morning' ? copy.morning : copy.afternoon)} onClick={() => onChange(schedule.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 size={15} /></button>
      </div>)}
    </div>}
  </div>
}

export default function AdminRegistrars() {
  const { t } = useLanguage()
  const copy = t.admin.registrarManagement
  const [registrars, setRegistrars] = useState<Registrar[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [schedule, setSchedule] = useState<Shift[]>([])
  const [newSchedule, setNewSchedule] = useState<Shift[]>([])
  const [manageForm, setManageForm] = useState({ name: '', email: '', officeId: '', officeAssignmentLabel: '' })
  const [manageManualOffice, setManageManualOffice] = useState(false)
  const [form, setForm] = useState({ name: '', nationalId: '', email: '', password: '', officeId: '', officeAssignmentLabel: '' })
  const [manualOffice, setManualOffice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRegistrars = useCallback(async () => {
    const result = await adminWorkflowRequest<{ registrars: Registrar[] }>('/admin/registrars')
    setRegistrars(result.registrars)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      adminWorkflowRequest<{ registrars: Registrar[] }>('/admin/registrars'),
      fetch(`${BASE}/organizations`).then(async (response) => {
        if (!response.ok) throw new Error(`Office request failed: HTTP ${response.status}`)
        return response.json() as Promise<Office[]>
      }),
    ]).then(([registrarResult, officeList]) => {
      if (!active) return
      setRegistrars(registrarResult.registrars)
      setOffices(officeList)
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : copy.couldNotLoad)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [copy.couldNotLoad])

  const selectRegistrar = (registrar: Registrar) => {
    setSelectedId(registrar._id)
    setSchedule([...(registrar.profile?.schedule || [])])
    const currentOfficeId = registrar.profile?.officeId
    const officeId = typeof currentOfficeId === 'string' ? currentOfficeId : currentOfficeId?._id || ''
    const officeAssignmentLabel = registrar.profile?.officeAssignmentLabel || ''
    setManageForm({
      name: registrar.name,
      email: registrar.email,
      officeId,
      officeAssignmentLabel,
    })
    setManageManualOffice(!officeId && Boolean(officeAssignmentLabel))
    setError('')
    setNotice('')
  }

  const createRegistrar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const payload: typeof form & { schedule: Shift[] } = { ...form, schedule: newSchedule }
      if (!payload.password) {
        const { password: _password, ...rest } = payload
        const result = await adminWorkflowRequest<{ message: string }>('/admin/registrars', {
          method: 'POST',
          body: JSON.stringify(rest),
        })
        setNotice(result.message)
        setForm({ name: '', nationalId: '', email: '', password: '', officeId: '', officeAssignmentLabel: '' })
        setManualOffice(false)
        setNewSchedule([])
        await loadRegistrars()
        return
      }
      const result = await adminWorkflowRequest<{ message: string }>('/admin/registrars', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setNotice(result.message)
      setForm({ name: '', nationalId: '', email: '', password: '', officeId: '', officeAssignmentLabel: '' })
      setManualOffice(false)
      setNewSchedule([])
      await loadRegistrars()
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.couldNotCreate)
    } finally {
      setBusy(false)
    }
  }

  const removeRegistrar = async (registrarId: string) => {
    if (!window.confirm(copy.removeConfirm)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(`/admin/registrars/${registrarId}/remove`, {
        method: 'POST',
      })
      setNotice(result.message)
      setSelectedId('')
      await loadRegistrars()
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.couldNotRemove)
    } finally {
      setBusy(false)
    }
  }

  const resetRegistrarPassword = async (registrarId: string) => {
    if (!window.confirm(copy.resetConfirm)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string }>(`/admin/registrars/${registrarId}/reset-password`, {
        method: 'POST',
      })
      setNotice(result.message)
      await loadRegistrars()
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.couldNotReset)
    } finally {
      setBusy(false)
    }
  }

  const saveRegistrarManagement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId || !schedule.length) {
      setError(copy.addShiftBeforeSave)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        ...manageForm,
        officeId: manageManualOffice ? '' : manageForm.officeId,
        officeAssignmentLabel: manageManualOffice ? manageForm.officeAssignmentLabel : '',
        schedule,
      }
      const result = await adminWorkflowRequest<{ message: string }>(`/admin/registrars/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setNotice(result.message)
      await loadRegistrars()
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.couldNotSave)
    } finally {
      setBusy(false)
    }
  }

  const officeName = (registrar: Registrar) => {
    const office = registrar.profile?.officeId
    if (!office || typeof office === 'string') return registrar.profile?.officeAssignmentLabel || copy.noOfficeAssigned
    return office.name.en || office.name.am || office.name.or || copy.office
  }

  return <main className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.description}</p></div>
      <button type="button" onClick={() => { setLoading(true); void loadRegistrars().catch((err: unknown) => setError(err instanceof Error ? err.message : copy.couldNotRefresh)).finally(() => setLoading(false)) }} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 disabled:opacity-50"><RefreshCw size={15} />{copy.refresh}</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
    <div className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={createRegistrar} className={`${panelClass} space-y-4`}>
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} />{copy.createTitle}</h2>
        <p className="text-sm text-gray-500">{copy.createDescription}</p>
        <input required minLength={2} maxLength={120} className={inputClass} placeholder={copy.fullNamePlaceholder} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input required inputMode="numeric" pattern="[0-9]{12}" minLength={12} maxLength={12} className={inputClass} placeholder={copy.nationalIdPlaceholder} value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value.replace(/\D/g, '').slice(0, 12) })} />
        <input required type="email" maxLength={254} className={inputClass} placeholder={copy.workEmailPlaceholder} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input type="password" minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} placeholder={copy.optionalPasswordPlaceholder} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={manualOffice} onChange={(event) => {
          setManualOffice(event.target.checked)
          setForm((current) => ({ ...current, officeId: '', officeAssignmentLabel: '' }))
        }} />{copy.enterOfficeManually}</label>
        {manualOffice
          ? <><input required minLength={2} maxLength={120} className={inputClass} placeholder={copy.officeNamePlaceholder} value={form.officeAssignmentLabel} onChange={(event) => setForm({ ...form, officeAssignmentLabel: event.target.value, officeId: '' })} /><p className="text-xs text-amber-700 dark:text-amber-300">{copy.manualOfficeHint}</p></>
          : <select required className={inputClass} value={form.officeId} onChange={(event) => setForm({ ...form, officeId: event.target.value, officeAssignmentLabel: '' })}><option value="">{copy.assignOffice}</option>{offices.map((office) => <option key={office._id} value={office._id}>{office.name.en || office.name.am || office.name.or}</option>)}</select>}
        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800"><h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} />{copy.weeklySchedule}</h3><ScheduleEditor schedule={newSchedule} onChange={setNewSchedule} /></div>
        <button disabled={busy || !offices.length || !newSchedule.length} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? copy.creating : copy.createAccount}</button>
      </form>
      <section className={`${panelClass} space-y-3`}>
        <h2 className="font-semibold">{copy.existingRegistrars.replace('{count}', String(registrars.length))}</h2>
        {loading ? <p className="py-5 text-sm text-gray-500">{copy.loading}</p> : !registrars.length ? <p className="py-5 text-sm text-gray-500">{copy.noRegistrars}</p> : registrars.map((registrar) => <article key={registrar._id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-medium">{registrar.name} <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize dark:bg-gray-800">{registrar.status}</span></p><p className="text-sm text-gray-500">{registrar.email} · {officeName(registrar)}</p><p className="mt-1 text-xs text-gray-500">{copy.nationalId}: {registrar.maskedNationalId || copy.notRecorded} · {registrar.profile?.schedule?.length || 0} {copy.scheduledShifts}</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => selectedId === registrar._id ? setSelectedId('') : selectRegistrar(registrar)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700">{selectedId === registrar._id ? copy.closeManagement : copy.manage}</button>
              <button type="button" onClick={() => void resetRegistrarPassword(registrar._id)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">{copy.resetPassword}</button>
              <button type="button" onClick={() => void removeRegistrar(registrar._id)} className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">{copy.remove}</button>
            </div>
          </div>
        </article>)}
      </section>
    </div>
    {selectedId && <form onSubmit={saveRegistrarManagement} className={`${panelClass} space-y-4`}>
      <div><h2 className="font-semibold">{copy.manageTitle.replace('{name}', registrars.find((item) => item._id === selectedId)?.name || '')}</h2><p className="mt-1 text-sm text-gray-500">{copy.manageDescription}</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">{copy.fullName}<input required minLength={2} maxLength={120} className={`${inputClass} mt-1`} value={manageForm.name} onChange={(event) => setManageForm({ ...manageForm, name: event.target.value })} /></label>
        <label className="block text-sm">{copy.workEmail}<input required type="email" maxLength={254} className={`${inputClass} mt-1`} value={manageForm.email} onChange={(event) => setManageForm({ ...manageForm, email: event.target.value })} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={manageManualOffice} onChange={(event) => {
        setManageManualOffice(event.target.checked)
        setManageForm((current) => ({ ...current, officeId: '', officeAssignmentLabel: '' }))
      }} />{copy.enterOfficeManually}</label>
      {manageManualOffice
        ? <><input required minLength={2} maxLength={120} className={inputClass} placeholder={copy.officeNamePlaceholder} value={manageForm.officeAssignmentLabel} onChange={(event) => setManageForm({ ...manageForm, officeAssignmentLabel: event.target.value, officeId: '' })} /><p className="text-xs text-amber-700 dark:text-amber-300">{copy.manualOfficeManageHint}</p></>
        : <select required className={inputClass} value={manageForm.officeId} onChange={(event) => setManageForm({ ...manageForm, officeId: event.target.value, officeAssignmentLabel: '' })}><option value="">{copy.assignOffice}</option>{offices.map((office) => <option key={office._id} value={office._id}>{office.name.en || office.name.am || office.name.or}</option>)}</select>}
      <div><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} />{copy.weeklySchedule}</h3><ScheduleEditor schedule={schedule} onChange={setSchedule} /></div>
      <div className="flex gap-2"><button disabled={busy || !schedule.length || (!manageManualOffice && !manageForm.officeId)} className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{busy ? copy.saving : copy.saveChanges}</button><button type="button" onClick={() => setSelectedId('')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">{copy.close}</button></div>
    </form>}
  </main>
}
