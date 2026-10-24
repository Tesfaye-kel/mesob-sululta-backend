import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Building2, DoorOpen, Layers, Loader2, Wrench } from 'lucide-react'
import {
  getFloorsAdmin,
  getOrganizations,
  getRequirementsByService,
  getServicesAdmin,
  getWindowsAdmin,
  type FloorAdmin,
  type OrganizationSummary,
  type RequirementAdmin,
  type ServiceAdmin,
  type WindowAdmin,
} from '@/api/admin'
import { useLanguage } from '@/contexts/LanguageContext'

const tabs = [
  { key: 'floors', label: 'Floors', icon: Layers },
  { key: 'offices', label: 'Offices', icon: Building2 },
  { key: 'windows', label: 'Windows', icon: DoorOpen },
  { key: 'services', label: 'Services & Requirements', icon: Wrench },
] as const

type TabKey = typeof tabs[number]['key']

function localized(value?: { en?: string; am?: string; or?: string; om?: string }, language = 'en') {
  return value?.[language as 'en' | 'am' | 'or' | 'om'] || value?.en || value?.am || value?.or || value?.om || ''
}

function floorId(office: OrganizationSummary) {
  return typeof office.floorId === 'string' ? office.floorId : office.floorId?._id || ''
}

function serviceOfficeId(service: ServiceAdmin) {
  return typeof service.organization === 'string' ? service.organization : service.organization?._id || ''
}

