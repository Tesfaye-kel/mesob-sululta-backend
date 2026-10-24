import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { adminWorkflowRequest } from '@/api/adminWorkflows'
import { employeeTypes, type EmployeeType } from '@/types/employee'

type LocalizedName = { en?: string; am?: string; or?: string }
type Feedback = {
  _id: string
  type: string
  category: string
  message: string
  response: string
  status: string
  createdAt: string
  appointmentId?: { appointmentReference?: string; slotDate?: string }
  officeId?: { name?: LocalizedName }
  serviceId?: { name?: LocalizedName }
  employeeId?: { name?: string } | null
  employeeMessage?: string
  employeeMessageAt?: string | null
  respondedBy?: { name?: string }
}
type PageData = { feedback: Feedback[]; pagination: { page: number; pages: number; total: number } }
type Options = { _id: string; name: LocalizedName }
type EmployeeUnreadCounts = { total: number; byEmployeeType: Partial<Record<EmployeeType, number>>; unreadMessageIds: string[] }
type EmployeeMessage = {
  _id: string
  type: 'excuse' | 'feedback' | 'compliment' | 'other'
  recipientCategory?: 'admin' | 'it_support'
  subject: string
  message: string
  status: 'new' | 'responded' | 'resolved'
  response: string
  createdAt: string
  authorRole?: 'employee' | 'registrar'
  employeeId?: { name?: string; email?: string; employeeType?: EmployeeType } | null
  registrarId?: { name?: string; email?: string } | null
  respondedBy?: { name?: string }
}
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white'
const employeeMessageTypes = ['feedback', 'compliment', 'excuse', 'other'] as const

