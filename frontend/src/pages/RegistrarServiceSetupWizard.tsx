import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Building2, Check, DoorOpen, Layers, Loader2, Plus, RefreshCw, Wrench } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'mesob-registrar-token'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
const languages = ['en', 'am', 'or'] as const
type LanguageCode = typeof languages[number]
type Localized = Record<LanguageCode, string>
type Step = 0 | 1 | 2
type EntityType = 'floor' | 'office' | 'window' | 'service' | 'requirement'
type Action = 'create' | 'update' | 'delete'

interface FloorRecord {
  _id: string
  floorNumber: number
  name: Localized & { om?: string }
  description?: Localized & { om?: string }
  isActive?: boolean
}

interface OfficeRecord {
  _id: string
  name: Localized
  description?: Localized
  floorId?: string | { _id: string; floorNumber: number; name?: FloorRecord['name'] } | null
  isActive?: boolean
}

interface WindowRecord {
  _id: string
  number: number
  name?: Localized
  description?: Localized
  floor: number
  floorId?: string
  organization?: string | { _id: string; name?: Localized; floorId?: string } | null
  assignedOrganizations?: Array<string | { _id: string; name?: Localized }>
  isActive?: boolean
}

interface ServiceRecord {
  _id: string
  name: Localized
  description?: Localized
  organization?: string | { _id: string; name?: Localized; floorId?: string } | null
  window?: string | { _id: string; number: number; floor: number } | null
  requiredDocuments?: string[]
  resourceLinks?: string[]
  fee?: number
  processingTime?: string
  workingHours?: string
  contactPhone?: string
  isActive?: boolean
}

interface RequirementRecord {
  _id: string
  service: string | { _id: string }
  requirementText: Localized
  notes?: Localized
  isMandatory: boolean
  sequenceNo: number
  isActive?: boolean
}

interface SetupData {
  floors: FloorRecord[]
  offices: OfficeRecord[]
  windows: WindowRecord[]
  services: ServiceRecord[]
  requirements: RequirementRecord[]
  initialSetupApplied?: boolean
}

interface WindowAssignmentPair {
  floorNumber: number
  windowNumber: number
  offices: [string, string]
  key: string
}

const emptyLocalized = (): Localized => ({ en: '', am: '', or: '' })
const emptyFloorForm = () => ({ floorNumber: 1, name: emptyLocalized(), description: emptyLocalized(), isActive: true })
const emptyOfficeForm = (floorId = '') => ({ name: emptyLocalized(), description: emptyLocalized(), floorId, isActive: true })
const emptyWindowForm = (organization = '') => ({ number: '', name: emptyLocalized(), description: emptyLocalized(), organization, isActive: true })
const emptyServiceForm = () => ({
  name: emptyLocalized(),
  description: emptyLocalized(),
  organization: '',
  requiredDocuments: [] as string[],
  resourceLinks: [] as string[],
  fee: 0,
  processingTime: '',
  workingHours: '',
  contactPhone: '',
  isActive: true,
})
const emptyRequirementForm = () => ({ requirementText: emptyLocalized(), notes: emptyLocalized(), isMandatory: true, isActive: true })

function recordId(value: string | { _id: string } | null | undefined) {
  return typeof value === 'string' ? value : value?._id || ''
}

function labelFor(value: Localized | undefined, language: LanguageCode) {
  return value?.[language] || value?.en || value?.am || value?.or || ''
}

async function request<T>(path: string, options: RequestInit = {}, tokenKey = TOKEN_KEY): Promise<T> {
  const token = sessionStorage.getItem(tokenKey)
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data as T
}

function LocalizedFields({
  label,
  value,
  onChange,
  multiline = false,
  required = true,
}: {
  label: string
  value: Localized
  onChange: (next: Localized) => void
  multiline?: boolean
  required?: boolean
}) {
  const languageNames: Record<LanguageCode, string> = { en: 'English', am: 'Amharic', or: 'Afaan Oromo' }
  return <div className="grid gap-3 md:grid-cols-3">
    {languages.map((language) => <label key={language} className="block text-sm">
      {label} ({languageNames[language]})
      {multiline
        ? <textarea rows={2} maxLength={1000} value={value[language]} onChange={(event) => onChange({ ...value, [language]: event.target.value })} className={`${inputClass} mt-1`} />
        : <input required={required} maxLength={180} value={value[language]} onChange={(event) => onChange({ ...value, [language]: event.target.value })} className={`${inputClass} mt-1`} />}
    </label>)}
  </div>
}

