import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react'
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization, type OrganizationSummary } from '@/api/admin'
import { cn } from '@/lib/utils'

const emptyForm = { name: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, logoUrl: '' }

export default function AdminOrganizations() {
  const [items, setItems] = useState<OrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrganizationSummary | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    getOrganizations()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search ? items.filter(i => i.name.en.toLowerCase().includes(search.toLowerCase())) : items

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      if (editing) {
        const updated = await updateOrganization(editing._id, form)
        setItems(prev => prev.map(i => i._id === editing._id ? updated : i))
        setSuccess('Organization updated!')
      } else {
        const created = await createOrganization(form)
        setItems(prev => [created, ...prev])
        setSuccess('Organization created!')
      }
      setShowForm(false); setEditing(null); setForm(emptyForm)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id)
      setItems(prev => prev.filter(i => i._id !== id))
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage offices and departments</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
          <Plus className="h-4 w-4" /> New Organization
        </motion.button>
      </div>
      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm"><CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span></motion.div>}</AnimatePresence>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
      </div>
      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
      {error && <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}
      {!loading && !error && filtered.length === 0 && <div className="text-center py-12 text-gray-500 dark:text-gray-400"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No organizations found</p></div>}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0"><Building2 className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{item.name.en}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.serviceCount || 0} services</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditing(item); setForm({ name: { ...item.name }, description: { ...item.description }, logoUrl: item.logoUrl }); setShowForm(true) }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDelete(item._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit Organization' : 'New Organization'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {(['en', 'am', 'or'] as const).map(lang => (
                <div key={lang}><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name ({lang.toUpperCase()})</label>
                <input value={form.name[lang]} onChange={e => setForm(f => ({ ...f, name: { ...f.name, [lang]: e.target.value } }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
              ))}
              {(['en', 'am', 'or'] as const).map(lang => (
                <div key={lang}><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description ({lang.toUpperCase()})</label>
                <textarea value={form.description[lang]} onChange={e => setForm(f => ({ ...f, description: { ...f.description, [lang]: e.target.value } }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" /></div>
              ))}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <AnimatePresence>{confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Organization?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This will also delete associated services.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}