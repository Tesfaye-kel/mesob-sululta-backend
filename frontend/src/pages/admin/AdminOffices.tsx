import { useEffect, useState } from 'react'
import { AlertCircle, Building2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import {
  getFloorsAdmin,
  getOrganizations,
  getWindowsAdmin,
  type FloorAdmin,
  type OrganizationSummary,
  type WindowAdmin,
} from '@/api/admin'
import { useLanguage } from '@/contexts/LanguageContext'

function localized(value: { en?: string; am?: string; or?: string; om?: string } | undefined, language: 'en' | 'am' | 'or') {
  return value?.[language] || value?.or || value?.om || value?.en || value?.am || ''
}

function AdminOffices() {
  const { t, language } = useLanguage()
  const copy = t.admin.portal.offices
  const [floors, setFloors] = useState<FloorAdmin[]>([])
  const [offices, setOffices] = useState<OrganizationSummary[]>([])
  const [windows, setWindows] = useState<WindowAdmin[]>([])
  const [expandedOfficeId, setExpandedOfficeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getFloorsAdmin(), getOrganizations(), getWindowsAdmin()])
      .then(([floorRows, officeRows, windowRows]) => {
        if (!active) return
        setFloors(floorRows.sort((a, b) => a.floorNumber - b.floorNumber))
        setOffices(officeRows)
        setWindows(windowRows)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : t.admin.failedToLoad)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const officeFloorId = (office: OrganizationSummary) =>
    typeof office.floorId === 'string' ? office.floorId : office.floorId?._id || ''
  const officeWindows = (officeId: string) => windows.filter((item) =>
    item.organization?._id === officeId || item.assignedOrganizations?.some((assigned) => assigned._id === officeId)
  )
  const renderOffice = (office: OrganizationSummary) => {
    const expanded = expandedOfficeId === office._id
    const assignedWindows = officeWindows(office._id)
    return <article key={office._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button type="button" onClick={() => setExpandedOfficeId(expanded ? '' : office._id)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
        <span className="flex min-w-0 items-center gap-3">
          <Building2 className="h-5 w-5 shrink-0 text-brand-green" />
          <span className="min-w-0"><span className="block truncate font-semibold text-gray-900 dark:text-white">{localized(office.name, language)}</span></span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-gray-500"><span>{office.serviceCount ?? 0} {copy.services} · {assignedWindows.length} {copy.windows}</span>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>
      {expanded && <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        {localized(office.description, language) && <p className="text-sm text-gray-600 dark:text-gray-300">{localized(office.description, language)}</p>}
        <div><h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{copy.assignedWindows}</h3>
          {assignedWindows.length
            ? <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">{assignedWindows.map((window) => <li key={window._id}>{copy.floor} {window.floor} · {copy.window} {window.number}</li>)}</ul>
            : <p className="text-sm text-gray-500">{copy.noWindows}</p>}
        </div>
      </div>}
    </article>
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>

  return <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.admin.offices}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.description}</p>
    </div>
    {error && <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"><AlertCircle className="h-5 w-5" />{error}</div>}
    {!error && <>
      {floors.map((floor) => {
        const floorOffices = offices.filter((office) => officeFloorId(office) === floor._id)
        return <section key={floor._id} className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800 dark:text-gray-200">{localized(floor.name, language) || `${copy.floor} ${floor.floorNumber}`}</h2><span className="text-xs text-gray-500">{floorOffices.length} {t.admin.offices.toLowerCase()}</span></div>
          {floorOffices.length ? <div className="space-y-2">{floorOffices.map(renderOffice)}</div> : <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800">{copy.noOfficesOnFloor}</p>}
        </section>
      })}
      {offices.some((office) => !officeFloorId(office)) && <section className="space-y-3">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{copy.noFloor}</h2>
        <div className="space-y-2">{offices.filter((office) => !officeFloorId(office)).map(renderOffice)}</div>
      </section>}
      {!offices.length && <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-800">{copy.noOffices}</p>}
    </>}
  </div>
}

export default AdminOffices
