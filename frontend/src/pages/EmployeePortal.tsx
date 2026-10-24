import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  Building2,
  Clock3,
  Eye,
  EyeOff,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquareHeart,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  UsersRound,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import type { EmployeeType } from '@/types/employee'
import RegistrarServiceSetupWizard from '@/pages/RegistrarServiceSetupWizard'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'mesob-employee-token'
const USER_KEY = 'mesob-employee-user'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

interface EmployeeUser {
  id: string
  name: string
  email: string
  role: 'employee'
  employeeType?: EmployeeType
  jobTitle?: string
  maskedNationalId?: string
  schedule?: WorkShift[]
  officeAssigned?: boolean
  scheduleAssigned?: boolean
}

interface RegistrarSessionUser {
  id: string
  name: string
  email: string
  role: 'registrar'
}

interface WorkShift {
  day: string
  shift: string
  startTime: string
  endTime: string
}

interface EmployeeProfile {
  name: string
  email: string
  jobTitle: string
  maskedNationalId: string
  schedule: WorkShift[]
  officeAssigned: boolean
  scheduleAssigned: boolean
  status: string
}

interface Booking {
  _id: string
  appointmentReference: string
  slotDate: string
  session: 'session1' | 'session2'
  queueNumber: number
  status: string
  serviceId: { _id: string; name: { en: string }; requiredDocuments: string[] } | string | null
  availableServices: Array<{ _id: string; name: { en: string }; requiredDocuments: string[] }>
  officeId: { name: { en: string } } | string
  windowId: { number: string | number; floor: number } | string
  citizenIdentityId?: { displayName?: string } | string
  deliveryId?: { status: string; actualAttendanceAt?: string; outcome?: string; deliveryDetails?: string; reviewNotes?: string } | string
  checkedInAt?: string | null
}

interface DeliveryForm {
  serviceId: string
  outcome: string
  details: string
  actualAttendanceAt: string
}

interface EmployeeMessage {
  _id: string
  type: 'excuse' | 'feedback' | 'compliment' | 'other'
  recipientCategory?: 'admin' | 'it_support'
  subject: string
  message: string
  status: 'new' | 'responded' | 'resolved'
  response: string
  respondedAt?: string | null
  employeeReadAt?: string | null
  createdAt: string
}

interface ItSupportMessage extends EmployeeMessage {
  authorRole: 'employee' | 'registrar'
  employeeId?: { name?: string; email?: string } | null
  registrarId?: { name?: string; email?: string } | null
  respondedBy?: { name?: string } | null
}

