import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Building2, Layers, DoorOpen, List, FileText, ArrowRight, ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { getOrganizations, getServicesAdmin, createService, updateService, deleteService, createWindow, updateWindow, deleteWindow, getRequirementsByService, createRequirement, updateRequirement, deleteRequirement, assignServicesToWindow, getAvailableServicesForWindow, type OrganizationSummary, type ServiceAdmin, type RequirementAdmin } from '@/api/admin'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const langs = ['en', 'am', 'or'] as const
const floors = [1, 2, 3, 4, 5]

const floorLabels = {
  en: ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'],
  am: ['ወለል 1', 'ወለል 2', 'ወለል 3', 'ወለል 4', 'ወለል 5'],
  or: ['Bona 1', 'Bona 2', 'Bona 3', 'Bona 4', 'Bona 5'],
}

const emptyServiceForm = {
  name: { en: '', am: '', or: '' },
  description: { en: '', am: '', or: '' },
  organization: '',
  window: '',
  requiredDocuments: [] as string[],
  fee: 0,
  processingTime: '',
  workingHours: '',
  contactPhone: '',
}

const emptyWindowForm = {
  number: '',
  floor: 1,
  organization: '',
  description: { en: '', am: '', or: '' },
}

const emptyRequirementForm = {
  requirementText: { en: '', am: '', or: '' },
  notes: { en: '', am: '', or: '' },
  isMandatory: true,
  sequenceNo: 0,
}

