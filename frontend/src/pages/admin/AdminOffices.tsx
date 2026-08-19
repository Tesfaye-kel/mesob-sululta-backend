import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Edit3, Trash2, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronRight, X } from 'lucide-react'
import {
  getOrganizations, createOrganization, updateOrganization, deleteOrganization,
  getWindowsAdmin, getFloorsAdmin, getServicesAdmin,
  type OrganizationSummary,
} from '@/api/admin'
import { cn } from '@/lib/utils'

const langs = ['en', 'am', 'or'] as const

const emptyOrgForm = { name: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, logoUrl: '', displayOrder: 0 }

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

function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminOffices() {
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrganizationSummary | null>(null)
  const [form, setForm] = useState(emptyOrgForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setOrgs(await getOrganizations())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const payload = { name: form.name, description: form.description, logoUrl: form.logoUrl, displayOrder: form.displayOrder }
        await updateOrganization(editing._id, payload)
        setSuccess('Organization updated!')
      } else {
        const payload = { name: form.name, description: form.description, logoUrl: form.logoUrl, displayOrder: form.displayOrder }
        await createOrganization(payload)
        setSuccess('Organization created!')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyOrgForm)
      setOrgs(await getOrganizations())
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id)
      setOrgs(await getOrganizations())
      setSuccess('Organization deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your office locations and their services</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setEditing(null); setForm(emptyOrgForm); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
          <Plus className="h-4 w-4" /> New Office
        </motion.button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
      </motion.div>}</AnimatePresence>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
      {error && <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {!loading && !error && orgs.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No offices found</p>
        </div>
      )}

      {!loading && !error && orgs.length > 0 && (
        <div className="space-y-3">
          {orgs.map((org, idx) => (
            <motion.div key={org._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                onClick={() => setExpandedOrg(expandedOrg === org._id ? null : org._id)}>
                <div className="flex items-center gap-3 flex-1">
                  <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    {expandedOrg === org._id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{org.name.en}</p>
                    <p className="text-xs text-gray-500">{org.name.am} · {org.name.or}</p>
                    <p className="text-xs text-gray-400">{org.serviceCount ?? 0} services</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditing(org)
                      setForm({ name: { ...org.name }, description: { ...org.description }, logoUrl: org.logoUrl || '', displayOrder: org.displayOrder ?? 0 })
                      setShowForm(true)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(org._id) }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedOrg === org._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    {org.description?.en && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{org.description.en}</p>}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-semibold">English Name:</span> {org.name.en}</p>
                      <p><span className="font-semibold">Amharic Name:</span> {org.name.am}</p>
                      <p><span className="font-semibold">Oromo Name:</span> {org.name.or}</p>
                      {org.logoUrl && <p><span className="font-semibold">Logo URL:</span> {org.logoUrl}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Office' : 'New Office'}</h2>
                <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <LangFields label="Office Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <LangFields label="Description (optional)" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Logo URL (optional)</label>
                  <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Display Order (Position on Frontend)</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first. Default: 0</p>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && <ConfirmDialog msg="Are you sure you want to delete this office?" onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}
      </AnimatePresence>
    </div>
  )
}