function localDateTimeInput() {
  const date = new Date()
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function addisAbabaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

async function employeeRequest<T>(path: string, body?: object, method?: string): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${BASE}${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data as T
}

export default function EmployeePortal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const resetToken = searchParams.get('resetToken') || ''
  const { language, setLanguage, t } = useLanguage()
  const portalCopy = { ...t.registrarPortal, ...t.registrarPortal.employeeUi }
  const dayLabels: Record<string, string> = {
    monday: portalCopy.dayMonday, tuesday: portalCopy.dayTuesday, wednesday: portalCopy.dayWednesday,
    thursday: portalCopy.dayThursday, friday: portalCopy.dayFriday, saturday: portalCopy.daySaturday, sunday: portalCopy.daySunday,
  }
  const employeeTypeLabel: Record<string, string> = {
    service_window_officer: portalCopy.serviceWindowOfficer, security_guard: portalCopy.securityGuard,
    floor_window_manager: portalCopy.floorWindowManager, receptionist: portalCopy.receptionist,
    it_support_officer: portalCopy.itSupportOfficer, service_requirement_manager: portalCopy.serviceRequirementManager,
  }
  const messageTypeLabel: Record<EmployeeMessage['type'], string> = {
    feedback: portalCopy.typeFeedback, excuse: portalCopy.typeExcuse, compliment: portalCopy.typeCompliment, other: portalCopy.typeOther,
  }
  const messageStatusLabel: Record<EmployeeMessage['status'], string> = {
    new: portalCopy.messageStatusNew, responded: portalCopy.messageStatusResponded, resolved: portalCopy.messageStatusResolved,
  }
  const bookingStatusLabel: Record<string, string> = {
    CHECKED_IN: portalCopy.accepted,
    IN_SERVICE: portalCopy.serviceStarted,
    AWAITING_APPROVAL: portalCopy.pendingStatus,
    APPROVED: portalCopy.approvedStatus,
    DELIVERED: portalCopy.serviceDelivered,
    REJECTED: portalCopy.rejectedStatus,
  }
  const { isDark, toggleTheme } = useTheme()
  const [user, setUser] = useState<EmployeeUser | null>(() => {
    if (resetToken) return null
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null') as EmployeeUser | null } catch { return null }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nationalId, setNationalId] = useState('')
  const [initialPassword, setInitialPassword] = useState('')
  const [initialPasswordConfirmation, setInitialPasswordConfirmation] = useState('')
  const [isFirstPasswordSetup, setIsFirstPasswordSetup] = useState(false)
  const [loginNotice, setLoginNotice] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState('')
  const [resetComplete, setResetComplete] = useState(false)
  const [deliveryForms, setDeliveryForms] = useState<Record<string, DeliveryForm>>({})
  const [checkInHistory, setCheckInHistory] = useState<Booking[]>([])
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [appointmentOrder, setAppointmentOrder] = useState<'date_asc' | 'date_desc' | 'queue_asc' | 'queue_desc'>('date_asc')
  const [activeSection, setActiveSection] = useState<'dashboard' | 'feedback' | 'appointments' | 'history' | 'profile' | 'theme' | 'management'>('dashboard')
  const [employeeMessages, setEmployeeMessages] = useState<EmployeeMessage[]>([])
  const [itSupportMessages, setItSupportMessages] = useState<ItSupportMessage[]>([])
  const [itSupportUnreadCount, setItSupportUnreadCount] = useState(0)
  const [itSupportReplies, setItSupportReplies] = useState<Record<string, string>>({})
  const [messageForm, setMessageForm] = useState({ type: 'feedback' as EmployeeMessage['type'], recipientCategory: 'admin' as NonNullable<EmployeeMessage['recipientCategory']>, subject: '', message: '' })
  const [clock, setClock] = useState(() => new Date())
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user || resetToken) return
    const categoryPath = `/employe/${(user.employeeType || 'service_window_officer').replace(/_/g, '-')}`
    if (location.pathname !== categoryPath) {
      navigate(categoryPath, { replace: true })
    }
  }, [location.pathname, navigate, resetToken, user])

  useEffect(() => {
    if (location.pathname !== '/employe' || user || resetToken) return
    try {
      const registrarUser = JSON.parse(sessionStorage.getItem('mesob-registrar-user') || 'null') as RegistrarSessionUser | null
      if (registrarUser?.role === 'registrar' && sessionStorage.getItem('mesob-registrar-token')) {
        navigate('/employe/system-administration', { replace: true })
      }
    } catch {
      sessionStorage.removeItem('mesob-registrar-user')
      sessionStorage.removeItem('mesob-registrar-token')
    }
  }, [location.pathname, navigate, resetToken, user])

  const refresh = useCallback(async () => {
    const [messageResult, supportResult] = await Promise.all([
      employeeRequest<{ messages: EmployeeMessage[] }>('/employees/messages'),
      user?.employeeType === 'it_support_officer'
        ? employeeRequest<{ messages: ItSupportMessage[]; unreadCount: number }>('/employees/messages/it-support')
        : Promise.resolve({ messages: [] as ItSupportMessage[], unreadCount: 0 }),
    ])
    setEmployeeMessages(messageResult.messages)
    setItSupportMessages(supportResult.messages)
    setItSupportUnreadCount(supportResult.unreadCount)
    const result = user?.employeeType === 'service_window_officer'
      ? await employeeRequest<{ bookings: Booking[]; history: Booking[] }>('/employees/appointments')
      : { bookings: [], history: [] }
    setBookings(result.bookings)
    setCheckInHistory(result.history)
  }, [user])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      employeeRequest<{ profile: EmployeeProfile }>('/employees/profile'),
      user.employeeType === 'service_window_officer'
        ? employeeRequest<{ bookings: Booking[]; history: Booking[] }>('/employees/appointments')
        : Promise.resolve({ bookings: [], history: [] }),
      employeeRequest<{ messages: EmployeeMessage[] }>('/employees/messages'),
      user.employeeType === 'it_support_officer'
        ? employeeRequest<{ messages: ItSupportMessage[]; unreadCount: number }>('/employees/messages/it-support')
        : Promise.resolve({ messages: [] as ItSupportMessage[], unreadCount: 0 }),
    ]).then(([profileData, bookingData, messageData, supportData]) => {
      setProfile(profileData.profile)
      setBookings(bookingData.bookings)
      setCheckInHistory(bookingData.history)
      setEmployeeMessages(messageData.messages)
      setItSupportMessages(supportData.messages)
      setItSupportUnreadCount(supportData.unreadCount)
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : portalCopy.couldNotLoadProfile)
    })
  }, [user])

  useEffect(() => {
    if (!user || activeSection !== 'feedback') return
    let active = true
    const markRead = user.employeeType === 'it_support_officer'
      ? employeeRequest<{ unreadCount: number }>('/employees/messages/it-support/read', {}, 'PATCH')
        .then((result) => {
          if (active) setItSupportUnreadCount(result.unreadCount)
        })
      : employeeRequest('/employees/messages/read', {}, 'PATCH')
        .then(() => employeeRequest<{ messages: EmployeeMessage[] }>('/employees/messages'))
        .then((result) => {
          if (active) setEmployeeMessages(result.messages)
        })
    markRead
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : portalCopy.couldNotMarkRead)
      })
    return () => { active = false }
  }, [user, activeSection])

  useEffect(() => {
    if (!user) return
    const timer = window.setInterval(() => {
      void refresh().catch((err: unknown) => {
        setError(err instanceof Error ? err.message : portalCopy.couldNotRefreshDashboard)
      })
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [refresh, user])

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setLoginNotice('')
    try {
      const response = await fetch(`${BASE}/auth/portal-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'employee_or_registrar' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || portalCopy.employeeSignInFailure)
      if (data.user.role === 'registrar') {
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
        sessionStorage.setItem('mesob-registrar-token', data.token)
        sessionStorage.setItem('mesob-registrar-user', JSON.stringify(data.user))
        navigate('/employe/system-administration', { replace: true })
        setPassword('')
        return
      }
      if (data.user.role !== 'employee') throw new Error(portalCopy.employeeSignInFailure)
      sessionStorage.removeItem('mesob-registrar-token')
      sessionStorage.removeItem('mesob-registrar-user')
      sessionStorage.setItem(TOKEN_KEY, data.token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      navigate(`/employe/${(data.user.employeeType || 'service_window_officer').replace(/_/g, '-')}`, { replace: true })
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.employeeSignInFailure)
    } finally {
      setBusy(false)
    }
  }

  const setInitialEmployeePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (initialPassword !== initialPasswordConfirmation) {
      setError(portalCopy.employeeResetMismatch)
      return
    }
    setBusy(true)
    setError('')
    setLoginNotice('')
    try {
      const response = await fetch(`${BASE}/auth/portal-first-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nationalId,
          password: initialPassword,
          confirmation: initialPasswordConfirmation,
        }),
      })
      await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(portalCopy.employeeFirstPasswordFailure)
      setIsFirstPasswordSetup(false)
      setLoginNotice(portalCopy.employeeFirstPasswordSuccess)
      setPassword('')
      setInitialPassword('')
      setInitialPasswordConfirmation('')
      setNationalId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.employeeFirstPasswordFailure)
    } finally {
      setBusy(false)
    }
  }

  const submitPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (resetPassword !== resetPasswordConfirmation) {
      setError(portalCopy.employeeResetMismatch)
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetPassword }),
      })
      const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
      if (!response.ok) throw new Error(data.message || 'Password reset failed.')
      setResetComplete(true)
      setSearchParams({}, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setBusy(false)
    }
  }

  const runAction = async (id: string, action: 'check-in' | 'start' | 'delivery') => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (action === 'delivery') {
        const form = deliveryForms[id]
        await employeeRequest(`/employees/appointments/${id}/delivery`, {
          serviceId: form?.serviceId || undefined,
          outcome: form?.outcome || '',
          deliveryDetails: form?.details || '',
          actualAttendanceAt: form?.actualAttendanceAt ? new Date(form.actualAttendanceAt).toISOString() : '',
        })
        setNotice(portalCopy.serviceSubmitted)
      } else {
        await employeeRequest(`/employees/appointments/${id}/${action}`, {})
        setNotice(action === 'check-in' ? portalCopy.appointmentAccepted : portalCopy.serviceStarted)
      }
      await refresh()
      if (action === 'check-in') setActiveSection('history')
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.actionFailed)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await employeeRequest<{ message: string }>('/employees/password', { currentPassword, newPassword }, 'PUT')
      setNotice(result.message)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.couldNotChangePassword)
    } finally {
      setBusy(false)
    }
  }

  const submitEmployeeMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await employeeRequest<{ message: string }>('/employees/messages', messageForm)
      setNotice(result.message)
      setMessageForm({ type: 'feedback', recipientCategory: 'admin', subject: '', message: '' })
      const messages = await employeeRequest<{ messages: EmployeeMessage[] }>('/employees/messages')
      setEmployeeMessages(messages.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.couldNotSendMessage)
    } finally {
      setBusy(false)
    }
  }

  const submitItSupportReply = async (messageId: string) => {
    const response = (itSupportReplies[messageId] || '').trim()
    if (response.length < 3 || response.length > 2000) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await employeeRequest<{ message: string }>(
        `/employees/messages/it-support/${messageId}`,
        { response },
        'PATCH'
      )
      setNotice(result.message)
      setItSupportReplies((current) => ({ ...current, [messageId]: '' }))
      const refreshed = await employeeRequest<{ messages: ItSupportMessage[] }>('/employees/messages/it-support')
      setItSupportMessages(refreshed.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.couldNotSendItReply)
    } finally {
      setBusy(false)
    }
  }

  const removeItSupportMessage = async (messageId: string, subject: string) => {
    if (!window.confirm(portalCopy.itSupportRemoveConfirm.replace('{subject}', subject))) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await employeeRequest<{ message: string }>(
        `/employees/messages/it-support/${messageId}`,
        undefined,
        'DELETE'
      )
      setItSupportMessages((messages) => messages.filter((message) => message._id !== messageId))
      setNotice(portalCopy.itSupportMessageRemoved)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.couldNotRemoveItSupportMessage)
    } finally {
      setBusy(false)
    }
  }

  const deleteEmployeeConversation = async (messageId: string) => {
    if (!window.confirm(portalCopy.removeConversationConfirm)) return
    setBusy(true)
    setError('')
    try {
      await employeeRequest(`/employees/messages/${messageId}`, undefined, 'DELETE')
      setEmployeeMessages((messages) => messages.filter((message) => message._id !== messageId))
      setNotice(portalCopy.conversationRemoved)
    } catch (err) {
      try {
        const result = await employeeRequest<{ messages: EmployeeMessage[] }>('/employees/messages')
        setEmployeeMessages(result.messages)
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : portalCopy.couldNotRefreshMessages)
      }
      setError(err instanceof Error ? err.message : portalCopy.couldNotRemoveConversation)
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setUser(null)
    navigate('/employe', { replace: true })
    setBookings([])
    setCheckInHistory([])
    setEmployeeMessages([])
    setItSupportMessages([])
    setItSupportUnreadCount(0)
    setActiveSection('dashboard')
  }

  const todayKey = addisAbabaDateKey(clock)
  const todayBookings = [...bookings, ...checkInHistory].filter((booking) => booking.slotDate.slice(0, 10) === todayKey)
  const todayName = clock.toLocaleDateString('en-US', { timeZone: 'Africa/Addis_Ababa', weekday: 'long' }).toLowerCase()
  const dateLocale = language === 'am' ? 'am-ET' : language === 'or' ? 'om-ET' : 'en-ET'
  const weeklySchedule = profile?.schedule || user?.schedule || []
  const isServiceWindowOfficer = user?.employeeType === 'service_window_officer'
  const isWaitingForAssignment = user && (
    profile
      ? !profile.officeAssigned || !profile.scheduleAssigned
      : !user.officeAssigned || !user.scheduleAssigned
  )
  const isStructureManager = user?.employeeType === 'floor_window_manager'
  const isServiceRequirementManager = user?.employeeType === 'service_requirement_manager'
  const dateLabel = clock.toLocaleDateString(language === 'am' ? 'am-ET' : language === 'or' ? 'om-ET' : 'en-ET', {
    timeZone: 'Africa/Addis_Ababa',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const sectionTitles = {
    dashboard: portalCopy.weeklySchedule,
    feedback: user?.employeeType === 'it_support_officer' ? portalCopy.itSupportMessages : portalCopy.communicateWithAdmin,
    appointments: portalCopy.appointedPeople,
    history: portalCopy.acceptedHistory,
    profile: portalCopy.profile,
    theme: portalCopy.themeSettings,
    management: isStructureManager ? portalCopy.manageStructure : portalCopy.manageServices,
  }
  const navigation = [
    { id: 'dashboard' as const, label: portalCopy.weeklySchedule, icon: LayoutDashboard },
    { id: 'feedback' as const, label: user?.employeeType === 'it_support_officer' ? portalCopy.itSupportMessages : portalCopy.feedbackMessages, icon: MessageSquareHeart, count: user?.employeeType === 'it_support_officer' ? itSupportUnreadCount : employeeMessages.filter((message) => ['responded', 'resolved'].includes(message.status) && !message.employeeReadAt).length },
    ...(isServiceWindowOfficer ? [
      { id: 'appointments' as const, label: portalCopy.appointedPeople, icon: UsersRound, count: bookings.length },
      { id: 'history' as const, label: portalCopy.acceptedHistory, icon: History, count: checkInHistory.length },
    ] : []),
    ...(isStructureManager ? [{ id: 'management' as const, label: portalCopy.officeFloorWindow, icon: Building2 }] : []),
    ...(isServiceRequirementManager ? [{ id: 'management' as const, label: portalCopy.servicesRequirements, icon: Wrench }] : []),
    { id: 'profile' as const, label: portalCopy.profile, icon: UserRound },
    { id: 'theme' as const, label: portalCopy.theme, icon: isDark ? Sun : Moon },
  ]
  const visibleAppointments = bookings
    .filter((booking) => {
      const citizenName = typeof booking.citizenIdentityId === 'object'
        ? booking.citizenIdentityId.displayName || ''
        : ''
      const searchable = `${booking.appointmentReference} ${citizenName} ${booking.queueNumber} ${booking.status}`.toLowerCase()
      return searchable.includes(appointmentSearch.trim().toLowerCase())
    })
    .sort((left, right) => {
      if (appointmentOrder.startsWith('queue')) {
        const direction = appointmentOrder === 'queue_asc' ? 1 : -1
        return (left.queueNumber - right.queueNumber) * direction
      }
      const direction = appointmentOrder === 'date_asc' ? 1 : -1
      return (left.slotDate.localeCompare(right.slotDate) || left.session.localeCompare(right.session) || left.queueNumber - right.queueNumber) * direction
    })

  if (resetToken || resetComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
        <section className={`${panelClass} w-full max-w-md space-y-4 p-7`}>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">MESOB Sululta</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{resetComplete ? portalCopy.employeeResetSuccess : portalCopy.employeeResetTitle}</h1><p className="mt-2 text-sm text-slate-500">{portalCopy.employeeResetHint}</p></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          {resetComplete ? <Link to="/employe/" onClick={() => setResetComplete(false)} className="block rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white">{portalCopy.backToSignIn}</Link> : <form onSubmit={submitPasswordReset} className="space-y-4">
            <label className="block text-sm">{portalCopy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} /></label>
            <label className="block text-sm">{portalCopy.employeeResetConfirmPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={resetPasswordConfirmation} onChange={(event) => setResetPasswordConfirmation(event.target.value)} /></label>
            <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? portalCopy.resettingPassword : portalCopy.resetPasswordSubmit}</button>
            <button type="button" onClick={() => { setSearchParams({}, { replace: true }); setResetPassword(''); setResetPasswordConfirmation('') }} className="w-full rounded-xl border px-4 py-3 font-semibold dark:border-slate-700">{portalCopy.backToSignIn}</button>
          </form>}
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
        <form onSubmit={isFirstPasswordSetup ? setInitialEmployeePassword : login} autoComplete="on" className={`${panelClass} w-full max-w-md space-y-4 p-7`}>
          <div className="mb-4 flex justify-end">
            <label className="sr-only" htmlFor="employee-login-language">{portalCopy.language}</label>
            <select id="employee-login-language" className={`${inputClass} w-auto`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}>
              <option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option>
            </select>
          </div>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">MESOB Sululta</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{portalCopy.employeePortalTitle}</h1><p className="mt-2 text-sm text-slate-500">{portalCopy.employeePortalDescription}</p></div>
          <label className="block text-sm">{isFirstPasswordSetup ? portalCopy.workEmail : portalCopy.workEmailOrNationalId}<input className={`${inputClass} mt-1`} name="username" type={isFirstPasswordSetup ? 'email' : 'text'} required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {isFirstPasswordSetup ? <>
            <p className="text-sm text-slate-500">{portalCopy.employeeFirstPasswordHint}</p>
            <label className="block text-sm">{portalCopy.employeeNationalId}<input className={`${inputClass} mt-1`} type="text" inputMode="numeric" pattern="[0-9]{12}" minLength={12} maxLength={12} autoComplete="off" required value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, '').slice(0, 12))} /></label>
            <label className="block text-sm">{portalCopy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={initialPassword} onChange={(event) => setInitialPassword(event.target.value)} /></label>
            <label className="block text-sm">{portalCopy.employeeResetConfirmPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={initialPasswordConfirmation} onChange={(event) => setInitialPasswordConfirmation(event.target.value)} /></label>
          </> : <>
            <label className="block text-sm" htmlFor="employee-password">{portalCopy.password}</label>
            <div className="relative">
              <input id="employee-password" className={`${inputClass} pr-11`} name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? portalCopy.hidePassword : portalCopy.showPassword} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </>}
          {loginNotice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{loginNotice}</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? isFirstPasswordSetup ? portalCopy.employeeSettingPassword : portalCopy.signingIn : isFirstPasswordSetup ? portalCopy.employeeSetPassword : portalCopy.signIn}</button>
          <button type="button" onClick={() => { setIsFirstPasswordSetup(!isFirstPasswordSetup); setError(''); setLoginNotice('') }} className="w-full text-center text-sm text-emerald-700 underline dark:text-emerald-300">{isFirstPasswordSetup ? portalCopy.employeeAlreadySetPassword : portalCopy.employeeFirstTimeSetup}</button>
          <Link to="/" className="block text-center text-sm text-emerald-700 underline dark:text-emerald-300">{portalCopy.returnWebsite}</Link>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-bold text-white">M</div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">MESOB Sululta</p><p className="mt-0.5 text-sm font-semibold">{portalCopy.employeePortal}</p></div>
          </div>
          <div className="mx-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{portalCopy.signedInAs}</p>
            <p className="mt-1 truncate text-sm font-semibold">{user.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{user.employeeType ? employeeTypeLabel[user.employeeType] : portalCopy.employee}</p>
          </div>
          <nav aria-label={portalCopy.dashboardNavigation} className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pt-6">
            {navigation.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setActiveSection(id)} aria-current={activeSection === id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${activeSection === id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                <Icon size={18} /><span className="flex-1">{label}</span>
                {count !== undefined && <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 shadow-sm dark:bg-slate-900">{count}</span>}
              </button>
            ))}
          </nav>
          <div className="hidden border-t border-slate-200 p-4 dark:border-slate-800 lg:block">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"><LogOut size={18} />{portalCopy.signOut}</button>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-5 pb-4 text-sm font-medium text-rose-700 dark:text-rose-300 lg:hidden"><LogOut size={17} />{portalCopy.signOut}</button>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-100/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
            <div><h1 className="text-xl font-bold sm:text-2xl">{sectionTitles[activeSection]}</h1><p className="mt-1 text-xs text-slate-500">{dateLabel} · {portalCopy.addisAbaba}</p></div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="employee-language">{portalCopy.language}</label>
              <select id="employee-language" className={`${inputClass} w-auto py-2`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}>
                <option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option>
              </select>
              <button onClick={() => void refresh().catch((err: unknown) => setError(err instanceof Error ? err.message : portalCopy.couldNotRefreshDashboard))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900"><RefreshCw size={16} /> <span className="hidden sm:inline">{portalCopy.refresh}</span></button>
            </div>
          </header>
          <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}

            {activeSection === 'dashboard' && <div className="space-y-5">
              {isWaitingForAssignment && isServiceWindowOfficer && <section role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <h2 className="font-semibold">{portalCopy.employeeWaitingAssignment}</h2>
                <p className="mt-1 text-sm">{portalCopy.employeeWaitingAssignmentHint}</p>
              </section>}
              {isStructureManager && <button type="button" onClick={() => setActiveSection('management')} className={`${panelClass} flex w-full items-center justify-between gap-4 text-left transition hover:border-emerald-600`}>
                <span><span className="block font-semibold">{portalCopy.manageStructure}</span><span className="mt-1 block text-sm text-slate-500">{portalCopy.manageStructureHint}</span></span>
                <Building2 className="shrink-0 text-emerald-700" size={22} />
              </button>}
              {isServiceRequirementManager && <button type="button" onClick={() => setActiveSection('management')} className={`${panelClass} flex w-full items-center justify-between gap-4 text-left transition hover:border-emerald-600`}>
                <span><span className="block font-semibold">{portalCopy.manageServices}</span><span className="mt-1 block text-sm text-slate-500">{portalCopy.manageServicesHint}</span></span>
                <Wrench className="shrink-0 text-emerald-700" size={22} />
              </button>}
              <section className={`${panelClass} space-y-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-lg font-semibold">{portalCopy.workSchedule}</h2><p className="mt-1 text-sm text-slate-500">{portalCopy.weeklyShiftHint}</p></div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{portalCopy.today}: {dayLabels[todayName] || todayName}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const shifts = weeklySchedule.filter((shift) => shift.day === day)
                    const isToday = day === todayName
                    return <article key={day} className={`rounded-xl border p-4 ${isToday ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{dayLabels[day]}</h3>{isToday && <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{portalCopy.today}</span>}</div>
                      {shifts.length ? <div className="mt-3 space-y-2">{shifts.map((shift, index) => <div key={`${shift.day}-${shift.startTime}-${index}`} className="flex items-center gap-2 text-sm"><Clock3 size={15} className="shrink-0 text-emerald-700" /><span>{shift.shift === 'Morning' ? portalCopy.morningShift : portalCopy.afternoonShift}</span><span className="ml-auto font-medium tabular-nums">{shift.startTime}–{shift.endTime}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">{portalCopy.noShiftAssigned}</p>}
                    </article>
                  })}
                </div>
                {!weeklySchedule.length && <p className="text-sm text-amber-700 dark:text-amber-300">{portalCopy.adminNoSchedule}</p>}
              </section>
              <section className="grid gap-4 sm:grid-cols-2">
                {isServiceWindowOfficer && <>
                  <article className={panelClass}><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{portalCopy.todayAppointments}</p><CalendarDays className="text-emerald-700" size={19} /></div><p className="mt-3 text-3xl font-bold">{todayBookings.length}</p><p className="mt-1 text-xs text-slate-500">{dateLabel}</p></article>
                  <article className={panelClass}><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{portalCopy.allAssignedAppointments}</p><UsersRound className="text-emerald-700" size={19} /></div><p className="mt-3 text-3xl font-bold">{bookings.length + checkInHistory.length}</p><button onClick={() => setActiveSection('appointments')} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">{portalCopy.openAppointments}</button></article>
                </>}
              </section>
            </div>}

            {activeSection === 'feedback' && <section className={`${panelClass} space-y-4`}>
              <div><h2 className="text-lg font-semibold">{user?.employeeType === 'it_support_officer' ? portalCopy.itSupportMessages : portalCopy.communicateWithAdmin}</h2><p className="mt-1 text-sm text-slate-500">{user?.employeeType === 'it_support_officer' ? portalCopy.itSupportHint : portalCopy.adminMessagesHint}</p></div>
              <form onSubmit={submitEmployeeMessage} className="grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 sm:grid-cols-2">
                <label className="block text-sm">{portalCopy.messageType}<select className={`${inputClass} mt-1`} value={messageForm.type} onChange={(event) => setMessageForm((current) => ({ ...current, type: event.target.value as EmployeeMessage['type'] }))}><option value="feedback">{portalCopy.typeFeedback}</option><option value="excuse">{portalCopy.typeExcuse}</option><option value="compliment">{portalCopy.typeCompliment}</option><option value="other">{portalCopy.typeOther}</option></select></label>
                <label className="block text-sm">{portalCopy.messageCategory}<select className={`${inputClass} mt-1`} value={messageForm.recipientCategory} onChange={(event) => setMessageForm((current) => ({ ...current, recipientCategory: event.target.value as NonNullable<EmployeeMessage['recipientCategory']> }))}><option value="admin">{portalCopy.recipientAdmin}</option>{user?.employeeType !== 'security_guard' && <option value="it_support">{portalCopy.recipientIt}</option>}</select></label>
                <label className="block text-sm">{portalCopy.subject}<input className={`${inputClass} mt-1`} required minLength={3} maxLength={160} value={messageForm.subject} onChange={(event) => setMessageForm((current) => ({ ...current, subject: event.target.value }))} placeholder={portalCopy.briefSubject} /></label>
                <label className="block text-sm sm:col-span-2">{portalCopy.message}<textarea className={`${inputClass} mt-1`} rows={4} required minLength={10} maxLength={2000} value={messageForm.message} onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))} placeholder={portalCopy.writeMessage} /></label>
                <div className="sm:col-span-2"><button disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? portalCopy.sending : messageForm.recipientCategory === 'it_support' ? portalCopy.sendToIt : portalCopy.sendToAdmin}</button></div>
              </form>
              {user?.employeeType === 'it_support_officer' && <div className="space-y-3">
                <h3 className="font-semibold">{portalCopy.itInbox}</h3>
                {!itSupportMessages.length ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">{portalCopy.noItMessages}</div> : itSupportMessages.map((item) => {
                  const sender = item.authorRole === 'registrar' ? item.registrarId : item.employeeId
                  return <article key={item._id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{messageTypeLabel[item.type]} · {item.authorRole === 'registrar' ? portalCopy.registrar : portalCopy.employee}</p><h4 className="mt-1 font-semibold">{item.subject}</h4><p className="text-sm text-slate-500">{sender?.name || portalCopy.staffMember}{sender?.email ? ` · ${sender.email}` : ''}</p></div>
                      <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">{messageStatusLabel[item.status]}</span><button type="button" onClick={() => void removeItSupportMessage(item._id, item.subject)} disabled={busy} aria-label={`${portalCopy.delete}: ${item.subject}`} title={portalCopy.delete} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 size={16} />{portalCopy.delete}</button></div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                    <time className="block text-xs text-slate-400">{new Date(item.createdAt).toLocaleString(dateLocale, { timeZone: 'Africa/Addis_Ababa' })}</time>
                    {!!item.response && <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">{portalCopy.latestItReply}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.response}</p></div>}
                    <label className="block text-sm">{portalCopy.replyToSender}<textarea className={`${inputClass} mt-1`} rows={3} minLength={3} maxLength={2000} value={itSupportReplies[item._id] || ''} onChange={(event) => setItSupportReplies((current) => ({ ...current, [item._id]: event.target.value }))} placeholder={portalCopy.writeItReply} /></label>
                    <button type="button" disabled={busy || (itSupportReplies[item._id] || '').trim().length < 3} onClick={() => void submitItSupportReply(item._id)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? portalCopy.sending : portalCopy.sendItReply}</button>
                  </article>
                })}
              </div>}
              <div className="space-y-3">
                <h3 className="font-semibold">{portalCopy.yourMessages}</h3>
                {!employeeMessages.length ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">{portalCopy.noMessagesSent}</div> : employeeMessages.map((item) => <article key={item._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">{messageTypeLabel[item.type]}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs dark:bg-emerald-950/30">{item.recipientCategory === 'it_support' ? portalCopy.recipientIt : portalCopy.recipientAdmin}</span><h4 className="font-semibold">{item.subject}</h4>{['responded', 'resolved'].includes(item.status) && !item.employeeReadAt && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{portalCopy.newReply}</span>}</div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{messageStatusLabel[item.status]}</span><button type="button" onClick={() => void deleteEmployeeConversation(item._id)} disabled={busy} aria-label={`${portalCopy.deleteConversation}: ${item.subject}`} title={portalCopy.deleteConversation} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 size={16} />{portalCopy.delete}</button></div></div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.message}</p><time className="mt-2 block text-xs text-slate-400">{new Date(item.createdAt).toLocaleString(dateLocale, { timeZone: 'Africa/Addis_Ababa' })}</time>
                  {!!item.response && <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">{item.recipientCategory === 'it_support' ? portalCopy.itReply : portalCopy.adminReply}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.response}</p></div>}
                </article>)}
              </div>
            </section>}

            {activeSection === 'management' && (isStructureManager || isServiceRequirementManager) &&
              <RegistrarServiceSetupWizard employeeMode={isStructureManager ? 'structure' : 'services'} />}

            {isServiceWindowOfficer && activeSection === 'appointments' && <section className="space-y-4">
              <article className={`${panelClass} grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]`}>
                  <label className="block text-sm">{portalCopy.searchAppointments}
                    <input className={`${inputClass} mt-1`} type="search" value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} placeholder={portalCopy.searchReferenceCitizenQueue} />
                    </label>
                  <label className="block text-sm">{portalCopy.orderBy}
                      <select className={`${inputClass} mt-1`} value={appointmentOrder} onChange={(event) => setAppointmentOrder(event.target.value as typeof appointmentOrder)}>
                      <option value="date_asc">{portalCopy.dateEarliest}</option>
                      <option value="date_desc">{portalCopy.dateLatest}</option>
                      <option value="queue_asc">{portalCopy.queueLowest}</option>
                      <option value="queue_desc">{portalCopy.queueHighest}</option>
                      </select>
                    </label>
                  </article>
                  {!visibleAppointments.length
                    ? <article className={panelClass}><p className="text-sm text-slate-600 dark:text-slate-300">{bookings.length ? portalCopy.noAppointmentsMatchSearch : portalCopy.noVisibleAppointments}</p></article>
                    : <section className={`${panelClass} overflow-x-auto p-0`}>
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                          <tr>{[portalCopy.citizenName, portalCopy.appointmentId, portalCopy.queue, portalCopy.dateSession, portalCopy.serviceWindow, portalCopy.acceptanceStatus, portalCopy.action].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {visibleAppointments.map((booking) => {
                            const appointmentDate = booking.slotDate.slice(0, 10)
                            const isToday = appointmentDate === todayKey
                            const citizenName = typeof booking.citizenIdentityId === 'object'
                              ? booking.citizenIdentityId.displayName || portalCopy.citizen
                              : portalCopy.citizen
                            const service = typeof booking.serviceId === 'object' && booking.serviceId
                              ? booking.serviceId
                              : null
                            const windowName = typeof booking.windowId === 'object'
                              ? `${portalCopy.floor} ${booking.windowId.floor} · ${portalCopy.window} ${booking.windowId.number}`
                              : '—'
                            return <tr key={booking._id} className="align-middle">
                              <td className="px-4 py-3 font-medium">{citizenName}</td>
                              <td className="px-4 py-3 font-semibold text-emerald-700">{booking.appointmentReference}</td>
                              <td className="px-4 py-3">#{booking.queueNumber}</td>
                              <td className="px-4 py-3">
                                {new Date(booking.slotDate).toLocaleDateString(dateLocale, { timeZone: 'Africa/Addis_Ababa', dateStyle: 'medium' })}
                                <p className="mt-1 text-xs text-slate-500">{booking.session === 'session1' ? '7:30–11:30' : '2:30–6:30'} {portalCopy.localTime}</p>
                              </td>
                              <td className="px-4 py-3">{(service?.name as Record<string, string> | undefined)?.[language] || service?.name.en || portalCopy.officeAppointment}<p className="mt-1 text-xs text-slate-500">{windowName}</p></td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isToday ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                  {isToday ? portalCopy.awaitingAcceptance : portalCopy.notYetAvailable}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {isToday
                                  ? <button onClick={() => void runAction(booking._id, 'check-in')} disabled={busy} className="whitespace-nowrap rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{portalCopy.accept}</button>
                                  : <span className="text-xs text-slate-500">{portalCopy.acceptOpensAppointmentDay}</span>}
                              </td>
                            </tr>
                          })}
                        </tbody>
                      </table>
                    </section>}
            </section>}

            {isServiceWindowOfficer && activeSection === 'history' && <section className="space-y-4">
              {!checkInHistory.length
                ? <article className={panelClass}><p className="text-sm text-slate-600 dark:text-slate-300">{portalCopy.acceptedAppointmentsHistory}</p></article>
                : <section className={`${panelClass} overflow-x-auto p-0`}>
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                      <tr>{[portalCopy.appointmentCitizen, portalCopy.service, portalCopy.dateSession, portalCopy.officeWindow, portalCopy.queue, portalCopy.acceptedAt, portalCopy.status, portalCopy.action].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
                    </thead>
                    {checkInHistory.map((booking) => {
                      const service = typeof booking.serviceId === 'object' && booking.serviceId ? booking.serviceId : null
                      const citizenName = typeof booking.citizenIdentityId === 'object'
                        ? booking.citizenIdentityId.displayName || portalCopy.citizen
                        : portalCopy.citizen
                      const location = typeof booking.officeId === 'object' ? (booking.officeId.name as Record<string, string>)[language] || booking.officeId.name.en : portalCopy.office
                      const windowLabel = typeof booking.windowId === 'object' ? `${portalCopy.floor} ${booking.windowId.floor} · ${portalCopy.window} ${booking.windowId.number}` : ''
                      const delivery = typeof booking.deliveryId === 'object' ? booking.deliveryId : undefined
                      const form = deliveryForms[booking._id] || {
                        serviceId: typeof booking.serviceId === 'object' && booking.serviceId
                          ? booking.serviceId._id
                          : typeof booking.serviceId === 'string' ? booking.serviceId : '',
                        outcome: delivery?.outcome || '',
                        details: delivery?.deliveryDetails || '',
                        actualAttendanceAt: delivery?.actualAttendanceAt
                          ? new Date(new Date(delivery.actualAttendanceAt).getTime() - new Date(delivery.actualAttendanceAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                          : localDateTimeInput(),
                      }
                      return <tbody key={booking._id} className="border-b last:border-0 dark:border-slate-800">
                        <tr className="align-top">
                          <td className="px-4 py-3"><p className="font-semibold">{booking.appointmentReference}</p><p className="mt-1 text-slate-500">{citizenName}</p></td>
                          <td className="px-4 py-3">{(service?.name as Record<string, string> | undefined)?.[language] || service?.name.en || portalCopy.serviceNotSpecified}</td>
                          <td className="px-4 py-3">{new Date(booking.slotDate).toLocaleDateString(dateLocale, { timeZone: 'Africa/Addis_Ababa', dateStyle: 'medium' })}<p className="mt-1 text-xs text-slate-500">{booking.session === 'session1' ? '7:30–11:30' : '2:30–6:30'} {portalCopy.localTime}</p></td>
                          <td className="px-4 py-3">{location}<p className="mt-1 text-xs text-slate-500">{windowLabel}</p></td>
                          <td className="px-4 py-3">#{booking.queueNumber}</td>
                          <td className="px-4 py-3">{booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString(dateLocale, { timeZone: 'Africa/Addis_Ababa' }) : '—'}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{bookingStatusLabel[booking.status] || booking.status.replace('_', ' ')}</span></td>
                          <td className="px-4 py-3">
                            {booking.status === 'CHECKED_IN' && <button onClick={() => void runAction(booking._id, 'start')} disabled={busy} className="whitespace-nowrap rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{portalCopy.startService}</button>}
                            {['AWAITING_APPROVAL', 'APPROVED', 'DELIVERED'].includes(booking.status) && <span className="text-xs text-slate-500">{portalCopy.serviceRecordSubmitted}</span>}
                          </td>
                        </tr>
                        {(booking.status === 'IN_SERVICE' || booking.status === 'REJECTED') && <tr><td colSpan={8} className="bg-slate-50 px-4 py-4 dark:bg-slate-800/50">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {!service && <label className="block text-xs font-medium">{portalCopy.serviceDelivered}<select className={`${inputClass} mt-1`} required value={form.serviceId} onChange={(event) => setDeliveryForms((old) => ({ ...old, [booking._id]: { ...form, serviceId: event.target.value } }))}><option value="">{portalCopy.selectService}</option>{booking.availableServices.map((item) => <option key={item._id} value={item._id}>{(item.name as Record<string, string>)[language] || item.name.en}</option>)}</select></label>}
                            <label className="block text-xs font-medium">{portalCopy.attendanceDateTime}<input className={`${inputClass} mt-1`} type="datetime-local" required max={localDateTimeInput()} value={form.actualAttendanceAt} onChange={(event) => setDeliveryForms((old) => ({ ...old, [booking._id]: { ...form, actualAttendanceAt: event.target.value } }))} /></label>
                            <label className="block text-xs font-medium">{portalCopy.serviceOutcome}<textarea className={`${inputClass} mt-1`} rows={2} required minLength={3} maxLength={2000} value={form.outcome} onChange={(event) => setDeliveryForms((old) => ({ ...old, [booking._id]: { ...form, outcome: event.target.value } }))} /></label>
                            <label className="block text-xs font-medium">{portalCopy.deliveryDetails}<textarea className={`${inputClass} mt-1`} rows={2} maxLength={4000} value={form.details} onChange={(event) => setDeliveryForms((old) => ({ ...old, [booking._id]: { ...form, details: event.target.value } }))} /></label>
                          </div>
                          <button onClick={() => void runAction(booking._id, 'delivery')} disabled={busy || (!service && !form.serviceId) || form.outcome.trim().length < 3 || !form.actualAttendanceAt} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{booking.status === 'REJECTED' ? portalCopy.resubmitAttendance : portalCopy.submitServiceRecord}</button>
                        </td></tr>}
                      </tbody>
                    })}
                  </table>
                </section>}
            </section>}

            {activeSection === 'profile' && <section className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
              <article className={`${panelClass} space-y-5`}>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{portalCopy.employeeDetails}</p><h2 className="mt-1 text-lg font-semibold">{portalCopy.profile}</h2></div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-slate-500">{portalCopy.fullName}</dt><dd className="font-medium">{profile?.name || user.name}</dd>
                  <dt className="text-slate-500">{portalCopy.email}</dt><dd className="break-all font-medium">{profile?.email || user.email}</dd>
                  <dt className="text-slate-500">{portalCopy.jobTitle}</dt><dd className="font-medium">{profile?.jobTitle || user.jobTitle || employeeTypeLabel[user.employeeType || ''] || portalCopy.employee}</dd>
                  <dt className="text-slate-500">{portalCopy.nationalId}</dt><dd className="font-mono">{profile?.maskedNationalId || user.maskedNationalId || '********'}</dd>
                  <dt className="text-slate-500">{portalCopy.accountStatus}</dt><dd className="font-medium">{profile?.status ? ({ active: portalCopy.activeStatus, pending: portalCopy.pendingStatus, approved: portalCopy.approvedStatus, rejected: portalCopy.rejectedStatus, suspended: portalCopy.suspendedStatus }[profile.status.toLowerCase()] || profile.status) : '—'}</dd>
                </dl>
                <div><h3 className="font-semibold">{portalCopy.weeklySchedule}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const shifts = (profile?.schedule || user.schedule || []).filter((shift) => shift.day === day)
                    return <div key={day} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="font-medium">{dayLabels[day]}</p><p className="mt-1 text-slate-500">{shifts.length ? shifts.map((shift) => `${shift.shift === 'Morning' ? portalCopy.morningShift : portalCopy.afternoonShift} ${shift.startTime}–${shift.endTime}`).join(', ') : portalCopy.dayOff}</p></div>
                  })}
                </div></div>
              </article>
              <form onSubmit={changePassword} className={`${panelClass} space-y-4`}>
                <div><h2 className="text-lg font-semibold">{portalCopy.changePassword}</h2><p className="mt-1 text-sm text-slate-500">{portalCopy.strongPasswordHint}</p></div>
                <label className="block text-sm">{portalCopy.currentPassword}<input className={`${inputClass} mt-1`} type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
                <label className="block text-sm">{portalCopy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
                <button disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{portalCopy.updatePassword}</button>
              </form>
            </section>}

            {activeSection === 'theme' && <section className={`${panelClass} max-w-2xl space-y-5`}>
              <div><h2 className="text-lg font-semibold">{portalCopy.themeSettings}</h2><p className="mt-1 text-sm text-slate-500">{portalCopy.chooseThemeHint}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => isDark && toggleTheme()} aria-pressed={!isDark} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${!isDark ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}><Sun className="text-amber-500" /><span><span className="block font-semibold">{portalCopy.light}</span><span className="text-xs text-slate-500">{portalCopy.brightWorkspace}</span></span></button>
                <button onClick={() => !isDark && toggleTheme()} aria-pressed={isDark} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${isDark ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}><Moon className="text-indigo-500" /><span><span className="block font-semibold">{portalCopy.dark}</span><span className="text-xs text-slate-500">{portalCopy.lowLightWorkspace}</span></span></button>
              </div>
            </section>}
          </div>
        </div>
      </div>
    </main>
  )
}