export default function AdminServices() {
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [windows, setWindows] = useState<any[]>([])
  const [services, setServices] = useState<ServiceAdmin[]>([])
  const [requirements, setRequirements] = useState<RequirementAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedWindow, setSelectedWindow] = useState('')
  const [selectedService, setSelectedService] = useState('')

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceAdmin | null>(null)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [savingService, setSavingService] = useState(false)

  // Window form
  const [showWindowForm, setShowWindowForm] = useState(false)
  const [editingWindow, setEditingWindow] = useState<any | null>(null)
  const [windowForm, setWindowForm] = useState(emptyWindowForm)
  const [savingWindow, setSavingWindow] = useState(false)

  // Requirement form
  const [showReqForm, setShowReqForm] = useState(false)
  const [editingReq, setEditingReq] = useState<RequirementAdmin | null>(null)
  const [reqForm, setReqForm] = useState(emptyRequirementForm)
  const [savingReq, setSavingReq] = useState(false)

  // Assign Services modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningWindow, setAssigningWindow] = useState<any | null>(null)
  const [availableServices, setAvailableServices] = useState<ServiceAdmin[]>([])
  const [assignedServices, setAssignedServices] = useState<ServiceAdmin[]>([])
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set())
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set())
  const [savingAssignment, setSavingAssignment] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [orgData, svcData] = await Promise.all([
        getOrganizations(),
        getServicesAdmin(),
      ])
      setOrgs(orgData)
      setServices(svcData)
      
      // Load windows for selected org
      if (selectedOrg) {
        const res = await fetch(`${BASE}/windows?organization=${selectedOrg}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
        })
        const winData = await res.json()
        setWindows(Array.isArray(winData) ? winData : [])
      } else {
        setWindows([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [selectedOrg])

  const loadWindowsForOrg = async (orgId: string) => {
    if (!orgId) { setWindows([]); return }
    try {
      const res = await fetch(`${BASE}/windows?organization=${orgId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
      })
      const data = await res.json()
      setWindows(Array.isArray(data) ? data : [])
    } catch (err) {
      setWindows([])
    }
  }

  const loadRequirements = async (serviceId: string) => {
    try {
      const data = await getRequirementsByService(serviceId)
      setRequirements(data)
      setSelectedService(serviceId)
    } catch (err) {
      setError('Failed to load requirements')
    }
  }

  // Service CRUD
  const handleSaveService = async () => {
    setSavingService(true)
    setError('')
    try {
      if (editingService) {
        const updated = await updateService(editingService._id, serviceForm)
        setServices(prev => prev.map(s => s._id === editingService._id ? updated : s))
        setSuccess('Service updated!')
      } else {
        const created = await createService(serviceForm)
        setServices(prev => [created, ...prev])
        setSuccess('Service created!')
      }
      setShowServiceForm(false)
      setEditingService(null)
      setServiceForm(emptyServiceForm)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingService(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(id)
      setServices(prev => prev.filter(s => s._id !== id))
      setSuccess('Service deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Window CRUD
  const handleSaveWindow = async () => {
    setSavingWindow(true)
    setError('')
    try {
      if (editingWindow) {
        const res = await fetch(`${BASE}/windows/${editingWindow._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
          body: JSON.stringify(windowForm),
        })
        const updated = await res.json()
        setWindows(prev => prev.map((w: any) => w._id === editingWindow._id ? updated : w))
        setSuccess('Window updated!')
      } else {
        const res = await fetch(`${BASE}/windows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
          body: JSON.stringify(windowForm),
        })
        const created = await res.json()
        setWindows(prev => [created, ...prev])
        setSuccess('Window created!')
      }
      setShowWindowForm(false)
      setEditingWindow(null)
      setWindowForm(emptyWindowForm)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingWindow(false)
    }
  }

  const handleDeleteWindow = async (id: string) => {
    try {
      const res = await fetch(`${BASE}/windows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setWindows(prev => prev.filter((w: any) => w._id !== id))
      setSuccess('Window deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Requirement CRUD
  const handleSaveReq = async () => {
    if (!selectedService) return
    setSavingReq(true)
    setError('')
    try {
      const payload = { ...reqForm, service: selectedService }
      if (editingReq) {
        const updated = await updateRequirement(editingReq._id, payload)
        setRequirements(prev => prev.map(r => r._id === editingReq._id ? updated : r))
        setSuccess('Requirement updated!')
      } else {
        const created = await createRequirement(payload)
        setRequirements(prev => [...prev, created])
        setSuccess('Requirement created!')
      }
      setShowReqForm(false)
      setEditingReq(null)
      setReqForm(emptyRequirementForm)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingReq(false)
    }
  }

  const handleDeleteReq = async (id: string) => {
    try {
      await deleteRequirement(id)
      setRequirements(prev => prev.filter(r => r._id !== id))
      setSuccess('Requirement deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Assign Services
  const handleOpenAssignModal = async (win: any) => {
    setAssigningWindow(win)
    setSelectedAvailable(new Set())
    setSelectedAssigned(new Set())
    setShowAssignModal(true)
    setError('')

    try {
      // Load available services (not assigned to this window)
      const available = await getAvailableServicesForWindow(win._id)
      setAvailableServices(Array.isArray(available) ? available : [])

      // Load currently assigned services for this window
      const res = await fetch(`${BASE}/windows/${win._id}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
      })
      const assigned = await res.json()
      setAssignedServices(Array.isArray(assigned) ? assigned : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    }
  }

  const handleAssignServices = async () => {
    if (!assigningWindow) return
    setSavingAssignment(true)
    setError('')
    try {
      // The backend smart logic handles this correctly:
      // We send ALL service IDs that should belong to this window
      // (current assigned + newly selected available ones)
      const currentlyAssignedIds = assignedServices.map(s => s._id)
      const allServiceIds = [...currentlyAssignedIds, ...Array.from(selectedAvailable)]

      const result = await assignServicesToWindow(assigningWindow._id, allServiceIds)
      
      if (result && result.services) {
        setAssignedServices(result.services)
      } else {
        // Refresh the data
        const res = await fetch(`${BASE}/windows/${assigningWindow._id}/services`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
        })
        const updatedAssigned = await res.json()
        setAssignedServices(Array.isArray(updatedAssigned) ? updatedAssigned : [])
      }

      // Remove assigned services from available list
      setAvailableServices(prev => prev.filter(s => !selectedAvailable.has(s._id)))
      setSelectedAvailable(new Set())
      setSuccess('Services assigned successfully!')
      // Refresh just windows for this org (faster than full loadData)
      if (selectedOrg) {
        fetch(`${BASE}/windows?organization=${selectedOrg}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
        })
          .then(r => r.json())
          .then(data => setWindows(Array.isArray(data) ? data : []))
          .catch(() => {})
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign services')
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleUnassignServices = async () => {
    if (!assigningWindow) return
    setSavingAssignment(true)
    setError('')
    try {
      // We send ALL service IDs that should remain AFTER removing selected ones
      const remainingIds = assignedServices
        .filter(s => !selectedAssigned.has(s._id))
        .map(s => s._id)

      const result = await assignServicesToWindow(assigningWindow._id, remainingIds)

      if (result && result.services) {
        setAssignedServices(result.services)
      } else {
        setAssignedServices(prev => prev.filter(s => !selectedAssigned.has(s._id)))
      }

      // Move unassigned services back to available
      const unassignedServices = assignedServices.filter(s => selectedAssigned.has(s._id))
      setAvailableServices(prev => [...prev, ...unassignedServices])
      setSelectedAssigned(new Set())
      setSuccess('Services unassigned successfully!')
      // Refresh just windows for this org (faster than full loadData)
      if (selectedOrg) {
        fetch(`${BASE}/windows?organization=${selectedOrg}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` },
        })
          .then(r => r.json())
          .then(data => setWindows(Array.isArray(data) ? data : []))
          .catch(() => {})
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign services')
    } finally {
      setSavingAssignment(false)
    }
  }

  const filteredServices = selectedWindow
    ? services.filter(s => {
        const winId = typeof s.window === 'string' ? s.window : s.window?._id
        return winId === selectedWindow
      })
    : selectedOrg
    ? services.filter(s => {
        const orgId = typeof s.organization === 'string' ? s.organization : s.organization?._id
        return orgId === selectedOrg
      })
    : services

  // Group windows by floor
  const windowsByFloor = floors.map(floor => ({
    floor,
    windows: windows.filter((w: any) => w.floor === floor),
  }))

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage organizations, floors, windows, services, and requirements</p>
        </div>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
      </motion.div>}</AnimatePresence>

      {error && <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {/* Organization Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Organization</label>
        <div className="flex items-center gap-3">
          <select value={selectedOrg} onChange={e => { setSelectedOrg(e.target.value); setSelectedWindow(''); loadWindowsForOrg(e.target.value) }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
            <option value="">Choose an organization...</option>
            {orgs.map(org => <option key={org._id} value={org._id}>{org.name.en}</option>)}
          </select>
        </div>
      </div>

      {selectedOrg && (
        <>
          {/* Windows by Floor */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-brand-green" /> Windows by Floor
              </h2>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingWindow(null); setWindowForm({ ...emptyWindowForm, organization: selectedOrg }); setShowWindowForm(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
                <Plus className="h-4 w-4" /> New Window
              </motion.button>
            </div>

            <div className="space-y-4">
              {windowsByFloor.map(({ floor, windows: floorWindows }) => (
                <div key={floor} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand-green" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {floorLabels.en[floor - 1]}
                    </span>
                    <span className="text-xs text-gray-500">({floorWindows.length} windows)</span>
                  </div>
                  {floorWindows.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">No windows on this floor</div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {floorWindows.map((win: any) => (
                        <div key={win._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0 font-bold text-xs">
                              {win.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">Window {win.number}</p>
                              <p className="text-xs text-gray-500">{win.serviceCount || 0} services</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleOpenAssignModal(win)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green" title="Assign services">
                                <CheckSquare className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => { setEditingWindow(win); setWindowForm({ number: win.number, floor: win.floor, organization: win.organization?._id || selectedOrg, description: win.description || { en: '', am: '', or: '' } }); setShowWindowForm(true) }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setConfirmDelete({ type: 'window', id: win._id })}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-green" /> Services
              </h2>
              <div className="flex items-center gap-3">
                <select value={selectedWindow} onChange={e => setSelectedWindow(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">All Windows</option>
                  {windows.map((w: any) => <option key={w._id} value={w._id}>Window {w.number} (Floor {w.floor})</option>)}
                </select>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setEditingService(null); setServiceForm({ ...emptyServiceForm, organization: selectedOrg }); setShowServiceForm(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
                  <Plus className="h-4 w-4" /> New Service
                </motion.button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredServices.map((svc, idx) => (
                <motion.div key={svc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{svc.name.en}</p>
                      <p className="text-xs text-gray-500">
                        {svc.window && typeof svc.window === 'object' ? `Window ${svc.window.number} (Floor ${svc.window.floor})` : 'No window assigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => loadRequirements(svc._id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green" title="Manage requirements">
                        <List className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditingService(svc); setServiceForm({ name: { ...svc.name }, description: { ...svc.description }, organization: typeof svc.organization === 'string' ? svc.organization : svc.organization?._id || '', window: typeof svc.window === 'string' ? svc.window : svc.window?._id || '', requiredDocuments: svc.requiredDocuments || [], fee: svc.fee, processingTime: svc.processingTime, workingHours: svc.workingHours, contactPhone: svc.contactPhone }); setShowServiceForm(true) }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmDelete({ type: 'service', id: svc._id })}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedService === svc._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Requirements</h4>
                        <button onClick={() => { setEditingReq(null); setReqForm(emptyRequirementForm); setShowReqForm(true) }}
                          className="text-xs text-brand-green hover:text-brand-green-dark font-medium">+ Add Requirement</button>
                      </div>
                      {requirements.length === 0 ? (
                        <p className="text-xs text-gray-400">No requirements added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {requirements.map(req => (
                            <div key={req._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <span className={cn('w-2 h-2 rounded-full shrink-0', req.isMandatory ? 'bg-red-500' : 'bg-gray-400')} />
                              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{req.requirementText.en}</span>
                              <span className="text-xs text-gray-400">#{req.sequenceNo}</span>
                              <button onClick={() => { setEditingReq(req); setReqForm({ requirementText: { ...req.requirementText }, notes: { ...req.notes }, isMandatory: req.isMandatory, sequenceNo: req.sequenceNo }); setShowReqForm(true) }}
                                className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setConfirmDelete({ type: 'requirement', id: req._id })}
                                className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              {filteredServices.length === 0 && <p className="text-center py-8 text-gray-400">No services found</p>}
            </div>
          </div>
        </>
      )}

      {!selectedOrg && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select an organization to manage its windows and services</p>
        </div>
      )}

      {/* Assign Services Modal */}
      <AnimatePresence>{showAssignModal && assigningWindow && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assign Services</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Window {assigningWindow.number} — Floor {assigningWindow.floor}
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
              {/* Available Services */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Services</h3>
                  <span className="text-xs text-gray-500">{availableServices.length} services</span>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  {availableServices.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400 p-4 text-center">
                      All services are assigned to this window or no services exist for this organization
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {availableServices.map(svc => (
                        <div key={svc._id}
                          onClick={() => {
                            const newSet = new Set(selectedAvailable)
                            if (newSet.has(svc._id)) newSet.delete(svc._id)
                            else newSet.add(svc._id)
                            setSelectedAvailable(newSet)
                          }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                            selectedAvailable.has(svc._id) ? 'bg-brand-green/5 dark:bg-brand-green/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          )}>
                          {selectedAvailable.has(svc._id) ? (
                            <CheckSquare className="h-5 w-5 text-brand-green shrink-0" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{svc.name.en}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedAvailable.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAssignServices}
                    disabled={savingAssignment}
                    className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-dark transition-all disabled:opacity-50">
                    {savingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Assign {selectedAvailable.size} service{selectedAvailable.size !== 1 ? 's' : ''}
                  </motion.button>
                )}
              </div>

              {/* Assigned Services */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assigned Services</h3>
                  <span className="text-xs text-gray-500">{assignedServices.length} services</span>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  {assignedServices.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400 p-4 text-center">
                      No services assigned to this window yet. Select services from the left panel.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {assignedServices.map(svc => (
                        <div key={svc._id}
                          onClick={() => {
                            const newSet = new Set(selectedAssigned)
                            if (newSet.has(svc._id)) newSet.delete(svc._id)
                            else newSet.add(svc._id)
                            setSelectedAssigned(newSet)
                          }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                            selectedAssigned.has(svc._id) ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          )}>
                          {selectedAssigned.has(svc._id) ? (
                            <CheckSquare className="h-5 w-5 text-red-500 shrink-0" />
                          ) : (
                            <CheckSquare className="h-5 w-5 text-brand-green shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{svc.name.en}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedAssigned.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleUnassignServices}
                    disabled={savingAssignment}
                    className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50">
                    {savingAssignment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                    Unassign {selectedAssigned.size} service{selectedAssigned.size !== 1 ? 's' : ''}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Window Form Modal */}
      <AnimatePresence>{showWindowForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowWindowForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingWindow ? 'Edit Window' : 'New Window'}</h2>
              <button onClick={() => setShowWindowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Window Name/Number</label>
                <input value={windowForm.number} onChange={e => setWindowForm(f => ({ ...f, number: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" placeholder="e.g. Window 1, Foddaa 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                <select value={windowForm.floor} onChange={e => setWindowForm(f => ({ ...f, floor: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  {floors.map(f => <option key={f} value={f}>{floorLabels.en[f - 1]}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowWindowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveWindow} disabled={savingWindow}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                  {savingWindow && <Loader2 className="h-4 w-4 animate-spin" />}{editingWindow ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Service Form Modal */}
      <AnimatePresence>{showServiceForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowServiceForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingService ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setShowServiceForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name ({lang.toUpperCase()})</label>
                  <input value={serviceForm.name[lang]} onChange={e => setServiceForm(f => ({ ...f, name: { ...f.name, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description ({lang.toUpperCase()})</label>
                  <textarea value={serviceForm.description[lang]} onChange={e => setServiceForm(f => ({ ...f, description: { ...f.description, [lang]: e.target.value } }))} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Window</label>
                <select value={serviceForm.window} onChange={e => setServiceForm(f => ({ ...f, window: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">No window (standalone service)</option>
                  {windows.map((w: any) => <option key={w._id} value={w._id}>Window {w.number} (Floor {w.floor})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee (ETB)</label>
                  <input type="number" value={serviceForm.fee} onChange={e => setServiceForm(f => ({ ...f, fee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processing Time</label>
                  <input value={serviceForm.processingTime} onChange={e => setServiceForm(f => ({ ...f, processingTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Working Hours</label>
                  <input value={serviceForm.workingHours} onChange={e => setServiceForm(f => ({ ...f, workingHours: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                  <input value={serviceForm.contactPhone} onChange={e => setServiceForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowServiceForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveService} disabled={savingService}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                  {savingService && <Loader2 className="h-4 w-4 animate-spin" />}{editingService ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Requirement Form Modal */}
      <AnimatePresence>{showReqForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowReqForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingReq ? 'Edit Requirement' : 'New Requirement'}</h2>
              <button onClick={() => setShowReqForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirement Text ({lang.toUpperCase()})</label>
                  <input value={reqForm.requirementText[lang]} onChange={e => setReqForm(f => ({ ...f, requirementText: { ...f.requirementText, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sequence No</label>
                  <input type="number" value={reqForm.sequenceNo} onChange={e => setReqForm(f => ({ ...f, sequenceNo: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={reqForm.isMandatory} onChange={e => setReqForm(f => ({ ...f, isMandatory: e.target.checked }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mandatory</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowReqForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveReq} disabled={savingReq}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                  {savingReq && <Loader2 className="h-4 w-4 animate-spin" />}{editingReq ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>{confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete {confirmDelete.type}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => {
                if (confirmDelete.type === 'service') handleDeleteService(confirmDelete.id)
                else if (confirmDelete.type === 'window') handleDeleteWindow(confirmDelete.id)
                else if (confirmDelete.type === 'requirement') handleDeleteReq(confirmDelete.id)
              }} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}