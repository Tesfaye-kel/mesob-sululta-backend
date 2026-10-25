import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  LogOut,
  MessageSquareText,
  Moon,
  Sun,
  Ticket,
  UserRound,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  cancelCitizenBooking,
  changeCitizenPassword,
  createCitizenBooking,
  getCitizenAvailability,
  getCitizenBookings,
  getCitizenFeedback,
  getCitizenNotifications,
  getCitizenOptions,
  getCitizenProfile,
  getCitizenReceipts,
  getCitizenSession,
  logoutCitizen,
  loginCitizenAccount,
  setCitizenFirstPassword,
  submitCitizenFeedback,
  type CitizenAvailability,
  type CitizenBooking,
  type CitizenOffice,
  type CitizenProfile,
  type CitizenService,
  type CitizenUser,
} from '@/api/citizen'

type Receipt = Awaited<ReturnType<typeof getCitizenReceipts>>['receipts'][number]
type Feedback = Awaited<ReturnType<typeof getCitizenFeedback>>['feedback'][number]
type CitizenNotification = Awaited<ReturnType<typeof getCitizenNotifications>>['notifications'][number]
type VisibleNotification = { item: CitizenNotification; booking: CitizenBooking | null }

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const calendarLocales = { en: 'en-ET', am: 'am-ET', or: 'om-ET' } as const
const oromoEthiopianMonths = [
  'Fulbaana', 'Onkololeessa', 'Sadaasa', 'Muddee', 'Amajjii', 'Guraandhala',
  'Bitooteessa', 'Ebla', 'Caamsa', 'Waxabajjii', 'Adooleessa', 'Hagayya', 'Qaammee',
]

function getLocalizedBookingDateParts(date: string, language: 'en' | 'am' | 'or') {
  const dateValue = new Date(`${date}T12:00:00+03:00`)
  const calendar = language === 'en' ? 'gregory' : 'ethiopic'
  const parts = new Intl.DateTimeFormat(calendarLocales[language], {
    calendar,
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'Africa/Addis_Ababa',
  }).formatToParts(dateValue)
  const monthNumber = language === 'or'
    ? Number(new Intl.DateTimeFormat('en-ET-u-ca-ethiopic', {
      calendar: 'ethiopic',
      month: 'numeric',
      timeZone: 'Africa/Addis_Ababa',
    }).format(dateValue))
    : 0
  return {
    day: parts.find((part) => part.type === 'day')?.value || '',
    month: language === 'or'
      ? oromoEthiopianMonths[monthNumber - 1] || parts.find((part) => part.type === 'month')?.value || ''
      : parts.find((part) => part.type === 'month')?.value || '',
    weekday: parts.find((part) => part.type === 'weekday')?.value || '',
    year: parts.find((part) => part.type === 'year')?.value || '',
  }
}

function formatBookingDate(date: string, language: 'en' | 'am' | 'or') {
  const parts = getLocalizedBookingDateParts(date, language)
  return `${parts.month} ${parts.day}, ${parts.year}`
}

function formatEthiopianLocalTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const localHours = (hours + 6) % 12 || 12
  return `${localHours}:${String(minutes).padStart(2, '0')}`
}

