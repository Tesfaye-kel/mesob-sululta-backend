import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { adminWorkflowRequest } from '@/api/adminWorkflows'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminAppointments from './AdminAppointments'

interface CitizenRegistration {
  _id: string
  displayName: string
  email: string | null
  occupation: string
  status: string
  createdAt: string
  maskedNationalId: string
}

interface CitizenRegistrationPage {
  registrations: CitizenRegistration[]
  pagination: { page: number; pages: number; total: number }
}

const panelClass = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900'
const buttonClass = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'

export default function AdminCitizens() {
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const copy = t.admin.portal.appointments
  const [activePanel, setActivePanel] = useState<'citizens' | 'appointments' | 'history'>(() =>
    location.hash === '#appointments-panel' ? 'appointments' :
      location.hash === '#appointment-history' ? 'history' : 'citizens'
  )
  const [page, setPage] = useState(1)
  const [registrations, setRegistrations] = useState<CitizenRegistration[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      if (search.trim()) params.set('search', search.trim())
      const result = await adminWorkflowRequest<CitizenRegistrationPage>(`/admin/citizen-registrations?${params}`)
      setRegistrations(result.registrations)
      setTotal(result.pagination.total)
      setPages(Math.max(1, result.pagination.pages))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [page, search, t.admin.failedToLoad])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    setActivePanel(location.hash === '#appointments-panel' ? 'appointments' :
      location.hash === '#appointment-history' ? 'history' : 'citizens')
  }, [location.hash])

  const selectPanel = (panel: typeof activePanel) => {
    setActivePanel(panel)
    const hash = panel === 'appointments' ? '#appointments-panel' : panel === 'history' ? '#appointment-history' : ''
    navigate({ pathname: location.pathname, hash }, { replace: true })
  }

  const statusLabel = (status: string) =>
    copy.citizenStatuses[status as keyof typeof copy.citizenStatuses] || status

  return (
    <main className="space-y-5">
      <div role="tablist" aria-label={copy.registeredCitizens} className="grid grid-cols-3 gap-2">
        {([
          ['citizens', copy.registeredCitizens],
          ['appointments', copy.appointments],
          ['history', copy.appointmentHistory],
        ] as const).map(([panel, label]) => (
          <button
            key={panel}
            type="button"
            role="tab"
            aria-selected={activePanel === panel}
            onClick={() => selectPanel(panel)}
            className={`min-w-0 rounded-lg px-3 py-2.5 text-center text-sm font-medium sm:px-4 ${activePanel === panel ? 'bg-brand-green text-white' : 'bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activePanel === 'citizens' && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.registeredCitizens}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {copy.registeredCitizensCount.replace('{count}', String(total))}
              </p>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className={`${buttonClass} inline-flex items-center gap-2`}>
              <RefreshCw className="h-4 w-4" />{t.common.retry}
            </button>
          </header>

          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder={copy.citizenSearch}
              aria-label={copy.citizenSearch}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

          <section className={`${panelClass} overflow-x-auto p-0`}>
            {loading ? <p className="p-6 text-sm text-gray-500">{t.common.loading}</p> : registrations.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">{search.trim() ? copy.noCitizenSearchResults : copy.noRegisteredCitizens}</p>
            ) : (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                  <tr>
                    {[copy.citizenName, copy.email, copy.nationalId, copy.occupation, copy.citizenStatus, copy.registeredAt].map((heading) => (
                      <th key={heading} className="px-4 py-3">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {registrations.map((citizen) => (
                    <tr key={citizen._id}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{citizen.displayName || '—'}</td>
                      <td className="px-4 py-3">{citizen.email || '—'}</td>
                      <td className="px-4 py-3 font-mono">{citizen.maskedNationalId || '—'}</td>
                      <td className="px-4 py-3">{citizen.occupation || '—'}</td>
                      <td className="px-4 py-3">{statusLabel(citizen.status)}</td>
                      <td className="px-4 py-3">{new Date(citizen.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {pages > 1 && (
            <footer className="flex items-center justify-between gap-4 text-sm text-gray-500">
              <span>{copy.pageOf.replace('{page}', String(page)).replace('{pages}', String(pages))}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className={buttonClass}>{copy.previousPage}</button>
                <button type="button" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className={buttonClass}>{copy.nextPage}</button>
              </div>
            </footer>
          )}
        </>
      )}

      {activePanel === 'appointments' && <AdminAppointments view="appointments" />}
      {activePanel === 'history' && <AdminAppointments view="history" />}
    </main>
  )
}