export function EmployeeActivationPage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const { language, setLanguage } = useLanguage()
  const copy = {
    en: {
      language: 'Language',
      title: 'Activate employee account',
      fullName: 'Full name',
      nationalId: 'National ID (12 digits)',
      password: 'Create password',
      confirmPassword: 'Confirm password',
      passwordMismatch: 'Passwords do not match.',
      success: 'Your employee account is active. You can now sign in.',
      role: 'Your assigned employee type',
      service_window_officer: 'Service Window Officer',
      security_guard: 'Security Guard',
      floor_window_manager: 'Office, Floor and Window Manager',
      receptionist: 'Receptionist',
      it_support_officer: 'IT Support Officer',
      service_requirement_manager: 'Service and Requirement Manager',
      activate: 'Activate account',
      activating: 'Activating…',
      signIn: 'Go to employee sign in',
      activationFailed: 'Account activation failed.',
    },
    am: {
      language: 'ቋንቋ',
      title: 'የሰራተኛ መለያ ያንቁ',
      fullName: 'ሙሉ ስም',
      nationalId: 'ብሔራዊ መታወቂያ (12 አሃዞች)',
      password: 'የይለፍ ቃል ይፍጠሩ',
      confirmPassword: 'የይለፍ ቃሉን ያረጋግጡ',
      passwordMismatch: 'የይለፍ ቃሎቹ አይዛመዱም።',
      success: 'የሰራተኛ መለያዎ ንቁ ሆኗል። አሁን መግባት ይችላሉ።',
      role: 'የተመደበው የሰራተኛ አይነት',
      service_window_officer: 'የአገልግሎት መስኮት ኦፊሰር',
      security_guard: 'የጥበቃ ሰራተኛ',
      floor_window_manager: 'የወለልና መስኮት አስተዳዳሪ',
      receptionist: 'እንግዳ ተቀባይ',
      it_support_officer: 'የአይቲ ድጋፍ ኦፊሰር',
      service_requirement_manager: 'የአገልግሎትና መስፈርት አስተዳዳሪ',
      activate: 'መለያውን ያንቁ',
      activating: 'በማንቃት ላይ…',
      signIn: 'ወደ ሰራተኛ መግቢያ ይሂዱ',
      activationFailed: 'የመለያ ማንቃት አልተሳካም።',
    },
    or: {
      language: 'Afaan',
      title: 'Herrega hojjetaa hojii irra oolchi',
      fullName: 'Maqaa guutuu',
      nationalId: 'Waraqaa eenyummaa (lakkoofsa 12)',
      password: 'Jecha icciitii uumi',
      confirmPassword: 'Jecha icciitii mirkaneessi',
      passwordMismatch: 'Jechoonni icciitii wal hin siman.',
      success: 'Herregni hojjetaa kee hojii irra ooleera. Amma seenuu dandeessa.',
      role: 'Gosa hojjetaa siif ramadame',
      service_window_officer: 'Oofiisara foddaa tajaajilaa',
      security_guard: 'Eegduu nageenyaa',
      floor_window_manager: 'Bulchaa darbii fi foddaa',
      receptionist: 'Simataa',
      it_support_officer: 'Oofiisara deeggarsa IT',
      service_requirement_manager: 'Bulchaa tajaajilaa fi ulaagaa',
      activate: 'Herrega hojii irra oolchi',
      activating: 'Hojii irra oolchaa jira…',
      signIn: 'Gara seensa hojjetaa deemi',
      activationFailed: 'Herrega hojii irra oolchuun hin milkoofne.',
    },
  }[language]
  const [name, setName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [employeeType, setEmployeeType] = useState<EmployeeType | null>(null)
  const [busy, setBusy] = useState(false)

  const activate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError(copy.passwordMismatch)
      return
    }
    setBusy(true)
    setError('')
    setEmployeeType(null)
    try {
      const response = await fetch(`${BASE}/employees/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, nationalId, password }),
      })
      const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` })) as {
        message?: string
        employeeType?: EmployeeType
      }
      if (!response.ok) throw new Error(data.message || copy.activationFailed)
      setEmployeeType(data.employeeType || null)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.activationFailed)
    } finally {
      setBusy(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950"><form onSubmit={activate} className={`${panelClass} w-full max-w-md space-y-4`}>
    <div className="flex justify-end gap-2" aria-label={copy.language}>
      {(['en', 'am', 'or'] as const).map((option) => <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)} className={`rounded-lg px-2 py-1 text-xs ${language === option ? 'bg-emerald-700 text-white' : 'border dark:border-slate-700'}`}>{option === 'en' ? 'English' : option === 'am' ? 'አማርኛ' : 'Afaan Oromo'}</button>)}
    </div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{copy.title}</h1>
    {!employeeType ? <>
      <label className="block text-sm">{copy.fullName}<input className={`${inputClass} mt-1`} type="text" minLength={2} maxLength={120} autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="block text-sm">{copy.nationalId}<input className={`${inputClass} mt-1`} type="text" inputMode="numeric" pattern="[0-9]{12}" minLength={12} maxLength={12} autoComplete="off" required value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, '').slice(0, 12))} /></label>
      <label className="block text-sm">{copy.password}<input className={`${inputClass} mt-1`} type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label className="block text-sm">{copy.confirmPassword}<input className={`${inputClass} mt-1`} type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy || !token} className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? copy.activating : copy.activate}</button>
    </> : <>
      <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{copy.success}</p>
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">{copy.role}: <strong>{copy[employeeType]}</strong></p>
    </>}
    <Link to="/employe" className="block text-center text-sm text-emerald-700 underline dark:text-emerald-300">{copy.signIn}</Link>
  </form></main>
}