export default function CitizenPortal() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const portalCopy = t.citizenPortal
  const appointmentStatus = (status: string) => ({
    CONFIRMED: portalCopy.confirmed,
    CHECKED_IN: portalCopy.checkedIn,
    IN_SERVICE: portalCopy.inService,
    AWAITING_APPROVAL: portalCopy.awaitingApproval,
    DELIVERED: portalCopy.delivered,
    REJECTED: portalCopy.rejected,
    NO_SHOW: portalCopy.noShow,
    CANCELLED: portalCopy.cancelled,
  }[status] || status.replace(/_/g, ' '))
  const feedbackStatus = (status: string) => ({
    new: portalCopy.statusNew,
    under_review: portalCopy.statusUnderReview,
    responded: portalCopy.statusResponded,
    resolved: portalCopy.statusResolved,
  }[status] || status.replace(/_/g, ' '))
  const [citizen, setCitizen] = useState<CitizenUser | null>(() => getCitizenSession())
  const [citizenName, setCitizenName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordSetupRequired, setPasswordSetupRequired] = useState(false)
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [offices, setOffices] = useState<CitizenOffice[]>([])
  const [services, setServices] = useState<CitizenService[]>([])
  const [bookings, setBookings] = useState<CitizenBooking[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [activeSection, setActiveSection] = useState<'book' | 'appointments' | 'notifications' | 'feedback' | 'profile' | 'settings'>('book')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedWindow, setSelectedWindow] = useState('')
  const [expandedService, setExpandedService] = useState('')
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [officeSearch, setOfficeSearch] = useState('')
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availability, setAvailability] = useState<CitizenAvailability[]>([])
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [feedbackDeliveryId, setFeedbackDeliveryId] = useState('')
  const [feedbackType, setFeedbackType] = useState('compliment')
  const [feedbackCategory, setFeedbackCategory] = useState('service_quality')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!citizen) return
    Promise.all([getCitizenOptions(), getCitizenBookings(), getCitizenReceipts(), getCitizenFeedback(), getCitizenNotifications(), getCitizenProfile()])
      .then(([options, appointmentData, receiptData, feedbackData, notificationData, profileData]) => {
        setOffices(options.offices)
        setServices(options.services)
        setBookings(appointmentData.bookings)
        setReceipts(receiptData.receipts)
        setFeedback(feedbackData.feedback)
        setNotifications(notificationData.notifications)
        setCitizenProfile(profileData.profile)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : portalCopy.loadPortalFailed)
        if (err instanceof Error && /unauthorized|expired/i.test(err.message)) {
          logoutCitizen()
          setCitizen(null)
        }
      })
  }, [citizen])

  const officeServices = useMemo(() => services.filter((service) => {
    const organizationId = typeof service.organization === 'string'
      ? service.organization
      : service.organization?._id
    return organizationId === selectedOffice
  }), [services, selectedOffice])
  const selectedOfficeRecord = offices.find((office) => office._id === selectedOffice)
  const visibleOffices = offices.filter((office) => {
    const name = office.name[language] || office.name.en
    const description = office.description?.[language] || office.description?.en || ''
    return `${name} ${description}`.toLowerCase().includes(officeSearch.toLowerCase().trim())
  })
  const dateRecord = availability.find((item) => item.date === selectedDate)
  const eligibleDeliveries = bookings.filter((booking) => {
    const delivery = booking.deliveryId
    return ['CHECKED_IN', 'IN_SERVICE', 'AWAITING_APPROVAL', 'DELIVERED', 'REJECTED'].includes(booking.status) &&
      !!delivery && typeof delivery !== 'string' &&
      ['CHECKED_IN', 'PENDING_ADMIN_APPROVAL', 'AWAITING_APPROVAL', 'ATTENDANCE_APPROVED', 'ATTENDANCE_REJECTED'].includes(delivery.status) &&
      !!delivery.feedbackDeadlineAt && new Date(delivery.feedbackDeadlineAt).getTime() > Date.now() &&
      !feedback.some((item) => item.serviceDeliveryId === delivery._id)
  })
  const visibleNotifications = notifications.flatMap<VisibleNotification>((item) => {
    if (item.type === 'feedback_request') {
      const booking = eligibleDeliveries.find((candidate) =>
        typeof candidate.deliveryId === 'object' && candidate.deliveryId?._id === item.relatedId
      )
      return booking ? [{ item, booking }] : []
    }
    return item.type === 'feedback_reply' ? [{ item, booking: null }] : []
  })

  useEffect(() => {
    if (!selectedWindow) {
      setAvailability([])
      setNextAvailableDate(null)
      setSelectedDate('')
      setAvailabilityLoading(false)
      return
    }
    let active = true
    setAvailability([])
    setAvailabilityLoading(true)
    getCitizenAvailability(selectedWindow, selectedOffice)
      .then((data) => {
        if (!active) return
        setAvailability(data.dates)
        setNextAvailableDate(data.nextAvailableDate)
        setSelectedDate((current) => data.dates.some((date) => date.date === current && date.bookable && date.sessions.some((session) => session.available))
          ? current
          : data.dates.find((date) => date.bookable && date.sessions.some((session) => session.available))?.date || '')
        setSelectedSession('')
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : portalCopy.loadCalendarFailed)
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false)
      })
    return () => { active = false }
  }, [selectedWindow, selectedOffice])

  const refreshBookings = async () => {
    const [appointmentData, receiptData, feedbackData, notificationData] = await Promise.all([
      getCitizenBookings(),
      getCitizenReceipts(),
      getCitizenFeedback(),
      getCitizenNotifications(),
    ])
    setBookings(appointmentData.bookings)
    setReceipts(receiptData.receipts)
    setFeedback(feedbackData.feedback)
    setNotifications(notificationData.notifications)
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      setCitizen(await loginCitizenAccount(citizenName, password))
      setPassword('')
      setPasswordSetupRequired(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.signInFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleFirstPasswordSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await setCitizenFirstPassword({
        name: citizenName,
        nationalId,
        password,
        confirmation: passwordConfirmation,
      })
      setPassword('')
      setPasswordConfirmation('')
      setPasswordSetupRequired(false)
      setNotice(portalCopy.setupSuccess)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.setupFailure)
    } finally {
      setBusy(false)
    }
  }

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await changeCitizenPassword(currentPassword, newPassword)
      setNotice(portalCopy.passwordUpdated)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.changePasswordFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedOffice || !selectedWindow || !selectedDate || !selectedSession) {
      setError(portalCopy.selectBookingDetails)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await createCitizenBooking({
        officeId: selectedOffice,
        windowId: selectedWindow,
        slotDate: selectedDate,
        session: selectedSession,
        idempotencyKey: crypto.randomUUID(),
      })
      setNotice(`${portalCopy.bookingConfirmed} ${portalCopy.reference}: ${result.booking.appointmentReference}`)
      await refreshBookings()
      const data = await getCitizenAvailability(selectedWindow, selectedOffice)
      setAvailability(data.dates)
      setNextAvailableDate(data.nextAvailableDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.confirmBookingFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (id: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await cancelCitizenBooking(id)
      setNotice(portalCopy.appointmentCancelled)
      await refreshBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.cancelBookingFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await submitCitizenFeedback({
        serviceDeliveryId: feedbackDeliveryId,
        type: feedbackType,
        category: feedbackCategory,
        message: feedbackText.trim(),
        rating: feedbackRating,
      })
      setNotice(portalCopy.feedbackSubmitted)
      setFeedbackText('')
      setFeedbackDeliveryId('')
      setFeedback((await getCitizenFeedback()).feedback)
      await refreshBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : portalCopy.submitFeedbackFailed)
    } finally {
      setBusy(false)
    }
  }

  const signOut = () => {
    logoutCitizen()
    setCitizen(null)
    setActiveSection('book')
    setSelectedOffice('')
    setSelectedWindow('')
    setAvailability([])
    setBookings([])
    setReceipts([])
    setFeedback([])
    setNotifications([])
    setNotice(portalCopy.signedOut)
    navigate('/citizen')
  }

  const navigationItems = [
    { id: 'book' as const, label: portalCopy.bookTitle, icon: CalendarRange },
    { id: 'appointments' as const, label: portalCopy.myAppointments, icon: Ticket },
    { id: 'notifications' as const, label: portalCopy.notifications, icon: Bell },
    { id: 'feedback' as const, label: portalCopy.feedbackAndComplaints, icon: MessageSquareText },
    { id: 'profile' as const, label: portalCopy.profileTitle, icon: UserRound },
    { id: 'settings' as const, label: portalCopy.themeSettings, icon: theme === 'dark' ? Moon : Sun },
  ]

  if (!citizen) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
        <section className={`${panelClass} w-full max-w-md space-y-4 p-7`}>
          <div className="flex justify-end">
            <label className="sr-only" htmlFor="citizen-login-language">{portalCopy.language}</label>
            <select id="citizen-login-language" className={`${inputClass} w-auto`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}>
              <option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">MESOB Sululta</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{portalCopy.loginTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">{portalCopy.citizenLoginDescription}</p>
          </div>
          {passwordSetupRequired ? <form onSubmit={handleFirstPasswordSetup} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{portalCopy.passwordSetupRequired}</p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{portalCopy.fullName}<input className={`${inputClass} mt-1`} required minLength={2} maxLength={120} autoComplete="name" value={citizenName} onChange={(event) => setCitizenName(event.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{portalCopy.nationalId}<input className={`${inputClass} mt-1`} required minLength={12} maxLength={12} pattern="[0-9]{12}" inputMode="numeric" autoComplete="off" value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, '').slice(0, 12))} /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{portalCopy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{portalCopy.confirmPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? portalCopy.checking : portalCopy.setPassword}</button>
          </form> : <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{portalCopy.fullName}<input className={`${inputClass} mt-1`} name="username" required minLength={2} maxLength={120} autoComplete="username" value={citizenName} onChange={(event) => setCitizenName(event.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="citizen-password">{portalCopy.passwordLabel}</label>
            <div className="relative">
              <input id="citizen-password" className={`${inputClass} pr-11`} name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? portalCopy.hidePassword : portalCopy.showPassword} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? portalCopy.checking : portalCopy.signIn}</button>
          </form>
          }
          <button type="button" onClick={() => {
            setPasswordSetupRequired(!passwordSetupRequired)
            setPassword('')
            setPasswordConfirmation('')
            setError('')
            setNotice('')
          }} className="w-full text-center text-sm text-emerald-700 underline dark:text-emerald-300">
            {passwordSetupRequired ? portalCopy.alreadySetPassword : portalCopy.firstTimeSetPassword}
          </button>
          {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}
          <p className="mt-3 text-center text-xs text-slate-500">{portalCopy.citizenRegistrationInPerson}</p>
          <Link to="/" className="mt-5 block text-center text-sm text-emerald-700 underline dark:text-emerald-300">{portalCopy.returnWebsite}</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-bold text-white">M</div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">MESOB Sululta</p><p className="mt-0.5 text-sm font-semibold">{portalCopy.portalTitle}</p></div>
          </div>
          <div className="mx-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{portalCopy.signedInAs}</p>
            <p className="mt-1 truncate text-sm font-semibold">{citizen.name}</p>
          </div>
          <nav aria-label={portalCopy.citizenNavigation} className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pt-6">
              {navigationItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActiveSection(id); setError(''); setNotice('') }} aria-current={activeSection === id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeSection === id ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={17} />{label}{id === 'notifications' && visibleNotifications.some(({ item }) => !item.isRead) && <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{visibleNotifications.filter(({ item }) => !item.isRead).length}</span>}</button>)}
          </nav>
          <div className="hidden border-t border-slate-200 p-4 dark:border-slate-800 lg:block">
            <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"><LogOut size={18} />{portalCopy.signOut}</button>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 px-5 pb-4 text-sm font-medium text-rose-700 dark:text-rose-300 lg:hidden"><LogOut size={17} />{portalCopy.signOut}</button>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-8">
            <div><h1 className="text-xl font-bold sm:text-2xl">{navigationItems.find((item) => item.id === activeSection)?.label}</h1><p className="mt-0.5 text-sm text-slate-500">{portalCopy.signedInAs} {citizen.name}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="citizen-language">{portalCopy.language}</label>
              <select id="citizen-language" className={`${inputClass} w-auto`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}><option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option></select>
              <Link to="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">{portalCopy.publicWebsite}</Link>
            </div>
          </header>
          <div className="space-y-5 p-4 sm:p-8">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}

        {activeSection === 'book' && <section className={`${panelClass} space-y-4`}>
          {!selectedOfficeRecord ? <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{portalCopy.chooseGovernmentOffice}</h2><p className="text-sm text-slate-500">{portalCopy.officeDirectoryHint}</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{offices.length} {portalCopy.governmentOffices}</span>
          </div>
          <label className="sr-only" htmlFor="office-search">{portalCopy.searchOffices}</label>
          <input id="office-search" className={inputClass} value={officeSearch} onChange={(event) => setOfficeSearch(event.target.value)} placeholder={portalCopy.searchOffices} />
          {!visibleOffices.length ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{portalCopy.noOfficeMatches}</p> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visibleOffices.map((office) => {
              const serviceCount = services.filter((item) => (typeof item.organization === 'string' ? item.organization : item.organization?._id) === office._id).length
              return <button key={office._id} type="button" onClick={() => {
                setSelectedOffice(office._id)
                setSelectedWindow(office.defaultWindow?._id || '')
                setExpandedService('')
                setShowBookingCalendar(false)
                setSelectedDate('')
                setSelectedSession('')
              }} aria-pressed={selectedOffice === office._id} className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${selectedOffice === office._id ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
                <span className="min-w-0">{office.name[language] || office.name.en}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">{serviceCount} {portalCopy.servicesAvailable}</span>
              </button>
            })}
          </div>}
          </> : <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><Building2 size={22} /></span>
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{portalCopy.officeServices}</p><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{selectedOfficeRecord.name[language] || selectedOfficeRecord.name.en}</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">{selectedOfficeRecord.description?.[language] || selectedOfficeRecord.description?.en || portalCopy.officeDescriptionFallback}</p></div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => {
                setSelectedOffice('')
                setSelectedWindow('')
                setExpandedService('')
                setShowBookingCalendar(false)
                setSelectedDate('')
                setSelectedSession('')
              }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft size={17} />{portalCopy.backToOffices}</button>
              <button type="button" disabled={!selectedWindow} onClick={() => { setShowBookingCalendar(true); setError('') }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><CalendarDays size={17} />{portalCopy.bookForOffice}</button>
            </div>
          </div>}
        </section>}

        {activeSection === 'profile' && <section className={`${panelClass} grid gap-5 md:grid-cols-2`}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{portalCopy.profileTitle}</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">{portalCopy.fullName}</dt><dd>{citizenProfile?.name || citizen.name}</dd>
              <dt className="text-slate-500">{portalCopy.occupationStatus}</dt><dd>{citizenProfile?.occupation || portalCopy.notRecorded}</dd>
              <dt className="text-slate-500">{portalCopy.nationalId}</dt><dd className="font-mono">{citizenProfile?.maskedNationalId || citizen.maskedNationalId || '********'}</dd>
              <dt className="text-slate-500">{portalCopy.email}</dt><dd>{citizenProfile?.email || portalCopy.emailNotProvided}</dd>
            </dl>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">{portalCopy.changePassword}</h3>
            <label className="block text-sm">{portalCopy.currentPassword}<input className={`${inputClass} mt-1`} type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label className="block text-sm">{portalCopy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{portalCopy.updatePassword}</button>
          </form>
        </section>}
        {activeSection === 'profile' && <section className={`${panelClass} space-y-3`}>
          <h2 className="flex items-center gap-2 text-lg font-bold"><FileCheck2 className="text-emerald-700" size={19} />{portalCopy.myReceipts}</h2>
          {!receipts.length ? <p className="text-sm text-slate-500">{portalCopy.receiptHint}</p> : receipts.map((receipt) => <article key={receipt._id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 dark:text-white">{receipt.receiptNumber}</p><p className="text-sm text-slate-600 dark:text-slate-300">{receipt.serviceId?.name?.[language] || receipt.serviceId?.name?.en} · {new Date(receipt.issuedAt).toLocaleDateString()}</p><a className="text-sm text-emerald-700 underline dark:text-emerald-300" href={`/receipt/verify?number=${encodeURIComponent(receipt.receiptNumber)}`}>{portalCopy.verifyReceipt}</a></div><img src={receipt.qrCode} alt={`QR code to verify receipt ${receipt.receiptNumber}`} className="h-20 w-20 rounded border bg-white p-1" /></article>)}
        </section>}

        {activeSection === 'book' && <section className={`${panelClass} flex flex-wrap items-center justify-between gap-3`}>
          <div><h2 className="text-lg font-semibold">{portalCopy.dashboardHeadline}</h2><p className="mt-1 text-sm text-slate-500">{portalCopy.dashboardDescription}</p></div>
          <div className="flex gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{offices.length} {portalCopy.governmentOffices}</span><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{bookings.filter((booking) => booking.status === 'CONFIRMED').length} {portalCopy.activeAppointments}</span></div>
        </section>}

        {activeSection === 'book' && selectedOfficeRecord && <section className={`${panelClass} space-y-5`}>
          <form onSubmit={handleBook} className="space-y-5">
            {!selectedWindow && <p className="text-sm text-amber-700 dark:text-amber-300">{portalCopy.noBookingWindow}</p>}
            {showBookingCalendar && selectedWindow && <div className="space-y-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/10">
              <div>
                <div className="mb-1 flex items-center gap-2"><CalendarDays size={18} className="text-emerald-700" /><h3 className="font-semibold text-slate-900 dark:text-white">{portalCopy.availableDates} · 30 {portalCopy.calendarDays}</h3></div>
                <p className="mb-3 text-sm text-slate-500">{portalCopy.ethiopianCalendar} · {portalCopy.calendarInstruction}</p>
                {!availability.length ? <p className="text-sm text-slate-500">{availabilityLoading ? portalCopy.loadingAvailability : portalCopy.noOpenDates}</p> : (
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-6">
                    {availability.map((date) => {
                      const dateParts = getLocalizedBookingDateParts(date.date, language)
                      return <button type="button" key={date.date} disabled={!date.bookable || !date.sessions.some((item) => item.available)} aria-pressed={selectedDate === date.date} onClick={() => { setSelectedDate(date.date); setSelectedSession('') }} className={`rounded-lg border px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 dark:disabled:bg-slate-950 ${selectedDate === date.date ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                        <span className="block text-[11px] text-slate-500">{dateParts.weekday}</span>
                        <span className="mt-0.5 block text-lg font-semibold leading-tight text-slate-900 dark:text-white">{dateParts.day} <span className="text-sm">{dateParts.month}</span></span>
                        <span className="block text-[10px] text-slate-500">{dateParts.year}</span>
                        <span className="mt-1 block text-[10px] text-slate-500">{date.alreadyBooked ? portalCopy.alreadyBooked : date.bookable ? `${date.sessions.filter((item) => item.available).length} ${portalCopy.sessionsAvailable}` : portalCopy.unavailable}</span>
                      </button>
                    })}
                  </div>
                )}
              </div>
              {dateRecord && <fieldset>
                <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Clock3 size={18} className="text-emerald-700" />{portalCopy.chooseSession}</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {[...dateRecord.sessions].sort((a, b) => a.id === b.id ? 0 : a.id === 'session2' ? -1 : 1).map((item) => <button type="button" key={item.id} disabled={!item.available} onClick={() => setSelectedSession(item.id)} aria-pressed={selectedSession === item.id} className={`rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 ${selectedSession === item.id ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900 dark:text-white">{item.id === 'session1' ? portalCopy.afternoon : portalCopy.morning}</span><span className={`text-xs font-semibold ${item.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>{item.available ? portalCopy.open : item.status === 'Fully Booked' ? portalCopy.fullyBookedStatus : portalCopy.unavailable}</span></div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatEthiopianLocalTime(item.start)}–{formatEthiopianLocalTime(item.end)} {portalCopy.eastAfricaTime}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.booked}/{item.capacity} {portalCopy.booked} · {item.remaining} {portalCopy.placesRemaining}</p>
                  </button>)}
                </div>
              </fieldset>}
              {dateRecord && dateRecord.alreadyBooked && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{portalCopy.alreadyBookedOfficeDay}</p>}
              {dateRecord && !dateRecord.alreadyBooked && !dateRecord.sessions.some((item) => item.available) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{portalCopy.fullyBooked} {nextAvailableDate ? portalCopy.nextAvailable.replace('{date}', formatBookingDate(nextAvailableDate, language)) : portalCopy.noSessionInHorizon}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-sm text-slate-600 dark:text-slate-300">{selectedDate && selectedSession ? `${portalCopy.confirmationSummary}: ${formatBookingDate(selectedDate, language)} · ${selectedSession === 'session1' ? portalCopy.afternoon : portalCopy.morning}` : portalCopy.selectDateAndSession}</p><button disabled={busy || !selectedOffice || !selectedWindow || !selectedDate || !selectedSession || !dateRecord?.sessions.some((item) => item.id === selectedSession && item.available)} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">{busy ? portalCopy.confirming : portalCopy.confirmAppointment}</button></div>
            </div>}
            {!officeServices.length ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{portalCopy.noOfficeServices}</p> : <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="hidden grid-cols-[minmax(0,1fr)_auto] items-center border-b bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 sm:grid"><span>{portalCopy.service}</span><span>{portalCopy.requirementsAndLinks}</span></div>
              {officeServices.map((item) => {
                const isExpanded = expandedService === item._id
                return <article key={item._id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.name[language] || item.name.en}</h3><p className="mt-1 text-sm text-slate-500">{item.description?.[language] || item.description?.en || portalCopy.serviceDescriptionFallback}</p><p className="mt-2 text-xs text-slate-500">{item.fee ? `${portalCopy.fee}: ${item.fee}` : portalCopy.noFee}{item.processingTime ? ` · ${item.processingTime}` : ''}</p>
                    </div>
                    <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedService(isExpanded ? '' : item._id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-slate-800"><FileCheck2 size={16} />{isExpanded ? portalCopy.hideRequirements : portalCopy.requirementsAndLinks}<ChevronRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={15} /></button>
                  </div>
                  {isExpanded && <div className="grid gap-4 bg-slate-50 px-4 py-4 dark:bg-slate-800/60 sm:grid-cols-2">
                    <div><h4 className="text-sm font-semibold">{portalCopy.requirements}</h4>{item.requirements?.length ? <ul className="mt-2 space-y-2">{item.requirements.map((requirement, index) => <li key={`${item._id}-req-${index}`} className="text-sm text-slate-600 dark:text-slate-300"><span className="mr-2 text-emerald-700">{requirement.isMandatory ? '•' : '–'}</span>{requirement.requirementText[language] || requirement.requirementText.en}{requirement.isMandatory && <span className="ml-1 text-xs text-rose-600">({portalCopy.mandatory})</span>}{requirement.notes?.[language] && <span className="mt-0.5 block pl-4 text-xs text-slate-500">{requirement.notes[language]}</span>}</li>)}</ul> : <p className="mt-1 text-sm text-slate-500">{portalCopy.noRequirements}</p>}
                      {!!item.requiredDocuments?.length && <div className="mt-4"><h4 className="text-sm font-semibold">{portalCopy.requiredDocuments}</h4><ul className="mt-1 list-inside list-disc text-sm text-slate-600 dark:text-slate-300">{item.requiredDocuments.map((document) => <li key={document}>{document}</li>)}</ul></div>}
                    </div>
                    <div><h4 className="text-sm font-semibold">{portalCopy.relevantLinks}</h4>{item.resourceLinks?.length ? item.resourceLinks.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 break-all text-sm text-emerald-700 underline dark:text-emerald-300">{url}<ExternalLink size={13} /></a>) : <p className="mt-1 text-sm text-slate-500">{portalCopy.noRelevantLinks}</p>}</div>
                  </div>}
                </article>
              })}
            </div>}

          </form>
        </section>}

        {activeSection === 'appointments' && <section className={`${panelClass} space-y-4`}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{portalCopy.myAppointments}</h2>
          {!bookings.length ? <p className="text-sm text-slate-500">{portalCopy.noAppointments}</p> : bookings.map((booking) => {
            const officeName = typeof booking.officeId === 'object'
              ? booking.officeId.name[language] || booking.officeId.name.en
              : portalCopy.office
            const ticketDate = formatBookingDate(booking.slotDate.slice(0, 10), language)
            return <article key={booking._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3 bg-emerald-50 px-4 py-4 dark:bg-emerald-950/30 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-xl bg-white p-2.5 text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300"><Building2 size={20} /></span>
                  <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{portalCopy.office}</p><h3 className="mt-0.5 truncate font-bold text-slate-900 dark:text-white">{officeName}</h3><p className="mt-1 break-all font-mono text-xs text-slate-500">{booking.appointmentReference}</p></div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-slate-900 dark:text-emerald-300">{appointmentStatus(booking.status)}</span>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700" />
              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div><p className="text-xs text-slate-500">{portalCopy.appointmentDate}</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{ticketDate}</p></div>
                  <div><p className="text-xs text-slate-500">{portalCopy.session}</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{booking.session === 'session1' ? portalCopy.afternoon : portalCopy.morning}</p><p className="text-xs text-slate-500">{booking.session === 'session1' ? '7:30–11:30' : '2:30–6:30'} {portalCopy.eastAfricaTime}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800 sm:min-w-32 sm:flex-col sm:justify-center sm:py-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{portalCopy.queue}</span>
                  <span className="font-mono text-3xl font-bold leading-none text-emerald-800 dark:text-emerald-300">#{booking.queueNumber}</span>
                </div>
              </div>
              {booking.status === 'CONFIRMED' && <div className="flex justify-end border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5"><button onClick={() => void handleCancel(booking._id)} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">{portalCopy.cancelAppointment}</button></div>}
            </article>
          })}
        </section>}

        {activeSection === 'notifications' && <section className={`${panelClass} space-y-3`}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{portalCopy.notifications}</h2>
          {!visibleNotifications.length ? <p className="text-sm text-slate-500">{portalCopy.noNotifications}</p> : visibleNotifications.map(({ item, booking }) => {
            const delivery = booking && typeof booking.deliveryId === 'object' ? booking.deliveryId : null
            const deadline = delivery?.feedbackDeadlineAt
              ? formatBookingDate(delivery.feedbackDeadlineAt.slice(0, 10), language)
              : ''
            const message = item.type === 'feedback_request'
              ? portalCopy.employeeFeedbackInvitation.replace('{date}', deadline)
              : item.message
            return <article key={item._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-900 dark:text-white">{item.type === 'feedback_request' ? portalCopy.feedbackAvailableTitle : item.title}</h3><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString(calendarLocales[language], { timeZone: 'Africa/Addis_Ababa' })}</time></div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
              {booking && delivery && <button type="button" onClick={() => { setFeedbackDeliveryId(delivery._id); setActiveSection('feedback') }} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">{portalCopy.giveFeedback}</button>}
            </article>
          })}
        </section>}

        {activeSection === 'feedback' && <section className={`${panelClass} space-y-6`}>
          <div>
            <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="text-emerald-700" size={19} /><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{portalCopy.serviceFeedback}</h2></div>
            {!eligibleDeliveries.length ? <p className="text-sm text-slate-500">{portalCopy.approvedServiceFeedback}</p> : (
              <form onSubmit={handleFeedback} className="space-y-3">
                <label className="block text-sm text-slate-700 dark:text-slate-300">{portalCopy.approvedService}
                  <select value={feedbackDeliveryId} onChange={(event) => setFeedbackDeliveryId(event.target.value)} required className={`${inputClass} mt-1`}>
                    <option value="">{portalCopy.chooseService}</option>{eligibleDeliveries.map((booking) => {
                      const delivery = booking.deliveryId as { _id: string }
                      const serviceName = typeof booking.serviceId === 'object' && booking.serviceId
                        ? booking.serviceId.name[language] || booking.serviceId.name.en
                        : portalCopy.service
                      return <option key={delivery._id} value={delivery._id}>{serviceName} · {booking.appointmentReference}</option>
                    })}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-slate-700 dark:text-slate-300">{portalCopy.type}<select className={`${inputClass} mt-1`} value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)}><option value="compliment">{portalCopy.compliment}</option><option value="complaint">{portalCopy.complaint}</option><option value="suggestion">{portalCopy.suggestion}</option></select></label>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">{portalCopy.category}<select className={`${inputClass} mt-1`} value={feedbackCategory} onChange={(event) => setFeedbackCategory(event.target.value)}><option value="service_quality">{portalCopy.serviceQuality}</option><option value="waiting_time">{portalCopy.waitingTime}</option><option value="staff_conduct">{portalCopy.staffConduct}</option><option value="suggestion">{portalCopy.suggestion}</option></select></label>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">{portalCopy.rating}<select className={`${inputClass} mt-1`} value={feedbackRating} onChange={(event) => setFeedbackRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                </div>
                <textarea className={inputClass} rows={4} minLength={20} maxLength={2000} required value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder={portalCopy.feedbackPlaceholder} />
                <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white disabled:opacity-50">{busy ? portalCopy.sending : portalCopy.submit}</button>
              </form>
            )}
            {feedback.map((item) => <div key={item._id} className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="font-medium">{item.type === 'compliment' ? portalCopy.compliment : item.type === 'complaint' ? portalCopy.complaint : portalCopy.suggestion} · {feedbackStatus(item.status)}</p><p className="mt-1">{item.message}</p>{item.response && <p className="mt-1 text-emerald-700 dark:text-emerald-300">{portalCopy.response}: {item.response}</p>}</div>)}
          </div>
        </section>}
        {activeSection === 'settings' && <section className={`${panelClass} max-w-3xl space-y-5`}>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{portalCopy.preferences}</p><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{portalCopy.themeSettings}</h2><p className="text-sm text-slate-500">{portalCopy.settingsHint}</p></div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="text-emerald-700" /> : <Sun className="text-amber-500" />}<div><p className="font-semibold">{portalCopy.appearance}</p><p className="text-sm text-slate-500">{theme === 'dark' ? portalCopy.darkMode : portalCopy.lightMode}</p></div></div><button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? portalCopy.darkMode : portalCopy.lightMode} aria-pressed={theme === 'dark'} className={`relative h-7 w-12 rounded-full transition ${theme === 'dark' ? 'bg-emerald-700' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${theme === 'dark' ? 'left-6' : 'left-1'}`} /></button></div>
        </section>}
        <p className="pb-6 text-center text-xs text-slate-500">{portalCopy.bookingSecurityHint}</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export function CitizenFirstPasswordPage() {
  const { language, setLanguage, t } = useLanguage()
  const copy = t.citizenPortal
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [form, setForm] = useState({ name: '', nationalId: '', password: '', confirmation: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.password !== form.confirmation) {
      setError(copy.passwordsMismatch)
      return
    }
    setBusy(true)
    try {
      await setCitizenFirstPassword({ ...form, token })
      setMessage(copy.setupSuccess)
      setForm({ name: '', nationalId: '', password: '', confirmation: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : ''
      setError(message.includes('setup link') || message.includes('registration details')
        ? copy.invalidSetupLink
        : copy.setupFailure)
    } finally {
      setBusy(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
    <section className={`${panelClass} w-full max-w-md space-y-4 p-7`}>
      <div className="flex justify-end">
        <label className="sr-only" htmlFor="citizen-setup-language">{copy.language}</label>
        <select id="citizen-setup-language" className={`${inputClass} w-auto`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}>
          <option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option>
        </select>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{copy.firstPasswordTitle}</h1>
      <p className="text-sm text-slate-500">{copy.firstPasswordHint}</p>
      {!token && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{copy.invalidSetupLink}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message ? <div className="space-y-4"><p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p><Link to="/citizen" className="block rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white">{copy.signIn}</Link></div> : token && <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">{copy.fullName}<input className={`${inputClass} mt-1`} required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="block text-sm">{copy.nationalId}<input className={`${inputClass} mt-1`} required minLength={12} maxLength={12} pattern="[0-9]{12}" inputMode="numeric" autoComplete="off" value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value.replace(/\D/g, '').slice(0, 12) })} /></label>
        <label className="block text-sm">{copy.newPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <label className="block text-sm">{copy.confirmPassword}<input className={`${inputClass} mt-1`} type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} /></label>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? copy.checking : copy.setPassword}</button>
      </form>}
      <Link to="/citizen" className="block text-center text-sm text-emerald-700 underline dark:text-emerald-300">{copy.signIn}</Link>
    </section>
  </main>
}
