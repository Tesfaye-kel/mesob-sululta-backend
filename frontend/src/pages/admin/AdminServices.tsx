import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle,
  Building2, Layers, DoorOpen, List, FileText, ArrowRight, ArrowLeft,
  CheckSquare,
} from 'lucide-react'
import {
  getOrganizations, getServicesAdmin, createService, updateService, deleteService, deleteServicesByWindow,
  createWindow, updateWindow, deleteWindow,
  getRequirementsByService, createRequirement, updateRequirement, deleteRequirement,
  assignServicesToWindow, getAvailableServicesForWindow,
  getFloorsAdmin, getWindowsAdmin, createFloor, updateFloor, deleteFloor,
  createOrganization, updateOrganization, deleteOrganization,
  type OrganizationSummary, type ServiceAdmin, type RequirementAdmin, type FloorAdmin, type WindowAdmin,
} from '@/api/admin'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/i18n/translations'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const langs = ['en', 'am', 'or'] as const

// ── Empty forms ──────────────────────────────────────────────────────────────
const emptyFloorForm = { floorNumber: 1, name: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' } }
const emptyOrgForm = { name: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, logoUrl: '' }
const emptyWindowForm = { number: '', name: { en: '', am: '', or: '' }, floor: 1, organization: '', description: { en: '', am: '', or: '' } }
const emptyServiceForm = { name: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, organization: '', window: '', requiredDocuments: [] as string[], fee: 0, processingTime: '', workingHours: '', contactPhone: '' }
const emptyRequirementForm = { requirementText: { en: '', am: '', or: '' }, notes: { en: '', am: '', or: '' }, isMandatory: true, sequenceNo: 0 }

function getLocalizedRows(texts: { en: string; am: string; or: string }) {
  const rows = langs.map(code => texts[code].split(/\r?\n/).map(value => value.trim()).filter(Boolean))
  const populated = rows.filter(values => values.length > 0)
  if (populated.length === 0) return [] as Array<{ en: string; am: string; or: string }>

  const rowCount = Math.max(...rows.map(values => values.length))
  return Array.from({ length: rowCount }, (_, index) => {
    const fallback = rows.find(values => values[index])?.[index] || ''
    return {
      en: rows[0][index] || fallback,
      am: rows[1][index] || fallback,
      or: rows[2][index] || fallback,
    }
  })
}

// ── Lang field helper ────────────────────────────────────────────────────────
function LangFields({ label, value, onChange }: { label: string; value: { en: string; am: string; or: string }; onChange: (v: { en: string; am: string; or: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {langs.map(lang => (
        <div key={lang} className="flex items-center gap-2">
          <span className="text-xs font-mono w-6 text-gray-400 shrink-0 uppercase">{lang}</span>
          <input
            value={value[lang]}
            onChange={e => onChange({ ...value, [lang]: e.target.value })}
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
      ))}
    </div>
  )
}

// ── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const admin = t.admin
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{admin.cancel}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">{admin.delete}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── OFFICES TAB ──────────────────────────────────────────────────────────────
function OfficesTab() {
  const { t } = useLanguage()
  const admin = t.admin
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrganizationSummary | null>(null)
  const [form, setForm] = useState(emptyOrgForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { setOrgs(await getOrganizations()) }
    catch { setError('Failed to load offices') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const payload = { name: form.name, description: form.description, logoUrl: form.logoUrl }
      if (editing) {
        await updateOrganization(editing._id, payload)
        setSuccess('Office updated!')
      } else {
        await createOrganization(payload)
        setSuccess('Office created!')
      }
      setShowForm(false); setEditing(null); setForm(emptyOrgForm)
      setOrgs(await getOrganizations())
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id)
      setOrgs(await getOrganizations())
      setSuccess('Office deleted!'); setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-green" /> {admin.offices}
        </h2>
        <button onClick={() => { setEditing(null); setForm(emptyOrgForm); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90">
          <Plus className="h-4 w-4" /> {admin.newOffice}
        </button>
      </div>

      <AnimatePresence>{success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />{success}
        </motion.div>
      )}</AnimatePresence>
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div>
      ) : (
        <div className="space-y-3">
          {orgs.length === 0 && <p className="text-center text-gray-400 py-8">{admin.noOfficesYet}</p>}
          {orgs.map(org => (
            <div key={org._id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{org.name.en}</p>
                  <p className="text-xs text-gray-500">{org.name.or} · {org.name.am}</p>
                  <p className="text-xs text-gray-400">{org.serviceCount ?? 0} services</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(org)
                    setForm({ name: { en: org.name.en, am: org.name.am, or: org.name.or }, description: { en: org.description?.en || '', am: org.description?.am || '', or: org.description?.or || '' }, logoUrl: org.logoUrl || '' })
                    setShowForm(true)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDelete(org._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Office Form Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? admin.editOffice : admin.newOffice}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <LangFields label={admin.officeName} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <LangFields label={admin.descriptionOptional} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">{admin.logoUrlOptional}</label>
                <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{admin.cancel}</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {admin.save}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{confirmDelete && (
        <ConfirmDialog
          msg="Delete this office? Its services and windows will become unlinked."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}</AnimatePresence>
    </div>
  )
}

// ── FLOORS TAB ───────────────────────────────────────────────────────────────
function FloorsTab() {
  const { t } = useLanguage()
  const admin = t.admin
  const [floors, setFloors] = useState<FloorAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FloorAdmin | null>(null)
  const [form, setForm] = useState(emptyFloorForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => { setLoading(true); try { setFloors(await getFloorsAdmin()) } catch { setError('Failed to load floors') } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const payload = { floorNumber: form.floorNumber, name: form.name, description: form.description }
      if (editing) {
        await updateFloor(editing._id, payload)
        setSuccess('Floor updated!')
      } else {
        await createFloor(payload)
        setSuccess('Floor created!')
      }
      setShowForm(false); setEditing(null); setForm(emptyFloorForm)
      setFloors((await getFloorsAdmin()).sort((a, b) => a.floorNumber - b.floorNumber))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFloor(id)
      setFloors(await getFloorsAdmin())
      setSuccess('Floor deleted!'); setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Layers className="h-5 w-5 text-brand-green" /> {admin.floorsTab}</h2>
        <button onClick={() => { setEditing(null); setForm(emptyFloorForm); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90">
          <Plus className="h-4 w-4" /> {admin.newFloor}
        </button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />{success}</motion.div>}</AnimatePresence>
      {error && <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div> : (
        <div className="space-y-3">
          {floors.length === 0 && <p className="text-center text-gray-400 py-8">{admin.noFloorsYet}</p>}
          {floors.map(floor => (
            <div key={floor._id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-sm shrink-0">{floor.floorNumber}</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{floor.name.en}</p>
                  <p className="text-xs text-gray-500">{floor.name.or} · {floor.name.am}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(floor); setForm({ floorNumber: floor.floorNumber, name: { en: floor.name.en, am: floor.name.am, or: floor.name.or || '' }, description: { en: floor.description?.en || '', am: floor.description?.am || '', or: floor.description?.or || '' } }); setShowForm(true) }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDelete(floor._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floor Form Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? admin.editFloor : admin.newFloor}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">{admin.floorNumber}</label>
                <input type="number" min="1" value={form.floorNumber} onChange={e => setForm(f => ({ ...f, floorNumber: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <LangFields label={admin.floorName} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <LangFields label={admin.descriptionOptional} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{admin.cancel}</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {admin.save}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{confirmDelete && <ConfirmDialog msg="Delete this floor? Windows assigned to it will NOT be deleted but will lose their floor label." onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}</AnimatePresence>
    </div>
  )
}

// ── WINDOWS TAB ──────────────────────────────────────────────────────────────
function WindowsTab() {
  const { language, t } = useLanguage()
  const admin = t.admin
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [floors, setFloors] = useState<FloorAdmin[]>([])
  const [windows, setWindows] = useState<any[]>([])
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(emptyWindowForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  // Assign services
  const [showAssign, setShowAssign] = useState(false)
  const [assignWin, setAssignWin] = useState<any | null>(null)
  const [available, setAvailable] = useState<ServiceAdmin[]>([])
  const [assigned, setAssigned] = useState<ServiceAdmin[]>([])
  const [selAvail, setSelAvail] = useState<Set<string>>(new Set())
  const [selAssigned, setSelAssigned] = useState<Set<string>>(new Set())
  const [savingAssign, setSavingAssign] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [orgData, floorData] = await Promise.all([getOrganizations(), getFloorsAdmin()])
      setOrgs(orgData); setFloors(floorData)
      // Load ALL windows (no filter) so all floors show their windows
      await loadWindows()
    } catch { setError('Failed to load data') } finally { setLoading(false) }
  }

  const loadWindows = async () => {
    try {
      const res = await fetch(`${BASE}/windows`, { headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` } })
      const data = await res.json()
      setWindows(Array.isArray(data) ? data : [])
    } catch { setWindows([]) }
  }

  useEffect(() => { loadAll() }, [])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const payload = { number: form.number, name: form.name, floor: form.floor, organization: form.organization || null, description: form.description }
      if (editing) {
        const res = await fetch(`${BASE}/windows/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin-token')}` }, body: JSON.stringify(payload) })
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update') }
        setSuccess('Window updated!')
      } else {
        const res = await fetch(`${BASE}/windows`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin-token')}` }, body: JSON.stringify(payload) })
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create') }
        setSuccess('Window created!')
      }
      setShowForm(false); setEditing(null); setForm(emptyWindowForm)
      await loadWindows()   // always re-fetch so floor grouping & org names are fresh
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${BASE}/windows/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` } })
      if (!res.ok) throw new Error('Failed to delete')
      await loadWindows()
      setSuccess('Window deleted!'); setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete') }
    setConfirmDelete(null)
  }

  const openAssign = async (win: any) => {
    setAssignWin(win); setSelAvail(new Set()); setSelAssigned(new Set()); setShowAssign(true)
    try {
      const [avail, asgd] = await Promise.all([
        getAvailableServicesForWindow(win._id),
        fetch(`${BASE}/windows/${win._id}/services`, { headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` } }).then(r => r.json()),
      ])
      setAvailable(Array.isArray(avail) ? avail : [])
      setAssigned(Array.isArray(asgd) ? asgd : [])
    } catch { setError('Failed to load services') }
  }

  const handleAssign = async () => {
    if (!assignWin) return
    setSavingAssign(true)
    try {
      const ids = [...assigned.map(s => s._id), ...Array.from(selAvail)]
      const res = await assignServicesToWindow(assignWin._id, ids)
      if (res?.services) setAssigned(res.services)
      setAvailable(prev => prev.filter(s => !selAvail.has(s._id)))
      setSelAvail(new Set())
      setSuccess('Services assigned!'); setTimeout(() => setSuccess(''), 3000)
      await loadWindows()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') } finally { setSavingAssign(false) }
  }

  const handleUnassign = async () => {
    if (!assignWin) return
    setSavingAssign(true)
    try {
      const remaining = assigned.filter(s => !selAssigned.has(s._id)).map(s => s._id)
      const res = await assignServicesToWindow(assignWin._id, remaining)
      if (res?.services) setAssigned(res.services)
      else setAssigned(prev => prev.filter(s => !selAssigned.has(s._id)))
      setAvailable(prev => [...prev, ...assigned.filter(s => selAssigned.has(s._id))])
      setSelAssigned(new Set())
      setSuccess('Services unassigned!'); setTimeout(() => setSuccess(''), 3000)
      await loadWindows()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') } finally { setSavingAssign(false) }
  }

  // Floors to display — if a floor filter is active, show only that floor; otherwise all floors
  const floorNums = floors.length > 0
    ? floors.map(f => f.floorNumber)
    : [...new Set(windows.map((w: any) => w.floor))].sort() as number[]

  const byFloor = floorNums
    .filter(fn => selectedFloor === '' || fn === selectedFloor)
    .map(fn => ({
      floorNum: fn,
      floorDoc: floors.find(f => f.floorNumber === fn),
      wins: windows.filter((w: any) => w.floor === fn),
    }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><DoorOpen className="h-5 w-5 text-brand-green" /> {admin.windowsTab}</h2>
        <button onClick={() => { setEditing(null); setForm({ ...emptyWindowForm, floor: selectedFloor !== '' ? selectedFloor : 1 }); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90">
          <Plus className="h-4 w-4" /> {admin.newWindowAdmin}
        </button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />{success}</motion.div>}</AnimatePresence>
      {error && <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {/* Floor filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{admin.filterByFloor}</label>
        <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
          <option value="">{admin.allFloors}</option>
          {floors.map(fl => (
            <option key={fl._id} value={fl.floorNumber}>
              {fl.name.en} — {fl.name.or} ({fl.name.am})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div>}

      {!loading && (
        <div className="space-y-4">
          {byFloor.map(({ floorNum, floorDoc, wins }) => (
            <div key={floorNum} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-green" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {floorDoc ? `${floorDoc.name.en} — ${floorDoc.name.or} (${floorDoc.name.am})` : `Floor ${floorNum}`}
                </span>
                <span className="text-xs text-gray-500 ml-1">({wins.length} windows)</span>
              </div>
              {wins.length === 0
                ? <div className="px-4 py-3 text-sm text-gray-400">{admin.noWindowsYet}</div>
                : <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {wins.map((win: any) => (
                      <div key={win._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs shrink-0">{win.number}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{win.name?.or || `Foddaa ${win.number}ffaa`}</p>
                          <p className="text-xs text-gray-500">
                            {win.name?.en || `Window ${win.number}`} · {win.serviceCount ?? 0} services
                            {win.organization?.name?.en ? ` · ${win.organization.name.en}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openAssign(win)} title="Assign services" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green"><CheckSquare className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setEditing(win); setForm({ number: win.number, name: win.name || { en: '', am: '', or: '' }, floor: win.floor, organization: win.organization?._id || '', description: win.description || { en: '', am: '', or: '' } }); setShowForm(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setConfirmDelete(win._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          ))}
          {byFloor.length === 0 && <p className="text-center text-gray-400 py-8">{admin.noFloorsYet}</p>}
        </div>
      )}

      {/* Window Form Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? admin.editWindow : admin.newWindowAdmin}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">{admin.windowNumber}</label>
                  <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. 1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">{admin.floor}</label>
                  <select value={form.floor} onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                    {floors.length > 0 ? floors.map(fl => <option key={fl._id} value={fl.floorNumber}>{fl.name.en} — {fl.name.or}</option>)
                      : [1,2,3,4,5].map(n => <option key={n} value={n}>Floor {n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">{admin.officeOptional}</label>
                <select value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">{admin.noOffice}</option>
                  {orgs.map(o => <option key={o._id} value={o._id}>{o.name.en}</option>)}
                </select>
              </div>
              <LangFields label={admin.windowName} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <LangFields label={admin.descriptionOptional} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{admin.cancel}</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {admin.save}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Assign Services Modal */}
      <AnimatePresence>{showAssign && assignWin && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{admin.assignServices} — {admin.windowLabel} {assignWin.number}</h3><p className="text-xs text-gray-500">{assignWin.name?.[language] || assignWin.name?.en || ''} · {admin.floor} {assignWin.floor}</p></div>
              <button onClick={() => setShowAssign(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 overflow-hidden">
              {/* Available */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{admin.availableServices} ({available.length})</span><button type="button" onClick={() => setSelAvail(new Set(available.map(s => s._id)))} className="text-xs text-brand-green">{admin.selectAll}</button></div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700">
                  {available.length === 0 ? <p className="text-center text-xs text-gray-400 p-4">{admin.allAssignedMessage}</p>
                    : available.map(s => (
                      <div key={s._id} onClick={() => setSelAvail(prev => { const n = new Set(prev); n.has(s._id) ? n.delete(s._id) : n.add(s._id); return n })}
                        className={cn('px-3 py-2 cursor-pointer text-xs transition-colors', selAvail.has(s._id) ? 'bg-brand-green/10 dark:bg-brand-green/20 text-brand-green font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300')}>
                        {s.name.en}
                      </div>
                    ))}
                </div>
              </div>
              {/* Controls */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{admin.assignedServices} ({assigned.length})</span><button type="button" onClick={() => setSelAssigned(new Set(assigned.map(s => s._id)))} className="text-xs text-red-600">{admin.selectAll}</button></div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700">
                  {assigned.length === 0 ? <p className="text-center text-xs text-gray-400 p-4">{admin.noServicesAssigned}</p>
                    : assigned.map(s => (
                      <div key={s._id} onClick={() => setSelAssigned(prev => { const n = new Set(prev); n.has(s._id) ? n.delete(s._id) : n.add(s._id); return n })}
                        className={cn('px-3 py-2 cursor-pointer text-xs transition-colors', selAssigned.has(s._id) ? 'bg-red-50 dark:bg-red-900/20 text-red-600 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300')}>
                        {s.name.en}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={handleUnassign} disabled={savingAssign || selAssigned.size === 0}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40">
                <ArrowLeft className="h-3.5 w-3.5" /> {admin.unassignSelected}
              </button>
              <button onClick={handleAssign} disabled={savingAssign || selAvail.size === 0}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-40">
                {savingAssign && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {admin.assignSelected} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{confirmDelete && <ConfirmDialog msg="Delete this window? Its services will be unassigned." onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}</AnimatePresence>
    </div>
  )
}

// ── SERVICES + REQUIREMENTS TAB ──────────────────────────────────────────────
function ServicesTab() {
  const { language, t } = useLanguage()
  const admin = t.admin
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [windows, setWindows] = useState<any[]>([])
  const [services, setServices] = useState<ServiceAdmin[]>([])
  const [requirements, setRequirements] = useState<RequirementAdmin[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedWindow, setSelectedWindow] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [pasteLanguage, setPasteLanguage] = useState<'en' | 'am' | 'or'>('en')
  const [pasteTexts, setPasteTexts] = useState({ en: '', am: '', or: '' })
  const modalAdmin = translations[pasteLanguage].admin
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSvcForm, setShowSvcForm] = useState(false)
  const [showBulkSvcForm, setShowBulkSvcForm] = useState(false)
  const [bulkSvcTarget, setBulkSvcTarget] = useState<'office' | 'window'>('office')
  const [bulkSvcLanguage, setBulkSvcLanguage] = useState<'en' | 'am' | 'or'>('en')
  const [bulkSvcTexts, setBulkSvcTexts] = useState({ en: '', am: '', or: '' })
  const [savingBulkServices, setSavingBulkServices] = useState(false)
  const [editingSvc, setEditingSvc] = useState<ServiceAdmin | null>(null)
  const [svcForm, setSvcForm] = useState(emptyServiceForm)
  const [savingSvc, setSavingSvc] = useState(false)
  const [showReqForm, setShowReqForm] = useState(false)
  const [editingReq, setEditingReq] = useState<RequirementAdmin | null>(null)
  const [reqForm, setReqForm] = useState(emptyRequirementForm)
  const [savingReq, setSavingReq] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  const loadWindowsForOrg = async (organizationId?: string) => {
    try {
      setWindows(await getWindowsAdmin(organizationId))
    } catch {
      setWindows([])
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [orgData, svcData] = await Promise.all([getOrganizations(), getServicesAdmin()])
      setOrgs(orgData); setServices(svcData)
      await loadWindowsForOrg()
    } catch { setError('Failed to load data') } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [selectedOrg])

  const loadReqs = async (sid: string) => {
    try { setRequirements(await getRequirementsByService(sid)); setSelectedService(sid) }
    catch { setError('Failed to load requirements') }
  }

  const loadServices = async () => {
    try {
      const svcData = await getServicesAdmin()
      setServices(svcData)
    } catch { setError('Failed to reload services') }
  }

  const handleSaveSvc = async () => {
    const hasAllNames = langs.every(code => svcForm.name[code].trim())
    if (!svcForm.organization) {
      setError(admin.selectOffice)
      return
    }
    if (!hasAllNames) {
      setError('Enter the service name in English, Amharic, and Afaan Oromo')
      return
    }
    setSavingSvc(true); setError('')
    try {
      if (editingSvc) {
        await updateService(editingSvc._id, svcForm)
        setSuccess('Service updated!')
      } else {
        await createService(svcForm)
        setSuccess('Service created!')
      }
      setShowSvcForm(false); setEditingSvc(null); setSvcForm(emptyServiceForm)
      await loadServices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') } finally { setSavingSvc(false) }
  }

  const handleDeleteSvc = async (id: string) => {
    try {
      await deleteService(id)
      await loadServices()
      setSuccess('Service deleted!'); setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    setConfirmDelete(null)
  }

  const handleDeleteWindowServices = async (windowId: string) => {
    const windowServices = services.filter(service => {
      const serviceWindowId = typeof service.window === 'string' ? service.window : (service.window as any)?._id
      return serviceWindowId === windowId
    })

    setConfirmDelete(null)
    if (windowServices.length === 0) return

    setSavingBulkServices(true)
    setError('')
    try {
      const result = await deleteServicesByWindow(windowId)
      setSelectedService('')
      setRequirements([])
      setServices(current => current.filter(service => {
        const serviceWindowId = typeof service.window === 'string' ? service.window : (service.window as any)?._id
        return serviceWindowId !== windowId
      }))
      setSuccess(`${result.deletedCount} services removed from this window.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove window services')
    } finally {
      setSavingBulkServices(false)
    }
  }

  const handleBulkServiceSave = async () => {
    if ((bulkSvcTarget === 'office' && !selectedOrg) || (bulkSvcTarget === 'window' && !selectedWindow)) return
    const localizedServices = getLocalizedRows(bulkSvcTexts)
    if (localizedServices.length === 0) {
      setError('Paste at least one service')
      return
    }
    const window = windows.find(item => item._id === selectedWindow)
    const organization = bulkSvcTarget === 'office'
      ? selectedOrg
      : typeof window?.organization === 'string' ? window.organization : window?.organization?._id
    if (bulkSvcTarget === 'office' && !organization) {
      setError(admin.selectOffice)
      return
    }
    setSavingBulkServices(true)
    try {
      for (let index = 0; index < localizedServices.length; index += 1) {
        const name = localizedServices[index]
        try {
          await createService({
            name,
            description: { en: '', am: '', or: '' },
            ...(organization ? { organization } : {}),
            window: bulkSvcTarget === 'window' ? selectedWindow : null,
            requiredDocuments: [],
            fee: 0,
            processingTime: '',
            workingHours: '',
            contactPhone: '',
          })
        } catch (error) {
          const rowNumber = index + 1
          const message = error instanceof Error ? error.message : admin.failedToSave
          throw new Error(`Service ${rowNumber} (${name.en}) failed: ${message}`)
        }
      }
      setSuccess(admin.servicesAdded)
      setBulkSvcTexts({ en: '', am: '', or: '' })
      setShowBulkSvcForm(false)
      await loadServices()
    } catch (e) {
      setError(e instanceof Error ? e.message : admin.failedToSave)
    } finally {
      setSavingBulkServices(false)
    }
  }

  const handleSaveReq = async () => {
    if (!selectedService) return
    if (editingReq && !langs.every(code => reqForm.requirementText[code].trim())) {
      setError('Enter the requirement in English, Amharic, and Afaan Oromo')
      return
    }
    setSavingReq(true); setError('')
    try {
      if (editingReq) {
        await updateRequirement(editingReq._id, { ...reqForm, service: selectedService })
        setSuccess('Requirement updated!')
      } else {
        const localizedRequirements = getLocalizedRows(pasteTexts)
        if (localizedRequirements.length === 0) {
          setError('Paste at least one requirement')
          return
        }
        await Promise.all(localizedRequirements.map((requirementText, index) => createRequirement({
          ...emptyRequirementForm,
          requirementText,
          sequenceNo: index,
          service: selectedService,
        })))
        setSuccess(admin.requirementsAdded)
      }
      setShowReqForm(false); setEditingReq(null); setReqForm(emptyRequirementForm); setPasteTexts({ en: '', am: '', or: '' })
      // Reload fresh from server
      setRequirements(await getRequirementsByService(selectedService))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') } finally { setSavingReq(false) }
  }

  const handleDeleteReq = async (id: string) => {
    try {
      await deleteRequirement(id)
      setRequirements(await getRequirementsByService(selectedService))
      setSuccess('Requirement deleted!'); setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    setConfirmDelete(null)
  }

  const filtered = services.filter(s => {
    const oid = typeof s.organization === 'string' ? s.organization : (s.organization as any)?._id
    const wid = typeof s.window === 'string' ? s.window : (s.window as any)?._id
    if (selectedWindow) return wid === selectedWindow
    if (selectedOrg) return oid === selectedOrg
    return true
  })

  const officeServices = services.filter(service => {
    const organizationId = typeof service.organization === 'string' ? service.organization : (service.organization as any)?._id
    return organizationId === selectedOrg
  })

  return (
    <div>
      <AnimatePresence>{success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 text-sm"><CheckCircle className="h-4 w-4" />{success}</motion.div>}</AnimatePresence>
      {error && <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{admin.offices}</label>
          <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
            <option value="">{admin.selectOffice}</option>
            {orgs.map(o => <option key={o._id} value={o._id}>{o.name[language] || o.name.en}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{admin.windowsTab}</label>
          <select value={selectedWindow} onChange={e => setSelectedWindow(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
            <option value="">{admin.allWindowsAdmin}</option>
            {[...windows].sort((a: any, b: any) => Number(a.number) - Number(b.number)).map((w: any) => <option key={w._id} value={w._id}>{w.number} - {w.name?.[language] || w.name?.en || `${admin.windowLabel} ${w.number}`}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditingSvc(null); setSvcForm({ ...emptyServiceForm, organization: selectedOrg }); setShowSvcForm(true) }}
          className="flex items-end justify-center gap-2 self-end px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green/90">
          <Plus className="h-4 w-4" /> {admin.newServiceAdmin}
        </button>
      </div>

      {selectedOrg && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{admin.offices}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{orgs.find(org => org._id === selectedOrg)?.name[language] || orgs.find(org => org._id === selectedOrg)?.name.en}</p>
              <p className="text-xs text-gray-500">{officeServices.length} {admin.servicesLabel}</p>
            </div>
            <button type="button" onClick={() => { setBulkSvcTarget('office'); setBulkSvcTexts({ en: '', am: '', or: '' }); setShowBulkSvcForm(true) }} className="flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> {admin.bulkServices}
            </button>
          </div>
        </div>
      )}

      {selectedWindow && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green/30 bg-brand-green/5 p-4 dark:bg-brand-green/10">
          <div>
            <p className="text-xs text-gray-500">{admin.windowLabel}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{windows.find(window => window._id === selectedWindow)?.name?.[language] || `${admin.windowLabel} ${windows.find(window => window._id === selectedWindow)?.number || ''}`}</p>
            <p className="text-xs text-gray-500">{filtered.length} {admin.servicesLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setBulkSvcTarget('window'); setBulkSvcTexts({ en: '', am: '', or: '' }); setShowBulkSvcForm(true) }} className="flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> {admin.bulkServices}
            </button>
            <button type="button" onClick={() => setConfirmDelete({ type: 'window-services', id: selectedWindow })} disabled={filtered.length === 0 || savingBulkServices}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 className="h-4 w-4" /> Remove all services
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-brand-green" /></div> : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{admin.noServicesFoundAdmin}</p>}
          {filtered.map(svc => (
            <div key={svc._id} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0"><FileText className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{svc.name[language] || svc.name.en}</p>
                  <p className="text-xs text-gray-500">{svc.name.en}</p>
                  <p className="text-xs text-gray-400">{typeof svc.window === 'object' && svc.window ? `${admin.windowLabel} ${(svc.window as any).number} (${admin.floor} ${(svc.window as any).floor})` : admin.noWindow}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => loadReqs(svc._id)} title={admin.manageRequirements} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green"><List className="h-4 w-4" /></button>
                  <button onClick={() => { setEditingSvc(svc); setSvcForm({ name: { ...svc.name }, description: { ...svc.description }, organization: typeof svc.organization === 'string' ? svc.organization : (svc.organization as any)?._id || '', window: typeof svc.window === 'string' ? svc.window : (svc.window as any)?._id || '', requiredDocuments: svc.requiredDocuments || [], fee: svc.fee, processingTime: svc.processingTime, workingHours: svc.workingHours, contactPhone: svc.contactPhone }); setShowSvcForm(true) }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => setConfirmDelete({ type: 'service', id: svc._id })} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {/* Requirements inline */}
              {selectedService === svc._id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">{admin.requirementsLabel}</h4>
                    <button onClick={() => { setEditingReq(null); setPasteLanguage(language); setPasteTexts({ en: '', am: '', or: '' }); setShowReqForm(true) }} className="text-xs text-brand-green hover:text-brand-green/80 font-medium">+ {admin.addRequirementInline}</button>
                  </div>
                  {requirements.length === 0 ? <p className="text-xs text-gray-400">{admin.noRequirementsYetAdmin}</p> : (
                    <div className="space-y-2">
                      {requirements.map(req => (
                        <div key={req._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <span className={cn('w-2 h-2 rounded-full shrink-0', req.isMandatory ? 'bg-brand-green' : 'bg-gray-400')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 dark:text-gray-200 truncate">{req.requirementText.en}</p>
                            <p className="text-xs text-gray-500 truncate">{req.requirementText.or}</p>
                          </div>
                          <span className="text-xs text-gray-400">#{req.sequenceNo}</span>
                          <button onClick={() => { setEditingReq(req); setReqForm({ requirementText: { ...req.requirementText }, notes: { ...req.notes }, isMandatory: req.isMandatory, sequenceNo: req.sequenceNo }); setShowReqForm(true) }} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setConfirmDelete({ type: 'requirement', id: req._id })} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
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

      {/* Service Form Modal */}
      <AnimatePresence>{showSvcForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowSvcForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingSvc ? admin.editService : admin.newServiceAdmin}</h3>
              <button onClick={() => setShowSvcForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <LangFields label={admin.serviceName} value={svcForm.name} onChange={v => setSvcForm(f => ({ ...f, name: v }))} />
              <LangFields label={admin.description} value={svcForm.description} onChange={v => setSvcForm(f => ({ ...f, description: v }))} />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">{admin.offices}</label>
                <select
                  value={svcForm.organization}
                  onChange={async e => {
                    const orgId = e.target.value
                    setSvcForm(f => ({ ...f, organization: orgId, window: '' }))
                    await loadWindowsForOrg()
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <option value="">{admin.selectOffice}</option>
                  {orgs.map(o => <option key={o._id} value={o._id}>{o.name.en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">{admin.windowLabel} ({t.requirements.optional})</label>
                <select value={svcForm.window} onChange={e => setSvcForm(f => ({ ...f, window: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  disabled={!svcForm.organization || windows.length === 0}
                >
                  <option value="">{!svcForm.organization ? admin.chooseOfficeFirst : windows.length === 0 ? admin.noWindowsOffice : admin.noWindow}</option>
                  {windows.map((w: any) => <option key={w._id} value={w._id}>Window {w.number} (Floor {w.floor})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowSvcForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{admin.cancel}</button>
              <button onClick={handleSaveSvc} disabled={savingSvc} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                {savingSvc && <Loader2 className="h-4 w-4 animate-spin" />} {admin.save}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{showBulkSvcForm && ((bulkSvcTarget === 'office' && selectedOrg) || (bulkSvcTarget === 'window' && selectedWindow)) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulkSvcForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{translations[bulkSvcLanguage].admin.bulkServices}</h3>
                <p className="mt-1 text-sm font-medium text-brand-green">
                  {bulkSvcTarget === 'office'
                    ? orgs.find(org => org._id === selectedOrg)?.name?.[bulkSvcLanguage] || ''
                    : windows.find(window => window._id === selectedWindow)?.name?.[bulkSvcLanguage] || ''}
                </p>
              </div>
              <button type="button" onClick={() => setShowBulkSvcForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-xs text-gray-500">{translations[bulkSvcLanguage].admin.bulkServicesHint}</p>
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
              <div className="grid gap-3">
                {langs.map(code => (
                  <label key={code} className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                    {code === 'en' ? 'English' : code === 'am' ? 'Amharic' : 'Afaan Oromo'}
                    <textarea value={bulkSvcTexts[code]} onChange={event => setBulkSvcTexts(previous => ({ ...previous, [code]: event.target.value }))} rows={4} placeholder={translations[code].admin.bulkServicesHint} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal dark:border-gray-600 dark:bg-gray-900" />
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowBulkSvcForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">{translations[bulkSvcLanguage].admin.cancel}</button>
              <button type="button" onClick={handleBulkServiceSave} disabled={savingBulkServices || !langs.some(code => bulkSvcTexts[code].trim())} className="flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {savingBulkServices && <Loader2 className="h-4 w-4 animate-spin" />} {translations[bulkSvcLanguage].admin.saveAllServices}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Requirement Form Modal */}
      <AnimatePresence>{showReqForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowReqForm(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingReq ? modalAdmin.editRequirement : modalAdmin.newRequirement}</h3>
                {!editingReq && <p className="mt-1 text-sm font-medium text-brand-green">{services.find(service => service._id === selectedService)?.name[pasteLanguage] || ''}</p>}
              </div>
              <button onClick={() => setShowReqForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {!editingReq && <p className="text-xs text-gray-500">{modalAdmin.addManyRequirements}</p>}
              {!editingReq && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-3 space-y-3">
                  <div className="grid gap-3">
                    {langs.map(code => (
                      <label key={code} className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {code === 'en' ? 'English' : code === 'am' ? 'Amharic' : 'Afaan Oromo'}
                        <textarea value={pasteTexts[code]} onChange={event => setPasteTexts(previous => ({ ...previous, [code]: event.target.value }))} rows={4} placeholder={modalAdmin.addManyRequirements} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal dark:border-gray-600 dark:bg-gray-900" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
                {editingReq && <div className="space-y-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <LangFields label={modalAdmin.requirementText} value={reqForm.requirementText} onChange={v => setReqForm(f => ({ ...f, requirementText: v }))} />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={reqForm.isMandatory} onChange={e => setReqForm(f => ({ ...f, isMandatory: e.target.checked }))} className="w-4 h-4 rounded text-brand-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{modalAdmin.mandatory}</span>
                  </label>
                </div>}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowReqForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">{modalAdmin.cancel}</button>
              <button onClick={handleSaveReq} disabled={savingReq || (!editingReq && !langs.some(code => pasteTexts[code].trim()))} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                {savingReq && <Loader2 className="h-4 w-4 animate-spin" />} {editingReq ? modalAdmin.save : modalAdmin.saveAllRequirements}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{confirmDelete && (
        <ConfirmDialog
          msg={confirmDelete.type === 'service'
            ? 'Delete this service and all its requirements?'
            : confirmDelete.type === 'window-services'
              ? 'Remove all services listed under this window? Their requirements will also be deleted.'
              : 'Delete this requirement?'}
          onConfirm={() => confirmDelete.type === 'service'
            ? handleDeleteSvc(confirmDelete.id)
            : confirmDelete.type === 'window-services'
              ? handleDeleteWindowServices(confirmDelete.id)
              : handleDeleteReq(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}</AnimatePresence>
    </div>
  )
}

// ── Main AdminServices with Tabs ─────────────────────────────────────────────
const TABS = [
  { key: 'floors',   label: 'Floors',   icon: Layers    },
  { key: 'windows',  label: 'Windows',  icon: DoorOpen  },
  { key: 'offices',  label: 'Offices',  icon: Building2 },
  { key: 'services', label: 'Services & Requirements', icon: Wrench },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminServices() {
  const { t } = useLanguage()
  const admin = t.admin
  const [activeTab, setActiveTab] = useState<TabKey>('services')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.servicesManagement}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {admin.floorsDescription}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-brand-green text-brand-green dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.key === 'floors' ? admin.floorsTab : tab.key === 'windows' ? admin.windowsTab : tab.key === 'offices' ? admin.offices : admin.servicesRequirementsTab}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'floors'   && <FloorsTab />}
          {activeTab === 'windows'  && <WindowsTab />}
          {activeTab === 'offices'  && <OfficesTab />}
          {activeTab === 'services' && <ServicesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