function AdminServices() {
  const { t, language } = useLanguage()
  const copy = t.admin.portal.services
  const officeCopy = t.admin.portal.offices
  const [activeTab, setActiveTab] = useState<TabKey>('services')
  const [floors, setFloors] = useState<FloorAdmin[]>([])
  const [offices, setOffices] = useState<OrganizationSummary[]>([])
  const [windows, setWindows] = useState<WindowAdmin[]>([])
  const [services, setServices] = useState<ServiceAdmin[]>([])
  const [requirementsByService, setRequirementsByService] = useState<Record<string, RequirementAdmin[]>>({})
  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [expandedServiceId, setExpandedServiceId] = useState('')
  const [requirementsLoadingId, setRequirementsLoadingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getFloorsAdmin(), getOrganizations(), getWindowsAdmin(), getServicesAdmin()])
      .then(([floorRows, officeRows, windowRows, serviceRows]) => {
        if (!active) return
        setFloors(floorRows.sort((a, b) => a.floorNumber - b.floorNumber))
        setOffices(officeRows)
        setWindows(windowRows)
        setServices(serviceRows)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : t.admin.failedToLoad)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [t.admin.failedToLoad])

  const officeName = (id?: string) => {
    const office = offices.find((item) => item._id === id)
    return localized(office?.name, language)
  }
  const floorName = (floor: FloorAdmin) => localized(floor.name, language) || `${officeCopy.floor} ${floor.floorNumber}`
  const floorForOffice = (office: OrganizationSummary) =>
    floors.find((floor) => floor._id === floorId(office))
  const selectedOffice = offices.find((office) => office._id === selectedOfficeId)
  const officeServices = services.filter((service) => serviceOfficeId(service) === selectedOfficeId)

  const toggleRequirements = async (serviceId: string) => {
    if (expandedServiceId === serviceId) {
      setExpandedServiceId('')
      return
    }
    setExpandedServiceId(serviceId)
    if (requirementsByService[serviceId]) return
    setRequirementsLoadingId(serviceId)
    setError('')
    try {
      const rows = await getRequirementsByService(serviceId)
      setRequirementsByService((current) => ({ ...current, [serviceId]: rows }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.admin.failedToLoad)
    } finally {
      setRequirementsLoadingId('')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.admin.servicesManagement}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.description}</p>
      </div>

      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const label = tab.key === 'floors' ? t.admin.floorsTab
            : tab.key === 'windows' ? t.admin.windowsTab
              : tab.key === 'offices' ? t.admin.offices
                : t.admin.servicesRequirementsTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-green text-brand-green dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>

      {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertCircle className="h-4 w-4" />{error}</div>}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {activeTab === 'floors' && (floors.length
            ? floors.map((floor) => {
              const floorOffices = offices.filter((office) => floorId(office) === floor._id)
              const floorWindows = windows.filter((window) => window.floor === floor.floorNumber)
              return (
                <section key={floor._id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{floorName(floor)}</h2>
                    <span className="text-xs text-gray-500">{floorOffices.length} {t.admin.offices.toLowerCase()} · {floorWindows.length} {t.admin.windowsTab.toLowerCase()}</span>
                  </div>
                </section>
              )
            })
            : <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 dark:bg-gray-900">{copy.noFloors}</p>)}

          {activeTab === 'offices' && <>
            {floors.map((floor) => {
              const floorOffices = offices.filter((office) => floorId(office) === floor._id)
              return (
                <section key={floor._id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{floorName(floor)}</h2>
                  {floorOffices.length
                    ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {floorOffices.map((office) => <div key={office._id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">{localized(office.name, language)}</p>
                        <p className="mt-1 text-xs text-gray-500">{office.serviceCount ?? 0} {officeCopy.services}</p>
                      </div>)}
                    </div>
                    : <p className="text-sm text-gray-500">{officeCopy.noOfficesOnFloor}</p>}
                </section>
              )
            })}
            {offices.some((office) => !floorForOffice(office)) && <section className="space-y-3 rounded-xl border border-amber-300 bg-white p-4 dark:border-amber-900 dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-white">{officeCopy.noFloor}</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {offices.filter((office) => !floorForOffice(office)).map((office) => <div key={office._id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">{localized(office.name, language)}</p>
                  <p className="mt-1 text-xs text-gray-500">{office.serviceCount ?? 0} {officeCopy.services}</p>
                </div>)}
              </div>
            </section>}
          </>}

          {activeTab === 'windows' && <>
            {floors.map((floor) => {
              const floorWindows = windows.filter((window) => window.floor === floor.floorNumber)
              return (
                <section key={floor._id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{floorName(floor)}</h2>
                    <span className="text-xs text-gray-500">{floorWindows.length} {officeCopy.windows}</span>
                  </div>
                  {floorWindows.length
                    ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {floorWindows.map((window) => <div key={window._id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">{officeCopy.window} {window.number}</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {(window.assignedOrganizations?.length
                            ? window.assignedOrganizations.map((office) => localized(office.name, language))
                            : [officeName(window.organization?._id)]).filter(Boolean).join(', ') || copy.noOfficeAssigned}
                        </p>
                      </div>)}
                    </div>
                    : <p className="text-sm text-gray-500">{copy.noWindowsOnFloor}</p>}
                </section>
              )
            })}
          </>}

          {activeTab === 'services' && <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{copy.servicesByFloorOffice}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{copy.selectOfficeHint}</p>
            </div>
            <div className="space-y-4">
              {floors.map((floor) => {
                const floorOffices = offices.filter((office) => floorId(office) === floor._id)
                return <section key={floor._id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{floorName(floor)}</h3>
                    <span className="text-xs text-gray-500">{floorOffices.length} {t.admin.offices.toLowerCase()}</span>
                  </div>
                  {floorOffices.length
                    ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {floorOffices.map((office) => {
                        const count = services.filter((service) => serviceOfficeId(service) === office._id).length
                        const selected = selectedOfficeId === office._id
                        return <button key={office._id} type="button" onClick={() => { setSelectedOfficeId(office._id); setExpandedServiceId('') }} aria-pressed={selected} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${selected ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-gray-200 text-gray-800 hover:border-brand-green dark:border-gray-700 dark:text-gray-200'}`}>
                          <span className="truncate">{localized(office.name, language)}</span><span className="shrink-0 text-xs text-gray-500">{count} {officeCopy.services}</span>
                        </button>
                      })}
                    </div>
                    : <p className="text-sm text-gray-500">{officeCopy.noOfficesOnFloor}</p>}
                </section>
              })}
              {offices.some((office) => !floorForOffice(office)) && <section className="space-y-3 rounded-xl border border-amber-300 bg-white p-4 dark:border-amber-900 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white">{officeCopy.noFloor}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {offices.filter((office) => !floorForOffice(office)).map((office) => <button key={office._id} type="button" onClick={() => { setSelectedOfficeId(office._id); setExpandedServiceId('') }} aria-pressed={selectedOfficeId === office._id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-brand-green dark:border-gray-700">
                    <span className="truncate">{localized(office.name, language)}</span><span className="shrink-0 text-xs text-gray-500">{services.filter((service) => serviceOfficeId(service) === office._id).length} {officeCopy.services}</span>
                  </button>)}
                </div>
              </section>}
            </div>
            {!selectedOffice && <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800">{copy.selectOffice}</p>}
            {selectedOffice && <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-gray-900 dark:text-white">{localized(selectedOffice.name, language)}</h3><span className="text-xs text-gray-500">{officeServices.length} {officeCopy.services}</span></div>
              {!officeServices.length && <p className="text-sm text-gray-500">{copy.noServices}</p>}
              {officeServices.map((service) => <article key={service._id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h4 className="font-medium text-gray-900 dark:text-white">{localized(service.name, language)}</h4><p className="text-xs text-gray-500">{service.name.en} / {service.name.am} / {service.name.or}</p></div>
                  <button type="button" onClick={() => void toggleRequirements(service._id)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:border-brand-green dark:border-gray-600">{expandedServiceId === service._id ? copy.hideRequirements : copy.viewRequirements}</button>
                </div>
                {expandedServiceId === service._id && <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                  {requirementsLoadingId === service._id ? <p className="text-sm text-gray-500">{copy.loadingRequirements}</p>
                    : !(requirementsByService[service._id] || []).length ? <p className="text-sm text-gray-500">{copy.noRequirements}</p>
                      : <ol className="list-decimal space-y-2 pl-5">{requirementsByService[service._id].map((requirement) => <li key={requirement._id} className="text-sm text-gray-800 dark:text-gray-200">
                        <span>{localized(requirement.requirementText, language)}</span><span className="ml-2 text-xs text-gray-500">{requirement.isMandatory ? copy.required : copy.optional}{requirement.isActive === false ? ` (${copy.inactive})` : ''}</span>
                        {(requirement.notes?.en || requirement.notes?.am || requirement.notes?.or) && <p className="mt-0.5 text-xs text-gray-500">{localized(requirement.notes, language)}</p>}
                      </li>)}</ol>}
                </div>}
              </article>)}
            </section>}
          </>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default AdminServices
