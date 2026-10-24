import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ChevronLeft,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  UserCircle,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { employeeTypes, type EmployeeType } from '@/types/employee'
import { useTheme } from '@/contexts/ThemeContext'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'mesob-registrar-token'
const USER_KEY = 'mesob-registrar-user'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

interface Registrar {
  id: string
  name: string
  email: string
  role: 'registrar'
  officeId: string | null
  officeAssignmentLabel?: string
  maskedNationalId?: string
  schedule?: Array<{ day: string; shift: string; startTime: string; endTime: string }>
}

interface Office {
  _id: string
  name: { en?: string }
}

interface ServiceOption {
  _id: string
  name: { en?: string; am?: string; or?: string }
  description?: { en?: string; am?: string; or?: string }
  organization?: string | { _id: string; name?: { en?: string; am?: string; or?: string } }
  window?: string | { _id: string }
  isActive?: boolean
  fee?: number
  requiredDocuments?: string[]
  processingTime?: string
  workingHours?: string
  contactPhone?: string
  createdAt?: string
}

interface ServiceRequirement {
  _id: string
  service: string
  requirementText: { en: string; am: string; or: string }
  notes: { en: string; am: string; or: string }
  isMandatory: boolean
  sequenceNo: number
  isActive: boolean
}

type LocalizedText = { en: string; am: string; or: string }

const emptyServiceForm = {
  name: { en: '', am: '', or: '' } as LocalizedText,
  description: { en: '', am: '', or: '' } as LocalizedText,
  organization: '',
}

const emptyRequirementForm = {
  requirementText: { en: '', am: '', or: '' } as LocalizedText,
  notes: { en: '', am: '', or: '' } as LocalizedText,
  isMandatory: true,
}

function localizedText(value: LocalizedText | undefined, language: 'en' | 'am' | 'or') {
  return value?.[language] || value?.en || value?.am || value?.or || ''
}

interface Employee {
  _id: string
  name: string
  email: string
  phone?: string
  status: string
  removalRequested?: boolean
  employeeType?: EmployeeType
  createdAt?: string
  profile?: {
    nationalIdLastFour?: string
    jobTitle?: string
  }
}

interface CitizenAccount {
  _id: string
  displayName: string
  email?: string | null
  occupation?: string
  createdAt?: string
  maskedNationalId: string
  registrationReviewedAt?: string
  status: string
  removalRequested?: boolean
}

interface RegistrarMessage {
  _id: string
  type: 'excuse' | 'feedback' | 'compliment' | 'other'
  recipientCategory?: 'admin' | 'it_support'
  subject: string
  message: string
  status: 'new' | 'responded' | 'resolved'
  response: string
  createdAt: string
}

type RecordSort = 'name' | 'newest' | 'oldest'

function sortByRecord<T extends { name?: string; displayName?: string; createdAt?: string }>(records: T[], sort: RecordSort) {
  return [...records].sort((a, b) => {
    if (sort === 'name') {
      return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '', undefined, { sensitivity: 'base' })
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return sort === 'newest' ? timeB - timeA : timeA - timeB
  })
}

function dateLabel(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data as T
}

function officeLabel(office?: Office | string | null) {
  return typeof office === 'string' ? office : office?.name?.en || 'Office not assigned'
}