export default function AdminFeedbackInbox() {
  const { t, language } = useLanguage()
  const copy = t.admin.workforce
  const inbox = copy.inbox
  const employeeTypeLabels: Record<EmployeeType, string> = {
    service_window_officer: copy.employeeManagement.serviceWindowOfficer,
    security_guard: copy.employeeManagement.securityGuard,
    floor_window_manager: copy.employeeManagement.floorWindowManager,
    receptionist: copy.employeeManagement.receptionist,
    it_support_officer: copy.employeeManagement.itSupportOfficer,
    service_requirement_manager: copy.employeeManagement.serviceRequirementManager,
  }
  const [rows, setRows] = useState<Feedback[]>([])
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [offices, setOffices] = useState<Options[]>([])
  const [services, setServices] = useState<Options[]>([])
  const [filters, setFilters] = useState({ status: '', category: '', from: '', to: '', officeId: '', serviceId: '' })
  const [employeeDrafts, setEmployeeDrafts] = useState<Record<string, string>>({})
  const [employeeMessages, setEmployeeMessages] = useState<EmployeeMessage[]>([])
  const [employeeUnreadCounts, setEmployeeUnreadCounts] = useState<EmployeeUnreadCounts>({ total: 0, byEmployeeType: {}, unreadMessageIds: [] })
  const [employeeReplies, setEmployeeReplies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState<'employees' | 'citizens' | 'registrars'>('employees')
  const [employeeCategory, setEmployeeCategory] = useState<EmployeeType | 'all'>('all')
  const [employeeMessageType, setEmployeeMessageType] = useState<typeof employeeMessageTypes[number] | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value) })
      const result = await adminWorkflowRequest<PageData>(`/admin/feedback-inbox?${params}`)
      setRows(result.feedback)
      setFeedbackTotal(result.pagination.total)
      setPages(Math.max(1, result.pagination.pages))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [filters, page, t.admin.failedToLoad])

  const loadEmployeeMessages = useCallback(async () => {
    try {
      const [result, unreadCounts] = await Promise.all([
        adminWorkflowRequest<{ messages: EmployeeMessage[]; pagination: { total: number } }>('/admin/employee-messages?page=1&limit=100'),
        adminWorkflowRequest<EmployeeUnreadCounts>('/admin/employee-messages/unread-counts'),
      ])
      setEmployeeMessages(result.messages.filter((item) => item.authorRole === 'registrar' || item.employeeId))
      setEmployeeUnreadCounts(unreadCounts)
      setEmployeeReplies((current) => {
        const next = { ...current }
        result.messages.forEach((item) => { next[item._id] ||= item.response || '' })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    }
  }, [t.admin.failedToLoad])

  useEffect(() => { void load() }, [load])
  useEffect(() => { void loadEmployeeMessages() }, [loadEmployeeMessages])
  useEffect(() => {
    let active = true
    if (tab !== 'citizens') return () => { active = false }
    adminWorkflowRequest<{ count: number }>('/admin/feedback-inbox/read', {
      method: 'PATCH',
      body: JSON.stringify({ scope: 'feedback' }),
    }).then(({ count }) => {
      if (active) window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: count }))
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    })
    return () => { active = false }
  }, [tab, t.admin.failedToLoad])
  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`${BASE}/organizations`).then(async (response) => {
        if (!response.ok) throw new Error(`Office request failed: HTTP ${response.status}`)
        return response.json() as Promise<Options[]>
      }),
      fetch(`${BASE}/services`).then(async (response) => {
        if (!response.ok) throw new Error(`Service request failed: HTTP ${response.status}`)
        return response.json() as Promise<Options[]>
      }),
    ]).then(([officeList, serviceList]) => {
      if (!active) return
      setOffices(officeList); setServices(serviceList)
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    })
    return () => { active = false }
  }, [t.admin.failedToLoad])

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const name = (value?: LocalizedName) => value?.[language] || value?.en || value?.am || value?.or || '—'
  const statusLabel = (value: string) => ({
    new: copy.new, under_review: copy.underReview, responded: copy.responded, resolved: copy.resolved,
  }[value] || value)
  const categoryLabel = (value: string) => ({
    service_quality: copy.serviceQuality, waiting_time: copy.waitingTime,
    staff_conduct: copy.staffConduct, suggestion: copy.suggestion,
  }[value] || value)
  const messageTypeLabel = (value: string) => ({
    feedback: inbox.feedbackType, compliment: inbox.complimentType,
    excuse: inbox.excuseType, other: inbox.otherType,
  }[value] || value)
  const employeeMessageStatusLabel = (value: string) => ({
    new: copy.new, responded: copy.responded, resolved: copy.resolved,
  }[value] || value)
  const employeeMessagesOnly = employeeMessages.filter((item) => item.authorRole !== 'registrar' && item.employeeId)
  const newEmployeeMessagesCount = employeeUnreadCounts.total
  const visibleEmployeeMessages = employeeMessagesOnly.filter((item) =>
    (employeeCategory === 'all' || item.employeeId?.employeeType === employeeCategory) &&
    (employeeMessageType === 'all' || item.type === employeeMessageType)
  )
  const markEmployeeMessagesRead = async (employeeType?: EmployeeType, messageId?: string) => {
    setError('')
    const previousCounts = employeeUnreadCounts
    const messageType = messageId
      ? employeeMessagesOnly.find((item) => item._id === messageId)?.employeeId?.employeeType
      : undefined
    const nextCounts = messageId && messageType
      ? {
          total: Math.max(0, previousCounts.total - 1),
          byEmployeeType: {
            ...previousCounts.byEmployeeType,
            [messageType]: Math.max(0, (previousCounts.byEmployeeType[messageType] || 0) - 1),
          },
          unreadMessageIds: previousCounts.unreadMessageIds.filter((id) => id !== messageId),
        }
      : employeeType
        ? {
            total: Math.max(0, previousCounts.total - (previousCounts.byEmployeeType[employeeType] || 0)),
            byEmployeeType: { ...previousCounts.byEmployeeType, [employeeType]: 0 },
            unreadMessageIds: previousCounts.unreadMessageIds.filter((id) =>
              employeeMessagesOnly.find((item) => item._id === id)?.employeeId?.employeeType !== employeeType
            ),
          }
        : { total: 0, byEmployeeType: {}, unreadMessageIds: [] }
    setEmployeeUnreadCounts(nextCounts)
    let markedRead = false
    try {
      const result = await adminWorkflowRequest<{ count: number }>('/admin/feedback-inbox/read', {
        method: 'PATCH',
        body: JSON.stringify({
          scope: 'staff',
          audience: 'employees',
          ...(messageId ? { messageId } : {}),
          ...(employeeType ? { employeeType } : {}),
        }),
      })
      markedRead = true
      window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: result.count }))
      const refreshedCounts = await adminWorkflowRequest<EmployeeUnreadCounts>('/admin/employee-messages/unread-counts')
      setEmployeeUnreadCounts(refreshedCounts)
    } catch (err) {
      if (!markedRead) setEmployeeUnreadCounts(previousCounts)
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    }
  }
  const archiveEmployeeMessage = async (item: EmployeeMessage) => {
    if (!window.confirm(inbox.confirmEmployeeRemoval)) return
    setBusyId(item._id); setError(''); setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; count: number }>(`/admin/employee-messages/${item._id}`, {
        method: 'DELETE',
      })
      setEmployeeMessages((current) => current.filter((message) => message._id !== item._id))
      setNotice(result.message)
      window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: result.count }))
      await loadEmployeeMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : inbox.couldNotRemoveMessage)
    } finally {
      setBusyId('')
    }
  }
  const archiveFeedback = async (item: Feedback) => {
    if (!window.confirm(inbox.confirmFeedbackRemoval)) return
    setBusyId(item._id); setError(''); setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; count: number }>(`/admin/feedback-inbox/${item._id}`, {
        method: 'DELETE',
      })
      setNotice(result.message)
      window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: result.count }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : inbox.couldNotRemoveFeedback)
    } finally {
      setBusyId('')
    }
  }
  const archiveAllStaffMessages = async () => {
    const audience = tab === 'employees' ? 'employees' : 'registrars'
    const typeLabel = employeeMessageType === 'all' ? inbox.allMessageTypes : messageTypeLabel(employeeMessageType)
    const categoryLabel = audience === 'employees' && employeeCategory !== 'all'
      ? ` (${employeeTypeLabels[employeeCategory]})`
      : ''
    const audienceLabel = audience === 'employees' ? inbox.employeeTab : inbox.registrarTab
    const confirmText = inbox.confirmStaffRemoval
      .replace('{typeLabel}', typeLabel)
      .replace('{categoryLabel}', categoryLabel)
      .replace('{audience}', audienceLabel)
    if (!window.confirm(confirmText)) return
    setBusyId('archive-all'); setError(''); setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; count: number }>('/admin/employee-messages/archive-all', {
        method: 'POST',
        body: JSON.stringify({
          audience,
          ...(audience === 'employees' && employeeCategory !== 'all' ? { employeeType: employeeCategory } : {}),
          ...(employeeMessageType !== 'all' ? { type: employeeMessageType } : {}),
        }),
      })
      setNotice(result.message)
      window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: result.count }))
      await loadEmployeeMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : inbox.couldNotRemoveMatchingMessages)
    } finally {
      setBusyId('')
    }
  }
  const archiveAllFeedback = async () => {
    if (!window.confirm(inbox.confirmAllFeedbackRemoval)) return
    setBusyId('archive-all'); setError(''); setNotice('')
    try {
      const result = await adminWorkflowRequest<{ message: string; count: number }>('/admin/feedback-inbox/archive-all', {
        method: 'POST',
        body: JSON.stringify(filters),
      })
      setNotice(result.message)
      window.dispatchEvent(new CustomEvent('admin-inbox-unread-count', { detail: result.count }))
      if (page === 1) await load()
      else setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : inbox.couldNotRemoveMatchingFeedback)
    } finally {
      setBusyId('')
    }
  }
  const updateFeedback = async (item: Feedback, status: 'under_review' | 'resolved') => {
    setBusyId(item._id); setError(''); setNotice('')
    try {
      await adminWorkflowRequest(`/admin/feedback-inbox/${item._id}`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      })
      setNotice(copy.save)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusyId('')
    }
  }
  const sendEmployeeMessage = async (item: Feedback) => {
    const message = (employeeDrafts[item._id] || '').trim()
    if (message.length < 5 || message.length > 2000) return
    const confirmText = inbox.confirmSendEmployee
      .replace('{name}', item.employeeId?.name || inbox.staffMember)
      .replace('{message}', message)
    if (!window.confirm(confirmText)) return
    setBusyId(item._id); setError(''); setNotice('')
    try {
      await adminWorkflowRequest(`/admin/feedback-inbox/${item._id}/employee-message`, {
        method: 'POST', body: JSON.stringify({ message }),
      })
      setNotice(copy.employeeMessageSent)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusyId('')
    }
  }
  const respondToEmployee = async (item: EmployeeMessage, status: 'responded' | 'resolved') => {
    const response = (employeeReplies[item._id] || '').trim()
    if (response.length < 3 || response.length > 2000) return
    setBusyId(item._id); setError(''); setNotice('')
    try {
      await adminWorkflowRequest(`/admin/employee-messages/${item._id}`, {
        method: 'PATCH', body: JSON.stringify({ status, response }),
      })
      setNotice(item.authorRole === 'registrar' ? inbox.replySentRegistrar : inbox.replySentEmployee)
      await loadEmployeeMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToSave)
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{inbox.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{inbox.description}</p>
      </header>
      <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900" aria-label={inbox.views}>
        {([
          ['employees', inbox.employeeTab],
          ['citizens', inbox.citizenTab],
          ['registrars', inbox.registrarTab],
        ] as const).map(([id, label]) => <div key={id} className="flex items-center justify-center gap-1">
          <button onClick={() => setTab(id)} aria-pressed={tab === id} className={`rounded-xl px-3 py-3 text-sm font-semibold ${tab === id ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>{label}</button>
          {id === 'employees' && newEmployeeMessagesCount > 0 && <button type="button" onClick={() => void markEmployeeMessagesRead()} aria-label={inbox.markUnreadCount.replace('{count}', String(newEmployeeMessagesCount))} title={inbox.markAllReadTitle} className="grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">{newEmployeeMessagesCount > 99 ? '99+' : newEmployeeMessagesCount}</button>}
        </div>)}
      </nav>
      {tab !== 'citizens' && <section className="space-y-4">
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{tab === 'employees' ? inbox.employeeMessages : inbox.registrarMessages}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{inbox.staffMessageHint}</p></div>
        <button type="button" disabled={busyId === 'archive-all'} onClick={() => void archiveAllStaffMessages()} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 size={15} />{busyId === 'archive-all' ? inbox.removing : inbox.removeAllStaff.replace('{audience}', tab === 'employees' ? inbox.employeeTab : inbox.registrarTab)}</button>
        {tab === 'employees' && employeeUnreadCounts.total > 0 && <button type="button" onClick={() => void markEmployeeMessagesRead()} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">{inbox.markAllEmployeeRead.replace('{count}', String(employeeUnreadCounts.total))}</button>}
        {tab === 'employees' && <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div><h3 className="text-sm font-semibold">{inbox.categories}</h3><p className="mt-1 text-xs text-gray-500">{inbox.unreadCountsHint}</p></div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1">
              <button type="button" onClick={() => setEmployeeCategory('all')} aria-pressed={employeeCategory === 'all'} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${employeeCategory === 'all' ? 'border-brand-green bg-brand-green text-white' : 'dark:border-gray-700'}`}>{inbox.allCategories} <span>{employeeMessagesOnly.length}</span></button>
              {employeeUnreadCounts.total > 0 && <button type="button" onClick={() => { setEmployeeCategory('all'); void markEmployeeMessagesRead() }} aria-label={inbox.markUnreadCount.replace('{count}', String(employeeUnreadCounts.total))} title={inbox.markAllReadTitle} className="grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">{employeeUnreadCounts.total > 99 ? '99+' : employeeUnreadCounts.total}</button>}
            </div>
            {employeeTypes.map((type) => {
              const newCount = employeeUnreadCounts.byEmployeeType[type] || 0
              const totalCount = employeeMessagesOnly.filter((item) => item.employeeId?.employeeType === type).length
              return <div key={type} className="inline-flex items-center gap-1">
                <button type="button" onClick={() => { setEmployeeCategory(type); void markEmployeeMessagesRead(type) }} aria-pressed={employeeCategory === type} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${employeeCategory === type ? 'border-brand-green bg-brand-green text-white' : 'dark:border-gray-700'}`}>
                  {employeeTypeLabels[type]} <span>{totalCount}</span>
                </button>
                {newCount > 0 && <button type="button" onClick={() => { setEmployeeCategory(type); void markEmployeeMessagesRead(type) }} aria-label={inbox.markTypeUnread.replace('{count}', String(newCount)).replace('{type}', employeeTypeLabels[type])} title={inbox.markTypeRead.replace('{type}', employeeTypeLabels[type])} className="grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">{newCount > 99 ? '99+' : newCount}</button>}
              </div>
            })}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            {(['all', ...employeeMessageTypes] as const).map((type) => {
              const count = employeeMessagesOnly.filter((item) => (employeeCategory === 'all' || item.employeeId?.employeeType === employeeCategory) && (type === 'all' || item.type === type)).length
              return <button key={type} type="button" onClick={() => setEmployeeMessageType(type)} aria-pressed={employeeMessageType === type} className={`rounded-full px-3 py-1.5 text-xs capitalize ${employeeMessageType === type ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{type === 'all' ? inbox.allMessageTypes : messageTypeLabel(type)} <span className="ml-1">{count}</span></button>
            })}
          </div>
        </div>}
        {(tab === 'employees' ? visibleEmployeeMessages : employeeMessages.filter((item) => item.authorRole === 'registrar')).length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">{inbox.noStaffMessages.replace('{audience}', tab === 'employees' ? inbox.employeeTab.toLowerCase() : inbox.registrarTab.toLowerCase())}</p> : (tab === 'employees' ? visibleEmployeeMessages : employeeMessages.filter((item) => item.authorRole === 'registrar')).map((item) => {
          const unread = employeeUnreadCounts.unreadMessageIds.includes(item._id)
          return <article key={item._id} className={`space-y-3 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900 ${unread ? 'border-red-300 dark:border-red-900' : 'border-gray-200 dark:border-gray-800'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-green">{messageTypeLabel(item.type)} · {item.recipientCategory === 'it_support' ? inbox.itSupport : inbox.admin} · {new Date(item.createdAt).toLocaleString()}</p><h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{item.subject}</h3><p className="text-sm text-gray-500">{(item.authorRole === 'registrar' ? item.registrarId?.name : item.employeeId?.name) || inbox.staffMember}{(item.authorRole === 'registrar' ? item.registrarId?.email : item.employeeId?.email) ? ` · ${(item.authorRole === 'registrar' ? item.registrarId?.email : item.employeeId?.email)}` : ''}</p>{item.authorRole !== 'registrar' && item.employeeId?.employeeType && <p className="mt-1 text-xs font-medium text-slate-500">{employeeTypeLabels[item.employeeId.employeeType]}</p>}</div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize dark:bg-gray-800">{employeeMessageStatusLabel(item.status)}</span>
          </div>
          {tab === 'employees' && unread && <div><span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"><span className="h-2 w-2 rounded-full bg-red-600" />{inbox.unread}</span><button type="button" onClick={() => void markEmployeeMessagesRead(undefined, item._id)} className="ml-3 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">{inbox.markAsRead}</button></div>}
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
          <label className="block text-sm text-gray-600 dark:text-gray-300">{tab === 'employees' ? inbox.replyToEmployee : inbox.replyToRegistrar}<textarea className={`${inputClass} mt-1`} rows={3} maxLength={2000} minLength={3} value={employeeReplies[item._id] || ''} onChange={(event) => setEmployeeReplies((current) => ({ ...current, [item._id]: event.target.value }))} placeholder={inbox.writeResponse} /></label>
          <div className="flex flex-wrap gap-2"><button disabled={busyId === item._id || (employeeReplies[item._id] || '').trim().length < 3} onClick={() => void respondToEmployee(item, 'responded')} className="rounded-lg bg-brand-green px-3 py-2 text-sm text-white disabled:opacity-50">{inbox.reply}</button><button disabled={busyId === item._id || (employeeReplies[item._id] || '').trim().length < 3} onClick={() => void respondToEmployee(item, 'resolved')} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 disabled:opacity-50">{inbox.replyResolve}</button><button type="button" disabled={busyId === item._id} onClick={() => void archiveEmployeeMessage(item)} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 size={15} />{inbox.remove}</button></div>
        </article>
        })}
      </section>
      }
      {tab === 'citizens' &&       <section className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">{copy.feedbackStatus}: {copy.all}</option>{['new', 'under_review', 'responded', 'resolved'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        <select className={inputClass} value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}><option value="">{copy.category}: {copy.all}</option>{['service_quality', 'waiting_time', 'staff_conduct', 'suggestion'].map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}</select>
        <label className="grid gap-1 text-xs text-gray-500">{copy.from}<input className={inputClass} type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></label>
        <label className="grid gap-1 text-xs text-gray-500">{copy.to}<input className={inputClass} type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></label>
        <select className={inputClass} value={filters.officeId} onChange={(event) => updateFilter('officeId', event.target.value)}><option value="">{copy.office}: {copy.all}</option>{offices.map((office) => <option key={office._id} value={office._id}>{name(office.name)}</option>)}</select>
        <select className={inputClass} value={filters.serviceId} onChange={(event) => updateFilter('serviceId', event.target.value)}><option value="">{copy.service}: {copy.all}</option>{services.map((service) => <option key={service._id} value={service._id}>{name(service.name)}</option>)}</select>
      </section>}
      {tab === 'citizens' && feedbackTotal > 0 && <button type="button" disabled={busyId === 'archive-all'} onClick={() => void archiveAllFeedback()} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 size={15} />{busyId === 'archive-all' ? inbox.removing : inbox.removeAllFeedback.replace('{count}', String(feedbackTotal))}</button>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
      {tab === 'citizens' && (loading ? <p className="py-8 text-sm text-gray-500">{copy.loading}</p> : !rows.length ? <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">{copy.noFeedback}</p> : rows.map((item) => {
        return <article key={item._id} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase text-brand-green">{item.appointmentId?.appointmentReference || '—'} · {categoryLabel(item.category)}</p><h2 className="mt-1 font-semibold text-gray-900 dark:text-white">{name(item.serviceId?.name)} · {item.type === 'complaint' ? copy.complaint : item.type === 'compliment' ? copy.compliment : copy.suggestion}</h2><p className="mt-1 text-xs text-gray-500">{name(item.officeId?.name)} · {new Date(item.createdAt).toLocaleDateString()}</p></div>
            <span className="h-fit rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">{statusLabel(item.status)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
          {item.type === 'compliment' && item.employeeId && (item.employeeMessageAt
            ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{copy.employeeMessageSent}: {item.employeeMessage}</p>
            : <div className="space-y-2 rounded-xl border border-emerald-200 p-4 dark:border-emerald-900"><p className="text-sm font-semibold">{copy.employeeMessage} · {item.employeeId.name}</p><label className="block text-sm text-gray-600 dark:text-gray-300">{copy.employeeMessageReview}<textarea className={`${inputClass} mt-1`} rows={3} minLength={5} maxLength={2000} value={employeeDrafts[item._id] || ''} onChange={(event) => setEmployeeDrafts((current) => ({ ...current, [item._id]: event.target.value }))} placeholder={copy.employeeMessagePlaceholder} /></label><button disabled={busyId === item._id || (employeeDrafts[item._id] || '').trim().length < 5} onClick={() => void sendEmployeeMessage(item)} className="rounded-lg bg-brand-green px-3 py-2 text-sm text-white disabled:opacity-50">{copy.reviewAndSendEmployee}</button></div>
          )}
          <p className="text-xs text-gray-500">{inbox.citizenFeedbackHint}</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busyId === item._id} onClick={() => void updateFeedback(item, 'under_review')} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700">{copy.markReview}</button>
            <button disabled={busyId === item._id} onClick={() => void updateFeedback(item, 'resolved')} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 disabled:opacity-50">{copy.resolve}</button>
            <button type="button" disabled={busyId === item._id} onClick={() => void archiveFeedback(item)} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 size={15} />{inbox.removeFeedback}</button>
          </div>
        </article>
      }))}
      {tab === 'citizens' && <footer className="flex justify-between text-sm text-gray-500"><span>{copy.page} {page} {copy.of} {pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className={`${inputClass} w-auto disabled:opacity-50`}>{copy.previous}</button><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className={`${inputClass} w-auto disabled:opacity-50`}>{copy.next}</button></div></footer>}
    </main>
  )
}
