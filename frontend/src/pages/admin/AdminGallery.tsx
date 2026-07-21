import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Upload } from 'lucide-react'
import { getGalleryItemsList, createGalleryItem, updateGalleryItem, deleteGalleryItem, type GalleryItem } from '@/api/admin'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const categories = ['events', 'building', 'community', 'activities']
const langs = ['en', 'am', 'or'] as const

const emptyForm = {
  title: { en: '', am: '', or: '' },
  description: { en: '', am: '', or: '' },
  caption: { en: '', am: '', or: '' },
  imageUrl: '',
  category: 'events',
  order: 0,
}

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    getGalleryItemsList()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const token = localStorage.getItem('admin-token')
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`${BASE}/gallery/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setForm(f => ({ ...f, imageUrl: data.imageUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const updated = await updateGalleryItem(editing._id, form)
        setItems(prev => prev.map(i => i._id === editing._id ? updated : i))
        setSuccess('Gallery item updated!')
      } else {
        const created = await createGalleryItem(form)
        setItems(prev => [created, ...prev])
        setSuccess('Gallery item created!')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGalleryItem(id)
      setItems(prev => prev.filter(i => i._id !== id))
      setSuccess('Gallery item deleted!')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gallery</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage gallery images with captions and categories</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
          <Plus className="h-4 w-4" /> New Item
        </motion.button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
      </motion.div>}</AnimatePresence>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
      {error && <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No gallery items found</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <motion.div key={item._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
              className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
              {item.imageUrl ? (
                <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE.replace('/api', '')}${item.imageUrl}`} alt={item.title.en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-blue">
                  <Image className="h-10 w-10 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <p className="text-white text-sm font-semibold truncate">{item.title.en}</p>
                {item.caption?.en && <p className="text-white/60 text-xs truncate">{item.caption.en}</p>}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(item); setForm({ title: { ...item.title }, description: { ...item.description }, caption: { ...item.caption }, imageUrl: item.imageUrl, category: item.category, order: item.order }); setShowForm(true) }}
                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-700 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setConfirmDelete(item._id)}
                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 bg-black/40 text-white text-xs rounded-full backdrop-blur-sm">{item.category}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit Gallery Item' : 'New Gallery Item'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {form.imageUrl && (
                    <span className="text-xs text-gray-500 truncate flex-1">Image selected</span>
                  )}
                </div>
                {form.imageUrl && (
                  <img src={form.imageUrl.startsWith('http') ? form.imageUrl : `${BASE.replace('/api', '')}${form.imageUrl}`}
                    alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              {/* Title fields */}
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title ({lang.toUpperCase()})</label>
                  <input value={form.title[lang]} onChange={e => setForm(f => ({ ...f, title: { ...f.title, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}

              {/* Caption fields */}
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption ({lang.toUpperCase()})</label>
                  <input value={form.caption[lang]} onChange={e => setForm(f => ({ ...f, caption: { ...f.caption, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" placeholder="Short caption displayed over image" />
                </div>
              ))}

              {/* Description fields */}
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description ({lang.toUpperCase()})</label>
                  <textarea value={form.description[lang]} onChange={e => setForm(f => ({ ...f, description: { ...f.description, [lang]: e.target.value } }))} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.imageUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Update' : 'Create'}</button>
                </div>
                {!form.imageUrl && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-right mt-1">Please upload an image first</p>
                )}
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Gallery Item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
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