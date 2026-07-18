import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Building2, List } from 'lucide-react'
import { getOrganizations, getServicesAdmin, createService, updateService, deleteService, getWindowsAdmin, createWindow, updateWindow, deleteWindow, getRequirementsByService, createRequirement, updateRequirement, deleteRequirement, type OrganizationSummary, type ServiceAdmin, type WindowAdmin, type RequirementAdmin } from '@/api/admin'
import { cn } from '@/lib/utils'

const langs = ['en', 'am', 'or'] as const

const emptyServiceForm = {
  name: { en: '', am: '', or: '' },
  description: { en: '', am: '', or: '' },
  organization: '',
  requiredDocuments: [] as string[],
  fee: 0,
  processingTime: '',
  workingHours: '',
  contactPhone: '',
}

const emptyWindowForm = {
  number: 1,
  organization: '',
}

const emptyRequirementForm = {
  requirementText: { en: '', am: '', or: '' },
  notes: { en: '', am: '', or: '' },
  isMandatory: true,
  sequenceNo: 0,
}

type Tab = 'windows' | 'offices'

export default function AdminServices() {
  const [tab, setTab] = useState<Tab>('windows')
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [windows, setWindows] = useState<WindowAdmin[]>([])
  const [services, setServices] = useState<ServiceAdmin[]>([])
  const [requirements, setRequirements] = useState<RequirementAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedService, setSelectedService] = useState('')

  // Service form
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceAdmin | null>(null)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [savingService, setSavingService] = useState(false)

  // Window form
  const [showWindowForm, setShowWindowForm] = useState(false)
  const [editingWindow, setEditingWindow] = useState<WindowAdmin | null>(null)
  const [windowForm, setWindowForm] = useState(emptyWindowForm)
  const [savingWindow, setSavingWindow] = useState(false)

  // Requirement form
  const [showReqForm, setShowReqForm] = useState(false)
  const [editingReq, setEditingReq] = useState<RequirementAdmin | null>(null)
  const [reqForm, setReqForm] = useState(emptyRequirementForm)
  const [savingReq, setSavingReq] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [orgData, winData, svcData] = await Promise.all([
        getOrganizations(),
        getWindowsAdmin(),
        getServicesAdmin(),
      ])
      setOrgs(orgData)
      setWindows(winData)
      setServices(svcData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

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
        const updated = await updateWindow(editingWindow._id, windowForm)
        setWindows(prev => prev.map(w => w._id === editingWindow._id ? updated : w))
        setSuccess('Window updated!')
      } else {
        const created = await createWindow(windowForm)
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
      await deleteWindow(id)
      setWindows(prev => prev.filter(w => w._id !== id))
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

  const filteredServices = selectedOrg ? services.filter(s => {
    const orgId = typeof s.organization === 'string' ? s.organization : s.organization?._id
    return orgId === selectedOrg
  }) : services

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage services by window and office</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('windows')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === 'windows' ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
          Services by Window
        </button>
        <button onClick={() => setTab('offices')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === 'offices' ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
          Services by Office
        </button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
      </motion.div>}</AnimatePresence>

      {error && <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {tab === 'windows' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Windows</h2>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setEditingWindow(null); setWindowForm(emptyWindowForm); setShowWindowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
              <Plus className="h-4 w-4" /> New Window
            </motion.button>
          </div>

          <div className="space-y-3">
            {windows.map((win, idx) => (
              <motion.div key={win._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0 font-bold">
                    {win.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">Window {win.number}</p>
                    <p className="text-xs text-gray-500">{win.organization?.name?.en || 'No organization'} • {win.services?.length || 0} services</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditingWindow(win); setWindowForm({ number: win.number, organization: win.organization?._id || '' }); setShowWindowForm(true) }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDelete({ type: 'window', id: win._id })}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Services for this window */}
                {win.services && win.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Services</h4>
                    {win.services.map(svc => (
                      <div key={svc._id} className="pl-4">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Wrench className="h-4 w-4 text-brand-green shrink-0" />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{svc.name?.en || 'Service'}</span>
                          <button onClick={() => { loadRequirements(svc._id); setSelectedService(svc._id) }}
                            className="text-xs text-brand-green hover:text-brand-green-dark font-medium">Requirements</button>
                        </div>
                        {/* Requirements for this service */}
                        {selectedService === svc._id && (
                          <div className="ml-6 mt-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Requirements</h5>
                              <button onClick={() => { setEditingReq(null); setReqForm(emptyRequirementForm); setShowReqForm(true) }}
                                className="text-xs text-brand-green hover:text-brand-green-dark font-medium">+ Add</button>
                            </div>
                            {requirements.length === 0 ? (
                              <p className="text-xs text-gray-400">No requirements added yet</p>
                            ) : (
                              <div className="space-y-1.5">
                                {requirements.map(req => (
                                  <div key={req._id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700/50">
                                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', req.isMandatory ? 'bg-red-500' : 'bg-gray-400')} />
                                    <span className="flex-1 text-xs text-gray-700 dark:text-gray-300">{req.requirementText.en}</span>
                                    <span className="text-[10px] text-gray-400">#{req.sequenceNo}</span>
                                    <button onClick={() => { setEditingReq(req); setReqForm({ requirementText: { ...req.requirementText }, notes: { ...req.notes }, isMandatory: req.isMandatory, sequenceNo: req.sequenceNo }); setShowReqForm(true) }}
                                      className="p-0.5 text-gray-400 hover:text-blue-600"><Edit3 className="h-3 w-3" /></button>
                                    <button onClick={() => setConfirmDelete({ type: 'requirement', id: req._id })}
                                      className="p-0.5 text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {windows.length === 0 && <p className="text-center py-8 text-gray-400">No windows created yet</p>}
          </div>
        </div>
      )}

      {tab === 'offices' && (
        <div className="space-y-6">
          {/* Organization filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                <option value="">All Organizations</option>
                {orgs.map(org => <option key={org._id} value={org._id}>{org.name.en}</option>)}
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setEditingService(null); setServiceForm(emptyServiceForm); setShowServiceForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
              <Plus className="h-4 w-4" /> New Service
            </motion.button>
          </div>

          {/* Services list */}
          <div className="space-y-3">
            {filteredServices.map((svc, idx) => (
              <motion.div key={svc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{svc.name.en}</p>
                    <p className="text-xs text-gray-500">
                      {typeof svc.organization === 'object' ? svc.organization?.name?.en : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => loadRequirements(svc._id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green" title="Manage requirements">
                      <List className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setEditingService(svc); setServiceForm({ name: { ...svc.name }, description: { ...svc.description }, organization: typeof svc.organization === 'string' ? svc.organization : svc.organization?._id || '', requiredDocuments: svc.requiredDocuments || [], fee: svc.fee, processingTime: svc.processingTime, workingHours: svc.workingHours, contactPhone: svc.contactPhone }); setShowServiceForm(true) }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDelete({ type: 'service', id: svc._id })}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Requirements for this service */}
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
      )}

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Window Number</label>
                <input type="number" value={windowForm.number} onChange={e => setWindowForm(f => ({ ...f, number: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                <select value={windowForm.organization} onChange={e => setWindowForm(f => ({ ...f, organization: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">Select organization</option>
                  {orgs.map(org => <option key={org._id} value={org._id}>{org.name.en}</option>)}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                <select value={serviceForm.organization} onChange={e => setServiceForm(f => ({ ...f, organization: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">Select organization</option>
                  {orgs.map(org => <option key={org._id} value={org._id}>{org.name.en}</option>)}
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