export default function RegistrarServiceSetupWizard({
  employeeMode,
}: {
  employeeMode?: 'structure' | 'services'
}) {
  const { language } = useLanguage()
  const languageCode: LanguageCode = language === 'am' ? 'am' : language === 'or' ? 'or' : 'en'
  const [step, setStep] = useState<Step>(employeeMode === 'services' ? 2 : 0)
  const [data, setData] = useState<SetupData>({ floors: [], offices: [], windows: [], services: [], requirements: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState('')
  const [formType, setFormType] = useState<'floor' | 'office' | 'window' | 'service' | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [windowsPerFloor, setWindowsPerFloor] = useState<Record<number, number>>({ 1: 5, 2: 5, 3: 4 })
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, string>>({})
  const [windowNumberOverrides, setWindowNumberOverrides] = useState<Record<string, number>>({})
  const [distributionInitialized, setDistributionInitialized] = useState(false)
  const [floorForm, setFloorForm] = useState(emptyFloorForm)
  const [officeForm, setOfficeForm] = useState(emptyOfficeForm)
  const [windowForm, setWindowForm] = useState(emptyWindowForm)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [requiredDocumentsText, setRequiredDocumentsText] = useState('')
  const [resourceLinksText, setResourceLinksText] = useState('')
  const [requirementForm, setRequirementForm] = useState(emptyRequirementForm)
  const [showRequirementForm, setShowRequirementForm] = useState(false)
  const [editingRequirementId, setEditingRequirementId] = useState('')
  const apiPrefix = employeeMode ? '/employees/management' : '/registrar'
  const tokenKey = employeeMode ? 'mesob-employee-token' : TOKEN_KEY
  const visibleStepNumbers = employeeMode === 'structure' ? [0, 1] : employeeMode === 'services' ? [2] : [0, 1, 2]

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await request<SetupData>(`${apiPrefix}/setup-data`, {}, tokenKey)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load setup records.')
    } finally {
      setLoading(false)
    }
  }, [apiPrefix, tokenKey])

  useEffect(() => { void load() }, [load])

  const submitChange = async (
    entityType: EntityType,
    action: Action,
    targetId: string | undefined,
    record: Record<string, unknown> = {},
    options: { generateDefaultRequirements?: boolean } = {}
  ) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>(`${apiPrefix}/setup-changes`, {
        method: 'POST',
        body: JSON.stringify({ entityType, action, ...(targetId ? { targetId } : {}), data: record, ...options }),
      }, tokenKey)
      setNotice(result.message)
      setShowForm(false)
      setShowRequirementForm(false)
      setEditingId('')
      setFormType('')
      setEditingRequirementId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this change.')
    } finally {
      setBusy(false)
    }
  }

  const applyInitialAssignments = async () => {
    if (!assignmentPlanValid) {
      setError('Assign every active office once, two offices per window, and configure the window count for all three floors.')
      return
    }
    if (!window.confirm(`Apply this initial assignment now? Services will first be assigned to offices using the Tajaajila Waajjiraa Excel sheet, then ${activeOffices.length} offices will be paired across ${initialAssignmentPlan.length} shared windows.`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>(`${apiPrefix}/setup-changes/apply-initial-window-assignments`, {
        method: 'POST',
        body: JSON.stringify({
          pairs: initialAssignmentPlan.map((pair) => ({
            floorNumber: pair.floorNumber,
            windowNumber: pair.windowNumber,
            officeIds: pair.offices,
          })),
        }),
      }, tokenKey)
      setNotice(result.message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply the initial window assignments.')
    } finally {
      setBusy(false)
    }
  }

  const floors = useMemo(() => data.floors.filter((floor) => floor.floorNumber >= 1 && floor.floorNumber <= 3), [data.floors])
  const activeOffices = useMemo(() => data.offices.filter((office) => office.isActive !== false), [data.offices])
  const activeWindows = useMemo(() => data.windows.filter((item) => item.isActive !== false), [data.windows])
  const serviceReadyOffices = useMemo(() => activeOffices.filter((office) => {
    const floorId = recordId(office.floorId)
    const hasActiveFloor = floors.some((floor) => floor._id === floorId && floor.isActive !== false)
    const hasActiveWindow = activeWindows.some((item) =>
      recordId(item.organization) === office._id ||
      item.assignedOrganizations?.some((assigned) => recordId(assigned) === office._id)
    )
    return hasActiveFloor && hasActiveWindow
  }), [activeOffices, activeWindows, floors])
  const selectableServiceOffices = employeeMode === 'services' ? serviceReadyOffices : activeOffices
  const visibleServices = useMemo(() => {
    const needle = serviceSearch.trim().toLocaleLowerCase()
    return data.services.filter((service) => !needle || [service.name.en, service.name.am, service.name.or].some((name) => name?.toLocaleLowerCase().includes(needle)))
  }, [data.services, serviceSearch])
  const unassignedServices = useMemo(
    () => visibleServices.filter((service) => !data.offices.some((office) => office._id === recordId(service.organization))),
    [data.offices, visibleServices]
  )
  const selectedOffice = data.offices.find((office) => office._id === selectedOfficeId)
  const selectedOfficeServices = selectedOfficeId === 'unassigned'
    ? unassignedServices
    : visibleServices.filter((service) => recordId(service.organization) === selectedOfficeId)
  const selectedService = data.services.find((service) => service._id === selectedServiceId)
  const selectedServiceRequirements = data.requirements
    .filter((item) => recordId(item.service) === selectedServiceId)
    .sort((a, b) => a.sequenceNo - b.sequenceNo)

  const floorMissing = [1, 2, 3].filter((number) => !floors.some((floor) => floor.floorNumber === number))
  const officesOutsideListedFloors = data.offices.filter((office) => !floors.some((floor) => floor._id === recordId(office.floorId)))
  const unassignedWindows = data.windows.filter((item) => !recordId(item.organization))
  useEffect(() => {
    if (distributionInitialized || loading || !activeOffices.length || data.initialSetupApplied) return
    const windowCount = Math.ceil(activeOffices.length / 2)
    const firstFloorCount = Math.ceil(windowCount / 3)
    const secondFloorCount = Math.ceil((windowCount - firstFloorCount) / 2)
    setWindowsPerFloor({
      1: firstFloorCount,
      2: secondFloorCount,
      3: windowCount - firstFloorCount - secondFloorCount,
    })
    setDistributionInitialized(true)
  }, [activeOffices.length, data.initialSetupApplied, distributionInitialized, loading])
  const initialAssignmentPlan = useMemo(() => {
    const offices = activeOffices
    let officeIndex = 0
    const plan: WindowAssignmentPair[] = []
    for (const floorNumber of [1, 2, 3]) {
      for (let windowIndex = 0; windowIndex < (windowsPerFloor[floorNumber] || 0); windowIndex += 1) {
        const key = `${floorNumber}-${windowIndex}`
        const defaults = [offices[officeIndex]?._id || '', offices[officeIndex + 1]?._id || '']
        const first = assignmentOverrides[`${key}-0`] || defaults[0]
        const second = assignmentOverrides[`${key}-1`] || defaults[1]
        const windowNumber = windowNumberOverrides[key] ?? windowIndex + 1
        plan.push({ floorNumber, windowNumber, offices: [first, second], key })
        officeIndex += 2
      }
    }
    return plan
  }, [activeOffices, windowsPerFloor, assignmentOverrides, windowNumberOverrides])
  const plannedOfficeIds = initialAssignmentPlan.flatMap((pair) => pair.offices).filter(Boolean)
  const plannedWindowNumbers = initialAssignmentPlan.map((pair) => `${pair.floorNumber}:${pair.windowNumber}`)
  const assignmentPlanValid = activeOffices.length > 0 &&
    activeOffices.length % 2 === 0 &&
    initialAssignmentPlan.length === activeOffices.length / 2 &&
    plannedOfficeIds.length === activeOffices.length &&
    new Set(plannedOfficeIds).size === activeOffices.length &&
    initialAssignmentPlan.every((pair) => Number.isInteger(pair.windowNumber) && pair.windowNumber > 0) &&
    new Set(plannedWindowNumbers).size === initialAssignmentPlan.length &&
    [1, 2, 3].every((floorNumber) => floors.some((floor) => floor.floorNumber === floorNumber))

  const canAdvance = step === 0
    ? floorMissing.length === 0
    : true

  const steps = [
    { title: 'Floors', description: 'Create or edit the three floors', icon: Layers },
    { title: 'Offices & Windows', description: 'Assign offices to floors and windows to offices', icon: Building2 },
    { title: 'Services & Requirements', description: 'Assign services to offices and manage requirements', icon: Wrench },
  ]

  const startFloorEdit = (floor: FloorRecord) => {
    setEditingId(floor._id)
    setFormType('floor')
    setFloorForm({
      floorNumber: floor.floorNumber,
      name: { en: floor.name.en || '', am: floor.name.am || '', or: floor.name.or || floor.name.om || '' },
      description: { en: floor.description?.en || '', am: floor.description?.am || '', or: floor.description?.or || floor.description?.om || '' },
      isActive: floor.isActive !== false,
    })
    setShowForm(true)
  }

  const startOfficeEdit = (office: OfficeRecord) => {
    setEditingId(office._id)
    setFormType('office')
    setOfficeForm({
      name: { en: office.name.en || '', am: office.name.am || '', or: office.name.or || '' },
      description: { en: office.description?.en || '', am: office.description?.am || '', or: office.description?.or || '' },
      floorId: recordId(office.floorId),
      isActive: office.isActive !== false,
    })
    setShowForm(true)
  }

  const startWindowEdit = (item: WindowRecord) => {
    setEditingId(item._id)
    setFormType('window')
    setWindowForm({
      number: String(item.number),
      name: { en: item.name?.en || '', am: item.name?.am || '', or: item.name?.or || '' },
      description: { en: item.description?.en || '', am: item.description?.am || '', or: item.description?.or || '' },
      organization: recordId(item.organization) || activeOffices.find((office) => recordId(office.floorId))?._id || '',
      isActive: item.isActive !== false,
    })
    setShowForm(true)
  }

  const startServiceEdit = (service: ServiceRecord) => {
    setEditingId(service._id)
    setFormType('service')
    setServiceForm({
      name: { en: service.name.en || '', am: service.name.am || '', or: service.name.or || '' },
      description: { en: service.description?.en || '', am: service.description?.am || '', or: service.description?.or || '' },
      organization: recordId(service.organization),
      requiredDocuments: service.requiredDocuments || [],
      resourceLinks: service.resourceLinks || [],
      fee: service.fee || 0,
      processingTime: service.processingTime || '',
      workingHours: service.workingHours || '',
      contactPhone: service.contactPhone || '',
      isActive: service.isActive !== false,
    })
    setRequiredDocumentsText((service.requiredDocuments || []).join('\n'))
    setResourceLinksText((service.resourceLinks || []).join('\n'))
    setShowForm(true)
  }

  const startRequirementEdit = (requirement: RequirementRecord) => {
    setEditingRequirementId(requirement._id)
    setRequirementForm({
      requirementText: { ...requirement.requirementText },
      notes: { en: requirement.notes?.en || '', am: requirement.notes?.am || '', or: requirement.notes?.or || '' },
      isMandatory: requirement.isMandatory,
      isActive: requirement.isActive !== false,
    })
    setShowRequirementForm(true)
  }

  const saveFloor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitChange('floor', editingId ? 'update' : 'create', editingId || undefined, floorForm)
  }
  const saveOffice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitChange('office', editingId ? 'update' : 'create', editingId || undefined, officeForm)
  }
  const saveWindow = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitChange('window', editingId ? 'update' : 'create', editingId || undefined, {
      ...windowForm,
      number: Number(windowForm.number),
    })
  }
  const saveService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!serviceForm.organization) {
      setError('Choose an office for this service.')
      return
    }
    if (editingId && !window.confirm('Save these service changes immediately?')) return
    const generateDefaultRequirements = !editingId && window.confirm(
      'Generate suggested default requirements for this service? Choose Cancel to create the service without defaults and add its requirements manually.'
    )
    void submitChange('service', editingId ? 'update' : 'create', editingId || undefined, {
      ...(editingId
        ? {
            ...serviceForm,
            requiredDocuments: requiredDocumentsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
            resourceLinks: resourceLinksText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          }
        : {
            name: serviceForm.name,
            organization: serviceForm.organization,
          }),
    }, { generateDefaultRequirements })
  }

  const saveRequirement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedServiceId) {
      setError('Select a service before adding requirements.')
      return
    }
    const existing = data.requirements.find((item) => item._id === editingRequirementId)
    void submitChange('requirement', editingRequirementId ? 'update' : 'create', editingRequirementId || undefined, {
      ...requirementForm,
      service: selectedServiceId,
      sequenceNo: existing?.sequenceNo ?? selectedServiceRequirements.length,
    })
  }

  const confirmDelete = (type: EntityType, id: string, label: string) => {
    if (!window.confirm(`Delete "${label}" immediately? Records with dependent history cannot be deleted.`)) return
    void submitChange(type, 'delete', id)
  }

  const updateRequirementStatus = (requirement: RequirementRecord) => {
    void submitChange('requirement', 'update', requirement._id, {
      requirementText: requirement.requirementText,
      notes: requirement.notes || emptyLocalized(),
      isMandatory: requirement.isMandatory,
      isActive: requirement.isActive === false,
      sequenceNo: requirement.sequenceNo,
      service: recordId(requirement.service),
    })
  }

  const moveRequirement = (requirement: RequirementRecord, direction: -1 | 1) => {
    const index = selectedServiceRequirements.findIndex((item) => item._id === requirement._id)
    const target = selectedServiceRequirements[index + direction]
    if (!target) return
    setBusy(true)
    setError('')
    setNotice('')
    void (async () => {
      try {
        const result = await request<{ message: string }>(`${apiPrefix}/requirements/reorder`, {
          method: 'POST',
          body: JSON.stringify({
            serviceId: selectedServiceId,
            requirementId: requirement._id,
            targetRequirementId: target._id,
          }),
        }, tokenKey)
        setNotice(result.message)
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update requirement order.')
        await load()
      } finally {
        setBusy(false)
      }
    })()
  }

  const openCreate = (kind: EntityType) => {
    setEditingId('')
    setError('')
    setFormType(kind === 'floor' || kind === 'office' || kind === 'window' || kind === 'service' ? kind : '')
    if (kind === 'floor') {
      const number = floorMissing[0] || [1, 2, 3].find((item) => !floors.some((floor) => floor.floorNumber === item)) || 1
      setFloorForm({ ...emptyFloorForm(), floorNumber: number })
    }
    if (kind === 'office') setOfficeForm(emptyOfficeForm(floors.find((floor) => floor.floorNumber === 1)?._id || ''))
    if (kind === 'window') setWindowForm(emptyWindowForm(activeOffices.find((office) => recordId(office.floorId))?._id || ''))
    if (kind === 'service') {
      setServiceForm({ ...emptyServiceForm(), organization: selectedOfficeId === 'unassigned' ? '' : selectedOfficeId })
      setRequiredDocumentsText('')
    }
    setShowForm(true)
  }

  const formTitle = editingId ? 'Edit record' : 'Add record'

  const visibleSteps = steps.filter((_, index) => visibleStepNumbers.includes(index))
  if (loading && !data.floors.length && !data.offices.length && !data.services.length) {
    return <div className={`${panelClass} flex items-center justify-center gap-3 py-12 text-sm text-slate-500`}><Loader2 className="h-5 w-5 animate-spin" />Loading setup records…</div>
  }

  return <div className="space-y-5">
    <section className={`${panelClass} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{employeeMode === 'structure' ? 'Office, floor and window management' : employeeMode === 'services' ? 'Service and requirement management' : 'Service setup wizard'}</h2>
          <p className="mt-1 text-sm text-slate-500">{employeeMode === 'structure' ? 'Create and manage offices, floors, and service windows.' : employeeMode === 'services' ? 'Choose an office after it has an active floor and window, then manage its services and requirements.' : 'Floor, office, window, service, and requirement changes apply immediately.'}</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>
      <ol className={`grid gap-2 ${visibleSteps.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2'}`} aria-label="Service setup steps">
        {visibleSteps.map(({ title, description, icon: Icon }) => {
          const stepNumber = steps.findIndex((item) => item.title === title)
          return <li key={title}>
            <button type="button" onClick={() => { if (stepNumber <= step) setStep(stepNumber as Step) }} disabled={stepNumber > step} aria-current={stepNumber === step ? 'step' : undefined} className={`flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${stepNumber === step ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${stepNumber < step ? 'bg-emerald-700 text-white' : stepNumber === step ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{stepNumber < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
              <span><span className="block text-sm font-semibold">{stepNumber + 1}. {title}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
            </button>
          </li>
        })}
      </ol>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}
    </section>

    {step === 0 && <section className={`${panelClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold">Step 1 — Floors 1 to 3</h3><p className="text-sm text-slate-500">The workbook describes the floor groups. This setup flow manages floors 1, 2, and 3 only.</p></div>
        <button type="button" onClick={() => openCreate('floor')} disabled={!floorMissing.length || busy} title={!floorMissing.length ? 'Floors 1, 2, and 3 already exist. Edit a floor card to change it.' : undefined} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add floor</button>
      </div>
      {floorMissing.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Create the missing floors: {floorMissing.join(', ')}.</p>}
      {!floorMissing.length && <p className="text-sm text-slate-500">All supported floors already exist. Use Edit on a floor card to make changes.</p>}
      {!floors.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">No floor records found yet.</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((number) => {
          const floor = floors.find((item) => item.floorNumber === number)
          return <article key={number} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-xs font-semibold uppercase text-slate-500">Floor {number}</p><h4 className="mt-1 font-semibold">{floor ? labelFor(floor.name, languageCode) : 'Not created'}</h4><p className="mt-1 text-xs text-slate-500">{floor ? `${floor.name.en} · ${floor.name.am} · ${floor.name.or || floor.name.om || ''}` : 'Create a floor record to continue.'}</p></div>
              {floor && <span className={`rounded-full px-2 py-0.5 text-xs ${floor.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-800'}`}>{floor.isActive === false ? 'Inactive' : 'Active'}</span>}
            </div>
            {floor && <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => startFloorEdit(floor)} className="rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700">Edit</button>
              <button type="button" onClick={() => confirmDelete('floor', floor._id, `Floor ${floor.floorNumber}`)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700">Delete</button>
            </div>}
          </article>
        })}
      </div>
      {showForm && step === 0 && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setShowForm(false) }}>
        <form onSubmit={saveFloor} role="dialog" aria-modal="true" aria-label={`${formTitle} — Floor`} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:p-6">
          <h4 className="font-semibold">{formTitle} — Floor</h4>
          <label className="block max-w-xs text-sm">Floor number<select autoFocus required value={floorForm.floorNumber} disabled={!!editingId} onChange={(event) => setFloorForm({ ...floorForm, floorNumber: Number(event.target.value) })} className={`${inputClass} mt-1`}>{[1, 2, 3].filter((number) => !floors.some((floor) => floor.floorNumber === number) || (editingId && floors.some((floor) => floor._id === editingId && floor.floorNumber === number))).map((number) => <option key={number} value={number}>{number}</option>)}</select></label>
          <LocalizedFields label="Floor name" value={floorForm.name} onChange={(name) => setFloorForm({ ...floorForm, name })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={floorForm.isActive} onChange={(event) => setFloorForm({ ...floorForm, isActive: event.target.checked })} />Active</label>
          <FormButtons busy={busy} onCancel={() => setShowForm(false)} submitLabel={editingId ? 'Save floor changes' : 'Create floor'} />
        </form>
      </div>, document.body)}
      <WizardFooter step={step} setStep={setStep} canAdvance={canAdvance} blockedMessage={floorMissing.length ? 'Create all three floor records before moving on.' : ''} />
    </section>}

    {step === 1 && <section className={`${panelClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold">Step 2 — Offices and windows</h3><p className="text-sm text-slate-500">All existing offices and windows are listed. New and unassigned offices default to Floor 1 in the edit form; you can change the assignment before submitting.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => openCreate('office')} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"><Plus className="h-4 w-4" />Add office</button>
          <button type="button" onClick={() => openCreate('window')} disabled={!activeOffices.length || busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Add window</button>
        </div>
      </div>
      {!employeeMode && (data.initialSetupApplied
        ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">The initial shared-window assignment has been applied. You can continue to manage floors, offices, and windows here.</p>
        : <section className="space-y-4 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div><h4 className="font-semibold">Initial shared-window assignment</h4><p className="text-sm text-slate-600 dark:text-slate-300">Edit the window counts and office pairs. Applying this one-time setup first assigns services to offices from the Tajaajila Waajjiraa Excel sheet, then assigns each active office to a floor and a shared window.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((floorNumber) => <label key={floorNumber} className="block text-sm">Floor {floorNumber} windows<input type="number" min={0} max={activeOffices.length / 2} value={windowsPerFloor[floorNumber] || 0} onChange={(event) => { setWindowsPerFloor((current) => ({ ...current, [floorNumber]: Number(event.target.value) })); setAssignmentOverrides({}); setWindowNumberOverrides({}) }} className={`${inputClass} mt-1`} /></label>)}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{activeOffices.length} active offices · {initialAssignmentPlan.length} planned windows · Window numbers can repeat on different floors; each floor needs unique window numbers.</p>
          {initialAssignmentPlan.length > 0 && <div className="space-y-3">
            {[1, 2, 3].map((floorNumber) => {
              const floor = floors.find((item) => item.floorNumber === floorNumber)
              const pairs = initialAssignmentPlan.filter((pair) => pair.floorNumber === floorNumber)
              if (!pairs.length) return null
              return <section key={floorNumber} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <h5 className="font-semibold">Floor {floorNumber} — {labelFor(floor?.name, languageCode)}</h5>
                {pairs.map((pair) => <div key={pair.key} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[8rem_1fr_1fr_1fr] dark:bg-slate-800">
                  <label className="block text-xs">Window number<input type="number" min={1} value={pair.windowNumber} onChange={(event) => setWindowNumberOverrides((current) => ({ ...current, [pair.key]: Number(event.target.value) }))} className={`${inputClass} mt-1 text-sm`} /></label>
                  {[0, 1].map((slotIndex) => <label key={slotIndex} className="block text-xs">Office {slotIndex + 1}<select value={pair.offices[slotIndex]} onChange={(event) => setAssignmentOverrides((current) => ({ ...current, [`${pair.key}-${slotIndex}`]: event.target.value }))} className={`${inputClass} mt-1 text-sm`}><option value="">Select office</option>{activeOffices.map((office) => <option key={office._id} value={office._id}>{labelFor(office.name, languageCode)}</option>)}</select></label>)}
                </div>)}
              </section>
            })}
          </div>}
          <button type="button" onClick={() => void applyInitialAssignments()} disabled={busy || !assignmentPlanValid} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Applying…' : 'Apply this initial assignment'}</button>
        </section>)}
      {!data.offices.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">No offices found. Add offices using the records from the workbook.</p>}
      {floors.map((floor) => {
        const floorOffices = data.offices.filter((office) => recordId(office.floorId) === floor._id)
        return <section key={floor._id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center justify-between"><h4 className="font-semibold">{labelFor(floor.name, languageCode) || `Floor ${floor.floorNumber}`}</h4><span className="text-xs text-slate-500">{floorOffices.length} offices</span></div>
          {!floorOffices.length && <p className="text-sm text-slate-500">No offices assigned. Use Edit on an office to assign it here.</p>}
          {floorOffices.map((office) => {
            const officeWindows = data.windows.filter((item) => recordId(item.organization) === office._id || item.assignedOrganizations?.some((assigned) => recordId(assigned) === office._id))
            return <article key={office._id} className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h5 className="font-medium">{labelFor(office.name, languageCode)}</h5><p className="text-xs text-slate-500">{office.name.en} · {office.name.am} · {office.name.or}</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => startOfficeEdit(office)} className="rounded border px-3 py-1.5 text-sm dark:border-slate-700">Edit office / floor</button><button type="button" onClick={() => confirmDelete('office', office._id, office.name.en)} className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">Delete</button></div>
              </div>
              <div className="flex items-center justify-between gap-2"><h6 className="text-sm font-semibold">Windows ({officeWindows.length})</h6><button type="button" onClick={() => { setEditingId(''); setFormType('window'); setWindowForm(emptyWindowForm(office._id)); setShowForm(true) }} className="rounded border px-3 py-1 text-xs dark:border-slate-700">Add window to office</button></div>
              {!officeWindows.length && <p className="text-xs text-slate-500">No windows assigned.</p>}
              {officeWindows.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                <span>{labelFor(item.name, languageCode) || `Window ${item.number}`} · #{item.number} · Floor {item.floor}</span>
                <div className="flex gap-2"><button type="button" onClick={() => startWindowEdit(item)} className="text-emerald-700 underline">Edit / reassign</button><button type="button" onClick={() => confirmDelete('window', item._id, `Window ${item.number}`)} className="text-red-700 underline">Delete</button></div>
              </div>)}
            </article>
          })}
        </section>
      })}
      {officesOutsideListedFloors.length > 0 && <section className="space-y-3 rounded-xl border border-amber-300 p-4 dark:border-amber-800">
        <div><h4 className="font-semibold">Unassigned / other-floor offices ({officesOutsideListedFloors.length})</h4><p className="text-xs text-slate-500">Existing offices outside Floors 1–3 remain available here. Choose a floor to reassign an office.</p></div>
        {officesOutsideListedFloors.map((office) => {
          const officeWindows = data.windows.filter((item) => recordId(item.organization) === office._id)
          return <article key={office._id} className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-2"><div><p className="font-medium">{labelFor(office.name, languageCode)}</p><p className="text-xs text-slate-500">{office.isActive === false ? 'Inactive' : 'Active'} · {officeWindows.length} window(s)</p></div><div className="flex gap-2"><button type="button" onClick={() => startOfficeEdit(office)} className="rounded border px-3 py-1.5 text-sm dark:border-slate-700">Assign floor / edit</button><button type="button" onClick={() => confirmDelete('office', office._id, office.name.en)} className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">Delete</button></div></div>
            {officeWindows.map((item) => <div key={item._id} className="flex items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><span>Window {item.number} · Stored floor {item.floor}</span><button type="button" onClick={() => startWindowEdit(item)} className="text-emerald-700 underline">Edit / reassign</button></div>)}
          </article>
        })}
      </section>}
      {unassignedWindows.length > 0 && <section className="space-y-3 rounded-xl border border-amber-300 p-4 dark:border-amber-800">
        <div><h4 className="font-semibold">Windows without an office ({unassignedWindows.length})</h4><p className="text-xs text-slate-500">These existing windows are not hidden. Edit one to assign it to an office with a floor.</p></div>
        {unassignedWindows.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><span>{labelFor(item.name, languageCode) || `Window ${item.number}`} · #{item.number} · Stored floor {item.floor} · {item.isActive === false ? 'Inactive' : 'Active'}</span><div className="flex gap-2"><button type="button" onClick={() => startWindowEdit(item)} className="text-emerald-700 underline">Assign office / edit</button><button type="button" onClick={() => confirmDelete('window', item._id, `Window ${item.number}`)} className="text-red-700 underline">Delete</button></div></div>)}
      </section>}

      {showForm && step === 1 && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setShowForm(false) }}>
        <form onSubmit={formType === 'office' ? saveOffice : saveWindow} role="dialog" aria-modal="true" aria-label={`${formTitle} — ${formType === 'office' ? 'Office' : 'Window'}`} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:p-6">
          <h4 className="font-semibold">{formTitle} — {formType === 'office' ? 'Office' : 'Window'}</h4>
          {formType === 'office' ? <>
            <LocalizedFields label="Office name" value={officeForm.name} onChange={(name) => setOfficeForm({ ...officeForm, name })} />
            <label className="block max-w-md text-sm">Assign floor<select autoFocus required value={officeForm.floorId} onChange={(event) => setOfficeForm({ ...officeForm, floorId: event.target.value })} className={`${inputClass} mt-1`}><option value="">Choose floor</option>{floors.map((floor) => <option key={floor._id} value={floor._id}>Floor {floor.floorNumber} — {labelFor(floor.name, languageCode)}</option>)}</select></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={officeForm.isActive} onChange={(event) => setOfficeForm({ ...officeForm, isActive: event.target.checked })} />Active</label>
          </> : <>
            <label className="block max-w-md text-sm">Assign office<select autoFocus required value={windowForm.organization} onChange={(event) => setWindowForm({ ...windowForm, organization: event.target.value })} className={`${inputClass} mt-1`}><option value="">Choose office</option>{activeOffices.filter((office) => recordId(office.floorId)).map((office) => <option key={office._id} value={office._id}>{labelFor(office.name, languageCode)}</option>)}</select></label>
            <label className="block max-w-md text-sm">Window number<input type="number" min={1} required value={windowForm.number} onChange={(event) => setWindowForm({ ...windowForm, number: event.target.value })} className={`${inputClass} mt-1`} /></label>
            <LocalizedFields label="Window name" value={windowForm.name} onChange={(name) => setWindowForm({ ...windowForm, name })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={windowForm.isActive} onChange={(event) => setWindowForm({ ...windowForm, isActive: event.target.checked })} />Active</label>
          </>}
          <FormButtons busy={busy} onCancel={() => setShowForm(false)} submitLabel={editingId ? 'Save changes' : `Create ${formType}`} />
        </form>
      </div>, document.body)}
      {employeeMode === 'structure'
        ? <p className="border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-700">Office, floor, and window management is complete. Changes are applied immediately.</p>
        : <WizardFooter step={step} setStep={setStep} canAdvance={canAdvance} blockedMessage="" />}
    </section>}

    {step === 2 && <section className={`${panelClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold">Step 3 — Services and requirements</h3><p className="text-sm text-slate-500">Choose a floor-and-window-assigned office, add its services, and add requirements for each service. Default requirements are optional.</p></div>
        <button type="button" onClick={() => openCreate('service')} disabled={!selectableServiceOffices.length || !selectedOffice || busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Add service</button>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Choose an office to view its services</h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {selectableServiceOffices.map((office) => {
            const count = data.services.filter((service) => recordId(service.organization) === office._id).length
            const selected = selectedOfficeId === office._id
            return <button key={office._id} type="button" onClick={() => { setSelectedOfficeId(office._id); setSelectedServiceId(''); setShowForm(false) }} aria-pressed={selected} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-slate-200 hover:border-emerald-500 dark:border-slate-700'}`}>
              <span className="truncate">{labelFor(office.name, languageCode)}</span><span className="shrink-0 text-xs text-slate-500">{count}</span>
            </button>
          })}
          {!employeeMode && data.services.some((service) => !data.offices.some((office) => office._id === recordId(service.organization))) && <button type="button" onClick={() => { setSelectedOfficeId('unassigned'); setSelectedServiceId(''); setShowForm(false) }} aria-pressed={selectedOfficeId === 'unassigned'} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${selectedOfficeId === 'unassigned' ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100' : 'border-slate-200 hover:border-amber-500 dark:border-slate-700'}`}>
            <span>Office not assigned</span><span className="shrink-0 text-xs text-slate-500">{data.services.filter((service) => !data.offices.some((office) => office._id === recordId(service.organization))).length}</span>
          </button>}
        </div>
      </div>
      {employeeMode === 'services' && !selectableServiceOffices.length && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">No offices are ready yet. The Office, Floor and Window Manager must assign an active floor and window to an office first.</p>}
      <input aria-label="Search services" placeholder="Search services..." value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} className={inputClass} />
      {showForm && step === 2 && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setShowForm(false) }}>
        <form onSubmit={saveService} role="dialog" aria-modal="true" aria-label={`${formTitle} — Service`} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between"><h4 className="font-semibold">{formTitle} — Service</h4><button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 underline">Cancel</button></div>
          <LocalizedFields label="Service name" value={serviceForm.name} onChange={(name) => setServiceForm({ ...serviceForm, name })} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">Assign office<select autoFocus required value={serviceForm.organization} onChange={(event) => setServiceForm({ ...serviceForm, organization: event.target.value })} className={`${inputClass} mt-1`}><option value="">Choose office</option>{selectableServiceOffices.map((office) => <option key={office._id} value={office._id}>{labelFor(office.name, languageCode)}</option>)}</select></label>
          </div>
          {editingId && <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Fee<input type="number" min={0} step="0.01" value={serviceForm.fee} onChange={(event) => setServiceForm({ ...serviceForm, fee: Number(event.target.value) })} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm">Processing time<input maxLength={240} value={serviceForm.processingTime} onChange={(event) => setServiceForm({ ...serviceForm, processingTime: event.target.value })} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm">Working hours<input maxLength={240} value={serviceForm.workingHours} onChange={(event) => setServiceForm({ ...serviceForm, workingHours: event.target.value })} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm">Contact phone<input type="tel" maxLength={240} value={serviceForm.contactPhone} onChange={(event) => setServiceForm({ ...serviceForm, contactPhone: event.target.value })} className={`${inputClass} mt-1`} /></label>
          </div>}
          {editingId && <label className="block text-sm">Required documents (one per line)<textarea rows={3} maxLength={5000} value={requiredDocumentsText} onChange={(event) => setRequiredDocumentsText(event.target.value)} className={`${inputClass} mt-1`} /></label>}
          {editingId && <label className="block text-sm">Relevant links (one HTTPS/HTTP URL per line)<textarea rows={3} maxLength={3000} value={resourceLinksText} onChange={(event) => setResourceLinksText(event.target.value)} className={`${inputClass} mt-1`} /></label>}
          {editingId && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={serviceForm.isActive} onChange={(event) => setServiceForm({ ...serviceForm, isActive: event.target.checked })} />Active</label>}
          <FormButtons busy={busy} onCancel={() => setShowForm(false)} submitLabel={editingId ? 'Save service changes' : 'Create service'} />
        </form>
      </div>, document.body)}
      {!selectedOfficeId && <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-800">Select an office above to view and manage its services.</p>}
      {selectedOfficeId && !selectedOfficeServices.length && <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-800">No matching services for {selectedOffice?.name ? labelFor(selectedOffice.name, languageCode) : 'this selection'}.</p>}
      {selectedOfficeServices.map((service) => {
          const requirements = data.requirements.filter((item) => recordId(item.service) === service._id).sort((a, b) => a.sequenceNo - b.sequenceNo)
          return <article key={service._id} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h5 className="font-semibold">{labelFor(service.name, languageCode)}</h5><p className="text-xs text-slate-500">{service.name.en} · {service.name.am} · {service.name.or}</p><p className="text-xs text-slate-500">Fee: {service.fee ?? 0} · {service.processingTime || 'Processing time not set'} · {service.workingHours || 'Working hours not set'} · {service.contactPhone || 'No contact phone'}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${service.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-800'}`}>{service.isActive === false ? 'Inactive' : 'Active'}</span></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => startServiceEdit(service)} className="rounded border px-3 py-1.5 text-sm dark:border-slate-700">Edit / reassign</button><button type="button" onClick={() => void submitChange('service', 'update', service._id, { name: service.name, description: service.description || emptyLocalized(), organization: recordId(service.organization), isActive: service.isActive === false, requiredDocuments: service.requiredDocuments || [], resourceLinks: service.resourceLinks || [], fee: service.fee || 0, processingTime: service.processingTime || '', workingHours: service.workingHours || '', contactPhone: service.contactPhone || '' })} className="rounded border px-3 py-1.5 text-sm dark:border-slate-700">{service.isActive === false ? 'Activate' : 'Deactivate'}</button><button type="button" onClick={() => confirmDelete('service', service._id, service.name.en)} className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">Delete</button><button type="button" onClick={() => setSelectedServiceId(selectedServiceId === service._id ? '' : service._id)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white">{selectedServiceId === service._id ? 'Hide requirements' : `Requirements (${requirements.length})`}</button></div>
          </div>
          {selectedServiceId === service._id && <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="font-semibold">Service requirements</h5><button type="button" onClick={() => { setEditingRequirementId(''); setRequirementForm(emptyRequirementForm()); setShowRequirementForm(true) }} className="rounded border px-3 py-1.5 text-sm dark:border-slate-700">Add requirement</button></div>
            {!requirements.length && <p className="text-sm text-slate-500">No requirements are currently listed for this service.</p>}
            {requirements.map((requirement, index) => <div key={requirement._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div><p className="text-sm font-medium">{labelFor(requirement.requirementText, languageCode)}</p><p className="text-xs text-slate-500">{requirement.isMandatory ? 'Required' : 'Optional'} · {requirement.isActive === false ? 'Inactive' : 'Active'} · Order {requirement.sequenceNo + 1}</p><p className="text-xs text-slate-500">{requirement.requirementText.en}</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" disabled={index === 0} onClick={() => moveRequirement(requirement, -1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">↑</button><button type="button" disabled={index === requirements.length - 1} onClick={() => moveRequirement(requirement, 1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">↓</button><button type="button" onClick={() => startRequirementEdit(requirement)} className="rounded border px-3 py-1 text-sm dark:border-slate-700">Edit</button><button type="button" onClick={() => updateRequirementStatus(requirement)} className="rounded border px-3 py-1 text-sm dark:border-slate-700">{requirement.isActive === false ? 'Activate' : 'Deactivate'}</button><button type="button" onClick={() => confirmDelete('requirement', requirement._id, requirement.requirementText.en)} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button></div>
            </div>)}
            {showRequirementForm && selectedServiceId === service._id && <form onSubmit={saveRequirement} className="space-y-3 rounded-lg border border-emerald-200 p-3 dark:border-emerald-900">
              <h6 className="font-semibold">{editingRequirementId ? 'Edit requirement' : 'Add requirement'}</h6>
              <LocalizedFields label="Requirement" value={requirementForm.requirementText} onChange={(requirementText) => setRequirementForm({ ...requirementForm, requirementText })} />
              <LocalizedFields label="Instructions (optional)" value={requirementForm.notes} onChange={(notes) => setRequirementForm({ ...requirementForm, notes })} multiline />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requirementForm.isMandatory} onChange={(event) => setRequirementForm({ ...requirementForm, isMandatory: event.target.checked })} />Required</label>
              <div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save requirement'}</button><button type="button" onClick={() => { setShowRequirementForm(false); setEditingRequirementId('') }} className="rounded-lg border px-4 py-2 text-sm dark:border-slate-700">Cancel</button></div>
            </form>}
          </div>}
          </article>
      })}
      {selectedService && <p className="text-xs text-slate-500">Selected service: {labelFor(selectedService.name, languageCode)}. Service and requirement changes are saved immediately. Suggested default requirements are added only if you confirm when creating the service.</p>}
      <WizardFooter step={step} setStep={setStep} canAdvance={canAdvance} blockedMessage="" />
    </section>}

    {loading && <p className="text-center text-xs text-slate-500">Refreshing records…</p>}
  </div>
}

function FormButtons({ busy, onCancel, submitLabel }: { busy: boolean; onCancel: () => void; submitLabel: string }) {
  return <div className="flex flex-wrap gap-2">
    <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : submitLabel}</button>
    <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm dark:border-slate-700">Cancel</button>
  </div>
}

function WizardFooter({ step, setStep, canAdvance, blockedMessage }: { step: Step; setStep: (step: Step) => void; canAdvance: boolean; blockedMessage: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
    <button type="button" onClick={() => setStep(Math.max(0, step - 1) as Step)} disabled={step === 0} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Back</button>
    {blockedMessage && <p className="text-sm text-amber-700 dark:text-amber-300">{blockedMessage}</p>}
    {step < 2 ? <button type="button" onClick={() => setStep((step + 1) as Step)} disabled={!canAdvance} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Next<ArrowRight className="h-4 w-4" /></button> : <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><Check className="h-4 w-4" />Setup steps complete</span>}
  </div>
}