export default function RegistrarPortal() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const portalCopy = t.registrarPortal
  const employeeTypeLabels: Record<EmployeeType, string> = {
    service_window_officer: portalCopy.service_window_officer,
    security_guard: portalCopy.securityGuard,
    floor_window_manager: portalCopy.floor_window_manager,
    receptionist: portalCopy.receptionist,
    it_support_officer: portalCopy.it_support_officer,
    service_requirement_manager: portalCopy.service_requirement_manager,
  }
  const navLabels = {
    dashboard: language === 'am' ? 'ዳሽቦርድ' : language === 'or' ? 'Daashboordii' : 'Dashboard',
    citizens: language === 'am' ? 'ዜጎች' : language === 'or' ? 'Lammii' : 'Citizens',
    employees: language === 'am' ? 'ሰራተኞች' : language === 'or' ? 'Hojjatota' : 'Employees',
    services: language === 'am' ? 'አገልግሎቶች' : language === 'or' ? 'Tajaajiloota' : 'Services',
    messages: language === 'am' ? 'መልዕክቶች' : language === 'or' ? 'Ergaawwan' : 'Feedback & messages',
    profile: language === 'am' ? 'መገለጫ' : language === 'or' ? 'Ibsaa' : 'Profile',
    theme: language === 'am' ? 'ገጽታ' : language === 'or' ? 'Qormaata' : 'Theme',
    logout: language === 'am' ? 'ውጣ' : language === 'or' ? 'Ba’i' : 'Logout',
  }
  const statusLabel = (status: string) => ({
    pending: portalCopy.pendingStatus,
    approved: portalCopy.approvedStatus,
    active: portalCopy.activeStatus,
    rejected: portalCopy.rejectedStatus,
    suspended: portalCopy.suspendedStatus,
  }[status] || status)
  const [registrar, setRegistrar] = useState<Registrar | null>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null') as Registrar | null
      return stored?.role === 'registrar' ? stored : null
    } catch {
      return null
    }
  })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [citizenRegistrations, setCitizenRegistrations] = useState<CitizenAccount[]>([])
  const [activePanel, setActivePanel] = useState<'dashboard' | 'citizens' | 'employees' | 'services' | 'profile' | 'messages'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [recordSort, setRecordSort] = useState<RecordSort>('name')
  const [profileForm, setProfileForm] = useState({ currentPassword: '', email: '', newPassword: '' })
  const [citizenForm, setCitizenForm] = useState({ name: '', nationalId: '', occupation: '' })
  const [citizenFilter, setCitizenFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [editingCitizen, setEditingCitizen] = useState('')
  const [citizenEditForm, setCitizenEditForm] = useState({ name: '', occupation: '' })
  const [citizenResetForm, setCitizenResetForm] = useState({ citizenId: '', nationalId: '', verified: false })
  const [registrarMessages, setRegistrarMessages] = useState<RegistrarMessage[]>([])
  const [registrarMessageForm, setRegistrarMessageForm] = useState({ type: 'feedback' as RegistrarMessage['type'], recipientCategory: 'admin' as NonNullable<RegistrarMessage['recipientCategory']>, subject: '', message: '' })
  const [offices, setOffices] = useState<Office[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [managedServices, setManagedServices] = useState<ServiceOption[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState('')
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [selectedRequirementService, setSelectedRequirementService] = useState('')
  const [serviceRequirements, setServiceRequirements] = useState<ServiceRequirement[]>([])
  const [requirementEditorId, setRequirementEditorId] = useState('')
  const [requirementFormOpen, setRequirementFormOpen] = useState(false)
  const [requirementForm, setRequirementForm] = useState(emptyRequirementForm)
  const [form, setForm] = useState({ name: '', email: '', phone: '', employeeType: '' as EmployeeType | '', nationalId: '', jobTitle: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const assignedOffice = useMemo(
    () => offices.find((office) => office._id === registrar?.officeId),
    [offices, registrar?.officeId]
  )
  const visibleManagedServices = useMemo(() => {
    const search = serviceSearch.trim().toLocaleLowerCase()
    return managedServices.filter((service) => {
      const active = service.isActive !== false
      if (serviceStatusFilter === 'active' && !active) return false
      if (serviceStatusFilter === 'inactive' && active) return false
      return !search || [service.name.en, service.name.am, service.name.or]
        .some((name) => name?.toLocaleLowerCase().includes(search))
    })
  }, [managedServices, serviceSearch, serviceStatusFilter])
  const visibleCitizenAccounts = useMemo(() => {
    const search = citizenFilter.trim().toLocaleLowerCase()
    const records = citizenRegistrations
    return sortByRecord(records.filter((item) =>
    !search || item.displayName.toLocaleLowerCase().includes(search) || item.occupation?.toLocaleLowerCase().includes(search) || item.maskedNationalId.toLocaleLowerCase().includes(search)
    ), recordSort)
  }, [citizenRegistrations, citizenFilter, recordSort])
  const visibleEmployees = useMemo(() => {
    const search = employeeFilter.trim().toLocaleLowerCase()
    return sortByRecord(employees.filter((employee) =>
      !search || [
        employee.name,
        employee.email,
        employee.phone,
        employee.profile?.jobTitle,
        employee.profile?.nationalIdLastFour,
        employee.status,
        employee.employeeType,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    ), recordSort)
  }, [employees, employeeFilter, recordSort])
  const loadEmployees = useCallback(async () => {
    const result = await request<{ employees: Employee[] }>('/employees')
    setEmployees(result.employees)
  }, [])

  const loadCitizenRegistrations = useCallback(async () => {
    const result = await request<{ registrations: CitizenAccount[] }>('/auth/citizen/registrar/registrations')
    setCitizenRegistrations(result.registrations)
  }, [])

  const loadRegistrarMessages = useCallback(async () => {
    const result = await request<{ messages: RegistrarMessage[] }>('/registrar/messages')
    setRegistrarMessages(result.messages)
  }, [])

  const loadLookups = useCallback(async () => {
    const [officeList, serviceList] = await Promise.all([
      request<Office[]>('/organizations', {}, false),
      request<ServiceOption[]>('/services', {}, false),
    ])
    setOffices(officeList)
    setServices(serviceList)
  }, [])

  const loadManagedServices = useCallback(async () => {
    if (!registrar?.officeId) {
      setManagedServices([])
      return
    }
    const result = await request<ServiceOption[]>('/services/manage')
    setManagedServices(result)
  }, [registrar?.officeId])

  const loadServiceRequirements = useCallback(async (serviceId: string) => {
    const result = await request<ServiceRequirement[]>(`/requirements/manage/by-service/${serviceId}`)
    setServiceRequirements(result)
  }, [])

  const refresh = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      await Promise.all([loadEmployees(), loadLookups(), loadCitizenRegistrations()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load registrar data.')
    } finally {
      setBusy(false)
    }
  }, [loadEmployees, loadLookups, loadCitizenRegistrations])

  useEffect(() => {
    if (!registrar) return
    void refresh()
  }, [registrar, refresh])

  useEffect(() => {
    if (!registrar || activePanel !== 'services') return
    setBusy(true)
    setError('')
    void loadManagedServices()
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load services.'))
      .finally(() => setBusy(false))
  }, [activePanel, loadManagedServices, registrar])

  useEffect(() => {
    if (!registrar || activePanel !== 'messages') return
    void loadRegistrarMessages().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load messages.'))
  }, [activePanel, loadRegistrarMessages, registrar])

  const createEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>('/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setNotice(result.message)
      setForm({ name: '', email: '', phone: '', employeeType: '', nationalId: '', jobTitle: '' })
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register employee.')
    } finally {
      setBusy(false)
    }
  }

  const sendEmployeePasswordReset = async (employee: Employee) => {
    const confirmation = portalCopy.confirmEmployeePasswordReset.replace('{email}', employee.email)
    if (!window.confirm(confirmation)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>(`/employees/${employee._id}/password-reset`, {
        method: 'POST',
      })
      await loadEmployees()
      setNotice(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the employee password.')
    } finally {
      setBusy(false)
    }
  }

  const saveRegistrarProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profileForm.currentPassword) {
      setError('Enter your current password to update your registrar account.')
      return
    }
    if (!profileForm.email.trim() && !profileForm.newPassword) {
      setError('Enter a new email address, a new password, or both.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string; user: Registrar }>('/auth/registrar/profile', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: profileForm.currentPassword,
          ...(profileForm.email.trim() ? { email: profileForm.email.trim() } : {}),
          ...(profileForm.newPassword ? { newPassword: profileForm.newPassword } : {}),
        }),
      })
      setRegistrar(result.user)
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))
      setProfileForm({ currentPassword: '', email: '', newPassword: '' })
      setNotice(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update registrar profile.')
    } finally {
      setBusy(false)
    }
  }

  const submitRegistrarMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>('/registrar/messages', {
        method: 'POST',
        body: JSON.stringify(registrarMessageForm),
      })
      await loadCitizenRegistrations()
      setNotice(result.message)
      setRegistrarMessageForm({ type: 'feedback', recipientCategory: 'admin', subject: '', message: '' })
      await loadRegistrarMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message to administrators.')
    } finally {
      setBusy(false)
    }
  }

  const registerCitizen = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>('/auth/citizen/registrar/register', {
        method: 'POST',
        body: JSON.stringify(citizenForm),
      })
      setNotice(result.message)
      setCitizenForm({ name: '', nationalId: '', occupation: '' })
      await loadCitizenRegistrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register the citizen.')
    } finally {
      setBusy(false)
    }
  }

  const openNewServiceForm = () => {
    setEditingServiceId('')
    setServiceForm({ ...emptyServiceForm, organization: registrar?.officeId || '' })
    setServiceEditorOpen(true)
  }

  const editService = (service: ServiceOption) => {
    const organizationId = typeof service.organization === 'string'
      ? service.organization
      : service.organization?._id || registrar?.officeId || ''
    setEditingServiceId(service._id)
    setServiceForm({
      name: {
        en: service.name.en || '',
        am: service.name.am || '',
        or: service.name.or || '',
      },
      description: {
        en: service.description?.en || '',
        am: service.description?.am || '',
        or: service.description?.or || '',
      },
      organization: organizationId,
    })
    setServiceEditorOpen(true)
    setError('')
  }

  const saveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!['en', 'am', 'or'].every((key) => serviceForm.name[key as keyof LocalizedText].trim())) {
      setError('Enter the service name in English, Amharic, and Afaan Oromo.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const existingService = managedServices.find((service) => service._id === editingServiceId)
      const payload = {
        ...serviceForm,
        window: existingService?.window
          ? typeof existingService.window === 'string' ? existingService.window : existingService.window._id
          : null,
        requiredDocuments: existingService?.requiredDocuments || [],
        fee: existingService?.fee || 0,
        processingTime: existingService?.processingTime || '',
        workingHours: existingService?.workingHours || '',
        contactPhone: existingService?.contactPhone || '',
        isActive: existingService?.isActive !== false,
      }
      const result = await request<ServiceOption>(
        editingServiceId ? `/services/${editingServiceId}` : '/services',
        { method: editingServiceId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      setNotice(editingServiceId ? 'Service updated.' : 'Service created with its default requirements.')
      setServiceEditorOpen(false)
      setEditingServiceId('')
      setServiceForm(emptyServiceForm)
      await loadManagedServices()
      if (!editingServiceId) {
        setSelectedRequirementService(result._id)
        await loadServiceRequirements(result._id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the service.')
    } finally {
      setBusy(false)
    }
  }

  const toggleServiceStatus = async (service: ServiceOption) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const organizationId = typeof service.organization === 'string'
        ? service.organization
        : service.organization?._id
      await request(`/services/${service._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: service.name,
          description: service.description || { en: '', am: '', or: '' },
          organization: organizationId,
          window: service.window
            ? typeof service.window === 'string' ? service.window : service.window._id
            : null,
          requiredDocuments: service.requiredDocuments || [],
          fee: service.fee || 0,
          processingTime: service.processingTime || '',
          workingHours: service.workingHours || '',
          contactPhone: service.contactPhone || '',
          isActive: service.isActive === false,
        }),
      })
      setNotice(service.isActive === false ? 'Service activated.' : 'Service deactivated.')
      await Promise.all([loadManagedServices(), loadLookups()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update service status.')
    } finally {
      setBusy(false)
    }
  }

  const deleteService = async (service: ServiceOption) => {
    const name = localizedText(service.name as LocalizedText, language)
    if (!window.confirm(`Delete "${name}"? Services with appointments or other related records cannot be deleted; deactivate those instead.`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request(`/services/${service._id}`, { method: 'DELETE' })
      if (selectedRequirementService === service._id) {
        setSelectedRequirementService('')
        setServiceRequirements([])
      }
      setNotice('Service deleted.')
      await Promise.all([loadManagedServices(), loadLookups()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the service.')
    } finally {
      setBusy(false)
    }
  }

  const showRequirements = async (serviceId: string) => {
    setError('')
    try {
      if (selectedRequirementService === serviceId) {
        setSelectedRequirementService('')
        setServiceRequirements([])
        setRequirementEditorId('')
        setRequirementFormOpen(false)
        return
      }
      await loadServiceRequirements(serviceId)
      setSelectedRequirementService(serviceId)
      setRequirementEditorId('')
      setRequirementFormOpen(false)
      setRequirementForm(emptyRequirementForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load requirements.')
    }
  }

  const editRequirement = (requirement: ServiceRequirement) => {
    setRequirementEditorId(requirement._id)
    setRequirementFormOpen(true)
    setRequirementForm({
      requirementText: { ...requirement.requirementText },
      notes: { ...requirement.notes },
      isMandatory: requirement.isMandatory,
    })
  }

  const saveRequirement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!['en', 'am', 'or'].every((key) => requirementForm.requirementText[key as keyof LocalizedText].trim())) {
      setError('Enter the requirement in English, Amharic, and Afaan Oromo.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const current = serviceRequirements.find((item) => item._id === requirementEditorId)
      const payload = {
        ...requirementForm,
        service: selectedRequirementService,
        sequenceNo: current?.sequenceNo ?? serviceRequirements.length,
        isActive: current?.isActive !== false,
      }
      await request(
        requirementEditorId ? `/requirements/${requirementEditorId}` : '/requirements',
        { method: requirementEditorId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      setNotice(requirementEditorId ? 'Requirement updated.' : 'Requirement added.')
      setRequirementEditorId('')
      setRequirementFormOpen(false)
      setRequirementForm(emptyRequirementForm)
      await loadServiceRequirements(selectedRequirementService)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the requirement.')
    } finally {
      setBusy(false)
    }
  }

  const toggleRequirementStatus = async (requirement: ServiceRequirement) => {
    setBusy(true)
    setError('')
    try {
      await request(`/requirements/${requirement._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...requirement,
          isActive: !requirement.isActive,
        }),
      })
      await loadServiceRequirements(selectedRequirementService)
      setNotice(requirement.isActive ? 'Requirement deactivated.' : 'Requirement activated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update requirement status.')
    } finally {
      setBusy(false)
    }
  }

  const deleteRequirement = async (requirement: ServiceRequirement) => {
    if (!window.confirm(`Delete this requirement (${localizedText(requirement.requirementText, language)})?`)) return
    setBusy(true)
    setError('')
    try {
      await request(`/requirements/${requirement._id}`, { method: 'DELETE' })
      await loadServiceRequirements(selectedRequirementService)
      setNotice('Requirement deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the requirement.')
    } finally {
      setBusy(false)
    }
  }

  const moveRequirement = async (requirement: ServiceRequirement, offset: -1 | 1) => {
    const currentIndex = serviceRequirements.findIndex((item) => item._id === requirement._id)
    const target = serviceRequirements[currentIndex + offset]
    if (!target || currentIndex < 0) return
    setBusy(true)
    setError('')
    try {
      await Promise.all([
        request(`/requirements/${requirement._id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...requirement, sequenceNo: target.sequenceNo }),
        }),
        request(`/requirements/${target._id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...target, sequenceNo: requirement.sequenceNo }),
        }),
      ])
      await loadServiceRequirements(selectedRequirementService)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reorder requirements.')
    } finally {
      setBusy(false)
    }
  }

  const requestAccountRemoval = async (targetType: 'citizen' | 'employee', targetId: string, displayName: string) => {
    if (!window.confirm(portalCopy.confirmRemoval.replace('{name}', displayName))) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const path = targetType === 'citizen'
        ? `/auth/citizen/registrar/registrations/${targetId}/removal-request`
        : `/employees/${targetId}/removal-request`
      const result = await request<{ message: string }>(path, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Requested by registrar for administrator review.' }),
      })
      setNotice(result.message)
      if (targetType === 'citizen') await loadCitizenRegistrations()
      else await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request account removal.')
    } finally {
      setBusy(false)
    }
  }

  const setCitizenStatus = async (citizen: CitizenAccount, status: 'active' | 'suspended') => {
    setBusy(true)
    setError('')
    try {
      const result = await request<{ message: string }>(`/auth/citizen/registrar/registrations/${citizen._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice(result.message)
      await loadCitizenRegistrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the citizen account status.')
    } finally {
      setBusy(false)
    }
  }

  const saveCitizenEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>(`/auth/citizen/registrar/registrations/${editingCitizen}`, {
        method: 'PUT',
        body: JSON.stringify(citizenEditForm),
      })
      setNotice(result.message)
      setEditingCitizen('')
      await loadCitizenRegistrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update citizen information.')
    } finally {
      setBusy(false)
    }
  }

  const resetCitizenPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!citizenResetForm.citizenId || !/^\d{12}$/.test(citizenResetForm.nationalId) || !citizenResetForm.verified) {
      setError('Verify the citizen National ID in person before resetting the password.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ message: string }>(`/auth/citizen/registrar/registrations/${citizenResetForm.citizenId}/password-reset`, {
        method: 'POST',
        body: JSON.stringify({
          nationalId: citizenResetForm.nationalId,
          nationalIdVerified: citizenResetForm.verified,
        }),
      })
      await loadCitizenRegistrations()
      setNotice(result.message)
      setCitizenResetForm({ citizenId: '', nationalId: '', verified: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the citizen password.')
    } finally {
      setBusy(false)
    }
  }

  const sidebarItems = [
    { key: 'dashboard' as const, label: navLabels.dashboard, icon: LayoutDashboard },
    { key: 'employees' as const, label: navLabels.employees, count: employees.length, icon: Users },
    { key: 'citizens' as const, label: navLabels.citizens, count: citizenRegistrations.length, icon: UserCircle },
    { key: 'services' as const, label: navLabels.services, count: services.length, icon: Wrench },
    { key: 'messages' as const, label: navLabels.messages, count: registrarMessages.filter((item) => item.status === 'responded').length, icon: MessageSquare },
    { key: 'profile' as const, label: navLabels.profile, icon: UserCircle },
  ]
  const renderSidebarLinks = (mobile = false) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Registrar work areas">
      {sidebarItems.map(({ key, label, count, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            setActivePanel(key)
            if (mobile) setMobileSidebarOpen(false)
          }}
          aria-current={activePanel === key ? 'page' : undefined}
          title={!sidebarOpen && !mobile ? label : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            activePanel === key
              ? 'bg-emerald-700/10 text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-300'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {(sidebarOpen || mobile) && <span className="flex-1 whitespace-nowrap">{label}</span>}
          {(sidebarOpen || mobile) && count !== undefined && <span className="text-xs opacity-70">{count}</span>}
        </button>
      ))}
    </nav>
  )

  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setRegistrar(null)
    setEmployees([])
  }

  if (!registrar) {
    return <Navigate to="/employe" replace />
  }

  return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white shadow-sm transition-[width] dark:border-slate-800 dark:bg-slate-900 lg:flex ${sidebarOpen ? 'w-60' : 'w-16'}`}>
      <div className={`flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        {sidebarOpen && <div className="flex min-w-0 items-center gap-2"><Shield className="h-5 w-5 shrink-0 text-emerald-700" /><span className="truncate text-sm font-bold text-slate-900 dark:text-white">Registrar Panel</span></div>}
        <button type="button" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
      {renderSidebarLinks()}
      <div className="space-y-1 border-t border-slate-200 p-2 dark:border-slate-800">
        <button type="button" onClick={toggleTheme} title={!sidebarOpen ? navLabels.theme : undefined} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
          {sidebarOpen && <span>{navLabels.theme}</span>}
        </button>
        <button type="button" onClick={signOut} title={!sidebarOpen ? navLabels.logout : undefined} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span>{navLabels.logout}</span>}
        </button>
      </div>
    </aside>

    {mobileSidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
      <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-700" /><span className="text-sm font-bold text-slate-900 dark:text-white">Registrar Panel</span></div>
          <button type="button" aria-label="Close navigation" onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        {renderSidebarLinks(true)}
        <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
          <button type="button" onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}{navLabels.theme}
          </button>
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"><LogOut className="h-5 w-5" />{navLabels.logout}</button>
        </div>
      </aside>
    </div>}

    <div className={`min-h-screen w-full transition-[margin] ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'}`}>
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu className="h-5 w-5" /></button>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Registrar Panel</span>
        </div>
        <button type="button" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">MESOB Sululta</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{portalCopy.workspace}</h1><p className="mt-1 text-sm text-slate-500">{registrar.name} · {registrar.officeId ? officeLabel(assignedOffice || registrar.officeId) : registrar.officeAssignmentLabel || portalCopy.allOffices}</p>{registrar.maskedNationalId && <p className="mt-1 text-xs text-slate-500">National ID: {registrar.maskedNationalId}</p>}</div>
        <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="registrar-language">{portalCopy.language}</label><select id="registrar-language" className={`${inputClass} w-auto`} value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'am' | 'or')}><option value="en">English</option><option value="am">አማርኛ</option><option value="or">Afaan Oromo</option></select><button onClick={() => void refresh()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm dark:border-slate-700"><RefreshCw className="h-4 w-4" />{portalCopy.refresh}</button></div>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</p>}

      {activePanel === 'dashboard' ? <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className={`${panelClass} space-y-2`}>
            <p className="text-sm text-slate-500">{navLabels.citizens}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{citizenRegistrations.length}</p>
            <p className="text-xs text-emerald-700">{citizenRegistrations.filter((item) => item.status === 'active').length} active</p>
          </div>
          <div className={`${panelClass} space-y-2`}>
            <p className="text-sm text-slate-500">{navLabels.employees}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</p>
            <p className="text-xs text-emerald-700">{employees.filter((item) => item.status === 'active').length} active</p>
          </div>
          <div className={`${panelClass} space-y-2`}>
            <p className="text-sm text-slate-500">{navLabels.services}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{services.length}</p>
            <p className="text-xs text-emerald-700">{services.length ? 'Available' : 'No services yet'}</p>
          </div>
          <div className={`${panelClass} space-y-2`}>
            <p className="text-sm text-slate-500">Office</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{assignedOffice ? assignedOffice.name?.en || 'Office' : 'General'}</p>
            <p className="text-xs text-emerald-700">{registrar.officeId ? 'Assigned' : 'Unassigned'}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${panelClass} space-y-4`}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Quick actions</h2><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Ready</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setActivePanel('citizens')} className="rounded-xl bg-emerald-700 px-4 py-3 text-left text-sm font-semibold text-white">Register citizen</button>
              <button type="button" onClick={() => setActivePanel('employees')} className="rounded-xl border px-4 py-3 text-left text-sm font-semibold dark:border-slate-700">Register employee</button>
              <button type="button" onClick={() => setActivePanel('services')} className="rounded-xl border px-4 py-3 text-left text-sm font-semibold dark:border-slate-700">Browse services</button>
              <button type="button" onClick={() => setActivePanel('profile')} className="rounded-xl border px-4 py-3 text-left text-sm font-semibold dark:border-slate-700">Manage profile</button>
            </div>
          </section>

          <section className={`${panelClass} space-y-4`}>
            <h2 className="text-lg font-semibold">Registrar overview</h2>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"><span>Pending review</span><strong>{employees.filter((item) => item.status === 'pending').length + citizenRegistrations.filter((item) => item.status === 'pending').length}</strong></li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"><span>Approved</span><strong>{employees.filter((item) => item.status === 'approved').length + employees.filter((item) => item.status === 'active').length}</strong></li>
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"><span>Account requests</span><strong>{citizenRegistrations.filter((item) => item.removalRequested).length}</strong></li>
            </ul>
          </section>
        </div>
        <section className={`${panelClass} space-y-3`}>
          <h2 className="text-lg font-semibold">Weekly work schedule</h2>
          {!registrar.schedule?.length ? <p className="text-sm text-slate-500">No work schedule has been assigned. Contact an administrator.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {registrar.schedule.map((shift, index) => <div key={`${shift.day}-${shift.startTime}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="font-semibold capitalize">{shift.day} · {shift.shift}</p><p className="mt-1 text-slate-500">{shift.startTime}–{shift.endTime}</p>
            </div>)}
          </div>}
        </section>
      </section> : activePanel === 'messages' ? <section className={`${panelClass} space-y-5`}>
        <div><h2 className="text-lg font-semibold">{navLabels.messages}</h2><p className="text-sm text-slate-500">Messages are delivered to the selected Admin or IT Support team.</p></div>
        <form onSubmit={submitRegistrarMessage} className="grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 sm:grid-cols-2">
          <label className="block text-sm">Message type<select className={`${inputClass} mt-1`} value={registrarMessageForm.type} onChange={(event) => setRegistrarMessageForm((current) => ({ ...current, type: event.target.value as RegistrarMessage['type'] }))}><option value="feedback">Feedback</option><option value="excuse">Excuse / leave notice</option><option value="compliment">Compliment</option><option value="other">Other</option></select></label>
          <label className="block text-sm">Message category<select className={`${inputClass} mt-1`} value={registrarMessageForm.recipientCategory} onChange={(event) => setRegistrarMessageForm((current) => ({ ...current, recipientCategory: event.target.value as NonNullable<RegistrarMessage['recipientCategory']> }))}><option value="admin">Admin</option><option value="it_support">IT Support</option></select></label>
          <label className="block text-sm">Subject<input className={`${inputClass} mt-1`} required minLength={3} maxLength={160} value={registrarMessageForm.subject} onChange={(event) => setRegistrarMessageForm((current) => ({ ...current, subject: event.target.value }))} /></label>
          <label className="block text-sm sm:col-span-2">Message<textarea className={`${inputClass} mt-1`} rows={4} required minLength={10} maxLength={2000} value={registrarMessageForm.message} onChange={(event) => setRegistrarMessageForm((current) => ({ ...current, message: event.target.value }))} /></label>
          <div className="sm:col-span-2"><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : registrarMessageForm.recipientCategory === 'it_support' ? 'Send to IT Support' : 'Send to administrators'}</button></div>
        </form>
        <div className="space-y-3"><h3 className="font-semibold">Message history</h3>
          {!registrarMessages.length ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No messages have been sent yet.</p> : registrarMessages.map((item) => <article key={item._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize dark:bg-slate-800">{item.type}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs dark:bg-emerald-950/30">{item.recipientCategory === 'it_support' ? 'IT Support' : 'Admin'}</span><h4 className="font-semibold">{item.subject}</h4></div><span className="text-xs capitalize text-slate-500">{item.status}</span></div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.message}</p><time className="mt-2 block text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</time>
            {!!item.response && <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">{item.recipientCategory === 'it_support' ? 'IT Support reply' : 'Administrator reply'}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.response}</p></div>}
          </article>)}
        </div>
      </section> : activePanel === 'services' ? <><section className={`${panelClass} space-y-3`}>
        <h2 className="text-lg font-semibold">Service and office setup</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Office, floor, and window records are managed by the Office, Floor and Window Manager. Services and requirements are managed by the Service and Requirement Manager.</p>
      </section>{false && <section className="space-y-5">
        <section className={`${panelClass} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Services and requirements</h2>
              <p className="text-sm text-slate-500">Manage the services for your assigned office and their default requirements.</p>
            </div>
            <button type="button" onClick={openNewServiceForm} disabled={!registrar?.officeId || busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add service</button>
          </div>
          {!registrar?.officeId && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Your registrar account needs an assigned office before you can manage services.</p>}
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <input aria-label="Search services" placeholder="Search service names in all languages..." value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} className={inputClass} />
            <select aria-label="Filter services by status" className={inputClass} value={serviceStatusFilter} onChange={(event) => setServiceStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}>
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </section>

        {serviceEditorOpen && <form onSubmit={saveService} className={`${panelClass} space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{editingServiceId ? 'Edit service' : 'Add a service'}</h3>
            <button type="button" onClick={() => setServiceEditorOpen(false)} className="rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700">Cancel</button>
          </div>
          <p className="text-sm text-slate-500">Office: {officeLabel(assignedOffice || registrar?.officeId)}. Names are required in all three languages.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(['en', 'am', 'or'] as const).map((lang) => <label key={lang} className="block text-sm">
              Service name ({lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Afaan Oromo'})
              <input required maxLength={160} value={serviceForm.name[lang]} onChange={(event) => setServiceForm({ ...serviceForm, name: { ...serviceForm.name, [lang]: event.target.value } })} className={`${inputClass} mt-1`} />
            </label>)}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(['en', 'am', 'or'] as const).map((lang) => <label key={lang} className="block text-sm">
              Description ({lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Afaan Oromo'})
              <textarea rows={3} maxLength={1000} value={serviceForm.description[lang]} onChange={(event) => setServiceForm({ ...serviceForm, description: { ...serviceForm.description, [lang]: event.target.value } })} className={`${inputClass} mt-1`} />
            </label>)}
          </div>
          <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : editingServiceId ? 'Save service' : 'Create service'}</button>
        </form>}

        {!visibleManagedServices.length && <p className={`${panelClass} py-8 text-center text-sm text-slate-500`}>{busy ? 'Loading services…' : 'No services match your search or status filter.'}</p>}
        {visibleManagedServices.map((service) => {
          const organization = service.organization && typeof service.organization !== 'string'
            ? service.organization.name?.[language] || service.organization.name?.en
            : assignedOffice?.name?.en
          const isExpanded = selectedRequirementService === service._id
          return <article key={service._id} className={`${panelClass} space-y-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{localizedText(service.name as LocalizedText, language) || 'Unnamed service'}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${service.isActive === false ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>{service.isActive === false ? 'Inactive' : 'Active'}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{organization || 'Office'} · {service.name.en || ''}</p>
                {service.description?.[language] && <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{service.description[language]}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => editService(service)} disabled={busy} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">Edit</button>
                <button type="button" onClick={() => void toggleServiceStatus(service)} disabled={busy} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">{service.isActive === false ? 'Activate' : 'Deactivate'}</button>
                <button type="button" onClick={() => void showRequirements(service._id)} disabled={busy} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">{isExpanded ? 'Hide requirements' : 'Manage requirements'}</button>
                <button type="button" onClick={() => void deleteService(service)} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50">Delete</button>
              </div>
            </div>

            {isExpanded && <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h4 className="font-semibold">Default requirements ({serviceRequirements.length})</h4><p className="text-xs text-slate-500">Requirements are attached to this service, not copied to windows.</p></div>
                <button type="button" onClick={() => { setRequirementEditorId(''); setRequirementForm(emptyRequirementForm); setRequirementFormOpen(true) }} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">Add requirement</button>
              </div>
              {!serviceRequirements.length && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800">No requirements have been added.</p>}
              {serviceRequirements.map((requirement, index) => <div key={requirement._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="font-medium">{localizedText(requirement.requirementText, language)} <span className="ml-1 text-xs text-slate-500">{requirement.isMandatory ? 'Required' : 'Optional'} · {requirement.isActive === false ? 'Inactive' : 'Active'}</span></p>
                  <p className="text-xs text-slate-500">{requirement.requirementText.en}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-label="Move requirement up" disabled={busy || index === 0} onClick={() => void moveRequirement(requirement, -1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">↑</button>
                  <button type="button" aria-label="Move requirement down" disabled={busy || index === serviceRequirements.length - 1} onClick={() => void moveRequirement(requirement, 1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => editRequirement(requirement)} className="rounded border px-3 py-1 text-sm dark:border-slate-700">Edit</button>
                  <button type="button" onClick={() => void toggleRequirementStatus(requirement)} disabled={busy} className="rounded border px-3 py-1 text-sm dark:border-slate-700">{requirement.isActive === false ? 'Activate' : 'Deactivate'}</button>
                  <button type="button" onClick={() => void deleteRequirement(requirement)} disabled={busy} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
                </div>
              </div>)}

              {requirementFormOpen && <form onSubmit={saveRequirement} className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <h5 className="text-sm font-semibold">{requirementEditorId ? 'Edit requirement' : 'New requirement'}</h5>
                <div className="grid gap-3 md:grid-cols-3">
                  {(['en', 'am', 'or'] as const).map((lang) => <label key={lang} className="block text-sm">
                    Requirement ({lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Afaan Oromo'})
                    <input required maxLength={240} value={requirementForm.requirementText[lang]} onChange={(event) => setRequirementForm({ ...requirementForm, requirementText: { ...requirementForm.requirementText, [lang]: event.target.value } })} className={`${inputClass} mt-1`} />
                  </label>)}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {(['en', 'am', 'or'] as const).map((lang) => <label key={lang} className="block text-sm">
                    Instructions ({lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Afaan Oromo'})
                    <textarea rows={2} maxLength={1000} value={requirementForm.notes[lang]} onChange={(event) => setRequirementForm({ ...requirementForm, notes: { ...requirementForm.notes, [lang]: event.target.value } })} className={`${inputClass} mt-1`} />
                  </label>)}
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requirementForm.isMandatory} onChange={(event) => setRequirementForm({ ...requirementForm, isMandatory: event.target.checked })} />Required for this service</label>
                <div className="flex gap-2">
                  <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{requirementEditorId ? 'Save requirement' : 'Add requirement'}</button>
                  <button type="button" onClick={() => { setRequirementEditorId(''); setRequirementFormOpen(false); setRequirementForm(emptyRequirementForm) }} className="rounded-lg border px-4 py-2 text-sm dark:border-slate-700">Cancel</button>
                </div>
              </form>}
            </div>}
          </article>
        })}
      </section>}</> : activePanel === 'profile' ? <section className={`${panelClass} max-w-2xl space-y-4`}>
        <div><h2 className="text-lg font-semibold">{portalCopy.registrarProfile}</h2><p className="text-sm text-slate-500">{portalCopy.profileHint}</p></div>
        <form onSubmit={saveRegistrarProfile} className="space-y-4">
          <p className="text-sm">{portalCopy.currentEmail}: <span className="font-medium">{registrar.email}</span></p>
          <label className="block text-sm">{portalCopy.newEmail} <span className="text-slate-500">({portalCopy.keepCurrent})</span><input className={`${inputClass} mt-1`} type="email" autoComplete="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label>
          <label className="block text-sm">{portalCopy.newPassword} <span className="text-slate-500">({portalCopy.newPasswordHint})</span><input className={`${inputClass} mt-1`} type="password" minLength={8} maxLength={128} autoComplete="new-password" value={profileForm.newPassword} onChange={(event) => setProfileForm({ ...profileForm, newPassword: event.target.value })} /></label>
          <label className="block text-sm">{portalCopy.currentPassword}<input className={`${inputClass} mt-1`} type="password" required autoComplete="current-password" value={profileForm.currentPassword} onChange={(event) => setProfileForm({ ...profileForm, currentPassword: event.target.value })} /></label>
          <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{portalCopy.saveChanges}</button>
        </form>
      </section> : activePanel === 'citizens' ? <div className="space-y-5">
      <form onSubmit={registerCitizen} className={`${panelClass} space-y-3`}>
        <h2 className="text-lg font-semibold">{portalCopy.registerCitizen}</h2>
        <p className="text-sm text-slate-500">{portalCopy.registerCitizenHint}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">{portalCopy.fullName}<input required minLength={2} maxLength={120} value={citizenForm.name} onChange={(event) => setCitizenForm({ ...citizenForm, name: event.target.value })} className={`${inputClass} mt-1`} /></label>
          <label className="block text-sm">{portalCopy.nationalId}<input required minLength={12} maxLength={12} pattern="[0-9]{12}" inputMode="numeric" autoComplete="off" value={citizenForm.nationalId} onChange={(event) => setCitizenForm({ ...citizenForm, nationalId: event.target.value.replace(/\D/g, '').slice(0, 12) })} className={`${inputClass} mt-1`} /></label>
          <label className="block text-sm">{portalCopy.occupation}<input required minLength={2} maxLength={120} placeholder={portalCopy.occupationHint} value={citizenForm.occupation} onChange={(event) => setCitizenForm({ ...citizenForm, occupation: event.target.value })} className={`${inputClass} mt-1`} /></label>
        </div>
        <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{portalCopy.registerCitizen}</button>
      </form>
      <section className={`${panelClass} space-y-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold">{portalCopy.citizenAccounts} ({visibleCitizenAccounts.length})</h2><p className="text-sm text-slate-500">{portalCopy.citizenListHint}</p></div>
          <div className="flex flex-wrap gap-2">
            <input aria-label={portalCopy.searchCitizen} placeholder={portalCopy.searchCitizen} value={citizenFilter} onChange={(event) => setCitizenFilter(event.target.value)} className={`${inputClass} min-w-52`} />
            <select aria-label={portalCopy.citizenAccounts} className={inputClass} value={recordSort} onChange={(event) => setRecordSort(event.target.value as RecordSort)}><option value="name">{portalCopy.nameAZ}</option><option value="newest">{portalCopy.newest}</option><option value="oldest">{portalCopy.oldest}</option></select>
          </div>
        </div>
        {!visibleCitizenAccounts.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{portalCopy.noCitizens}</p>}
        {visibleCitizenAccounts.map((citizen) => <article key={citizen._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          {editingCitizen === citizen._id ? <form onSubmit={saveCitizenEdit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input required minLength={2} maxLength={120} aria-label="Citizen full name" value={citizenEditForm.name} onChange={(event) => setCitizenEditForm({ ...citizenEditForm, name: event.target.value })} className={inputClass} />
            <input required minLength={2} maxLength={120} aria-label="Citizen occupation or status" value={citizenEditForm.occupation} onChange={(event) => setCitizenEditForm({ ...citizenEditForm, occupation: event.target.value })} className={inputClass} />
            <button disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white">{portalCopy.save}</button>
            <button type="button" onClick={() => setEditingCitizen('')} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">{portalCopy.cancel}</button>
          </form> : <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{citizen.displayName} <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{statusLabel(citizen.status)}</span></p><p className="font-mono text-sm">{citizen.maskedNationalId} · {citizen.occupation || portalCopy.occupationNotRecorded}</p><p className="text-xs text-slate-500">{portalCopy.registered} {dateLabel(citizen.createdAt)}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingCitizen(citizen._id); setCitizenEditForm({ name: citizen.displayName, occupation: citizen.occupation || '' }) }} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">{portalCopy.edit}</button>{citizen.status === 'active' ? <button type="button" onClick={() => void setCitizenStatus(citizen, 'suspended')} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700">{portalCopy.suspend}</button> : citizen.status === 'suspended' && <button type="button" onClick={() => void setCitizenStatus(citizen, 'active')} disabled={busy} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">{portalCopy.activate}</button>}{citizen.removalRequested ? <span className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{portalCopy.removalPending}</span> : <button type="button" onClick={() => void requestAccountRemoval('citizen', citizen._id, citizen.displayName)} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700">{portalCopy.requestRemoval}</button>}</div>
          </div>}
        </article>)}
      </section>
      <form onSubmit={resetCitizenPassword} className={`${panelClass} space-y-3`}>
        <h2 className="text-lg font-semibold">{portalCopy.resetPassword}</h2>
        <p className="text-sm text-slate-500">{portalCopy.resetPasswordHint}</p>
        <select required value={citizenResetForm.citizenId} onChange={(event) => setCitizenResetForm({ ...citizenResetForm, citizenId: event.target.value })} className={inputClass}><option value="">{portalCopy.selectCitizen}</option>{visibleCitizenAccounts.filter((citizen) => citizen.status === 'active').map((citizen) => <option key={citizen._id} value={citizen._id}>{citizen.displayName} · {citizen.maskedNationalId}</option>)}</select>
        <input required minLength={12} maxLength={12} pattern="[0-9]{12}" inputMode="numeric" autoComplete="off" placeholder={portalCopy.verifiedNationalId} value={citizenResetForm.nationalId} onChange={(event) => setCitizenResetForm({ ...citizenResetForm, nationalId: event.target.value.replace(/\D/g, '').slice(0, 12) })} className={inputClass} />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={citizenResetForm.verified} onChange={(event) => setCitizenResetForm({ ...citizenResetForm, verified: event.target.checked })} />{portalCopy.verifyId}</label>
        <button disabled={busy || !citizenResetForm.verified} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-50">{portalCopy.resetCitizenPassword}</button>
      </form>
      </div> : <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={createEmployee} className={`${panelClass} space-y-3`}>
          <h2 className="flex items-center gap-2 font-semibold"><Users className="h-5 w-5" />{portalCopy.registerEmployee}</h2>
          <p className="text-sm text-slate-500">{portalCopy.employeeRegistrationHint}</p>
          {!registrar?.officeId && registrar?.officeAssignmentLabel && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{portalCopy.manualOfficeEmployeeHint}</p>}
          <input required minLength={2} maxLength={120} aria-label={portalCopy.employeeFullName} placeholder={portalCopy.employeeFullName} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} />
          <input required type="email" maxLength={254} aria-label={portalCopy.workEmail} placeholder={portalCopy.workEmail} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
          <input required minLength={12} maxLength={12} pattern="[0-9]{12}" inputMode="numeric" autoComplete="off" aria-label={portalCopy.employeeNationalId} placeholder={portalCopy.employeeNationalId} value={form.nationalId} onChange={(event) => setForm({ ...form, nationalId: event.target.value.replace(/\D/g, '').slice(0, 12) })} className={inputClass} />
          <input required minLength={2} maxLength={120} aria-label={portalCopy.jobTitle} placeholder={portalCopy.jobTitle} value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} className={inputClass} />
          <input required type="tel" inputMode="numeric" autoComplete="tel-national" minLength={10} maxLength={10} pattern="09[0-9]{8}" aria-label={portalCopy.phone} placeholder="0922734614" title="Enter a unique 10-digit phone number starting with 09." value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} className={inputClass} />
          <select required value={form.employeeType} onChange={(event) => setForm({ ...form, employeeType: event.target.value as EmployeeType | '' })} className={inputClass}>
            <option value="">Select employee category</option>
            {employeeTypes.map((type) => <option key={type} value={type}>{employeeTypeLabels[type]}</option>)}
          </select>
          <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{portalCopy.registerForApproval}</button>
        </form>

      </div>

      <section className={`${panelClass} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold">{portalCopy.employeeRecords} ({visibleEmployees.length}{employeeFilter.trim() ? ` / ${employees.length}` : ''})</h2><p className="text-sm text-slate-500">{portalCopy.employeeRecordsHint}</p></div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm"><span className="sr-only">{portalCopy.searchEmployee}</span>
              <input aria-label={portalCopy.searchEmployee} placeholder={portalCopy.searchEmployee} value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className={`${inputClass} min-w-52`} />
            </label>
            <label className="text-sm">{portalCopy.sortBy}
              <select aria-label={portalCopy.sortBy} className={`${inputClass} mt-1 min-w-40`} value={recordSort} onChange={(event) => setRecordSort(event.target.value as RecordSort)}>
                <option value="name">{portalCopy.nameAZ}</option><option value="newest">{portalCopy.registrationNewest}</option><option value="oldest">{portalCopy.registrationOldest}</option>
              </select>
            </label>
          </div>
        </div>
        {!employees.length && <p className="py-6 text-center text-sm text-slate-500">{portalCopy.noEmployees}</p>}
        {!!employees.length && !visibleEmployees.length && <p className="py-6 text-center text-sm text-slate-500">{portalCopy.noEmployeeMatches}</p>}
        {!!visibleEmployees.length && <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500"><tr>
              <th className="px-3 py-3">{portalCopy.employeeFullName}</th>
              <th className="px-3 py-3">{portalCopy.workEmail} / {portalCopy.phone}</th>
              <th className="px-3 py-3">{portalCopy.jobTitle}</th>
              <th className="px-3 py-3">{portalCopy.employeeNationalId}</th>
              <th className="px-3 py-3">{language === 'am' ? 'ሁኔታ' : language === 'or' ? 'Haala' : 'Status'}</th>
              <th className="px-3 py-3">{portalCopy.registered}</th>
              <th className="px-3 py-3">{portalCopy.passwordReset}</th>
              <th className="px-3 py-3">{portalCopy.requestRemoval}</th>
            </tr></thead>
            <tbody>{visibleEmployees.map((employee) => <tr key={employee._id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-3 py-3"><span className="font-medium">{employee.name}</span><span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{employee.employeeType ? employeeTypeLabels[employee.employeeType] : portalCopy.service_window_officer}</span></td>
              <td className="px-3 py-3"><span className="block">{employee.email}</span><span className="text-xs text-slate-500">{employee.phone || portalCopy.noPhone}</span></td>
              <td className="px-3 py-3">{employee.profile?.jobTitle || portalCopy.notAssigned}</td>
              <td className="px-3 py-3 font-mono">********{employee.profile?.nationalIdLastFour || '****'}</td>
              <td className="px-3 py-3">{statusLabel(employee.status)}</td>
              <td className="px-3 py-3">{dateLabel(employee.createdAt)}</td>
              <td className="px-3 py-3">{['approved', 'active'].includes(employee.status)
                ? <button type="button" onClick={() => void sendEmployeePasswordReset(employee)} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><KeyRound size={15} />{portalCopy.sendPasswordReset}</button>
                : <span className="text-xs text-slate-500">{portalCopy.passwordResetAfterActivation}</span>}</td>
              <td className="px-3 py-3">{employee.removalRequested
                ? <span className="text-xs text-red-700">{portalCopy.removalPending}</span>
                : <button type="button" onClick={() => void requestAccountRemoval('employee', employee._id, employee.name)} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50">{portalCopy.requestRemoval}</button>}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
      </div>}
    </div>
    </div>
  </main>
}
