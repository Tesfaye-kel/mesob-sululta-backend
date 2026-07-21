import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, Search, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Upload, Image as ImageIcon, Video, Music, FileText } from 'lucide-react'
import type { NewsMedia } from '@/api/admin'
import { getNewsList, createNews, updateNews, deleteNews, type NewsItem } from '@/api/admin'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const categories = ['news', 'notice', 'event', 'holiday', 'press', 'update']

const emptyForm = {
  title: { en: '', am: '', or: '' },
  content: { en: '', am: '', or: '' },
  excerpt: { en: '', am: '', or: '' },
  category: 'news',
  isFeatured: false,
  isPublished: true,
  coverImageUrl: '',
  media: [] as NewsMedia[],
  tags: [] as string[],
}

export default function AdminNews() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadItems = () => {
    setLoading(true)
    setError('')
    const params = search ? `search=${encodeURIComponent(search)}` : ''
    getNewsList(params)
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadItems() }, [])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const token = localStorage.getItem('admin-token')
      const formData = new FormData()
      formData.append('media', file)

      const res = await fetch(`${BASE}/news/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      
      // Determine media type from file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      let mediaType = 'image'
      if (['mp4', 'webm', 'ogg'].includes(ext)) mediaType = 'video'
      else if (['mp3', 'wav', 'aac'].includes(ext)) mediaType = 'audio'
      else if (['pdf', 'doc', 'docx'].includes(ext)) mediaType = 'document'

      // Add to form.media array
      setForm(f => ({
        ...f,
        media: [...f.media, { type: mediaType as 'image' | 'video' | 'audio' | 'document' | 'other', url: data.url, caption: { en: '', am: '', or: '' } }],
      }))
      
      // If no cover image yet, set it as cover
      if (!form.coverImageUrl && mediaType === 'image') {
        setForm(f => ({ ...f, coverImageUrl: data.url }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        tags: form.tags.filter(t => t.trim()),
      }
      
      if (editing) {
        const updated = await updateNews(editing._id, payload)
        setItems(prev => prev.map(i => i._id === editing._id ? updated : i))
        setSuccess('News updated successfully!')
      } else {
        const created = await createNews(payload)
        setItems(prev => [created, ...prev])
        setSuccess('News created successfully!')
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
      await deleteNews(id)
      setItems(prev => prev.filter(i => i._id !== id))
      setSuccess('News deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item: NewsItem) => {
    setEditing(item)
    setForm({
      title: { ...item.title },
      content: { ...item.content },
      excerpt: item.excerpt || { en: '', am: '', or: '' },
      category: item.category,
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
      coverImageUrl: item.coverImageUrl || '',
      media: item.media || [],
      tags: item.tags || [],
    })
    setShowForm(true)
  }

  const removeMedia = (index: number) => {
    setForm(f => ({ ...f, media: f.media.filter((_, i) => i !== index) }))
  }

  const filtered = search
    ? items.filter(i =>
        i.title.en.toLowerCase().includes(search.toLowerCase()) ||
        i.title.am.includes(search) ||
        i.title.or.includes(search) ||
        i.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : items

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publish news, updates, and media-rich content</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
          <Plus className="h-4 w-4" /> New Post
        </motion.button>
      </div>

      <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
      </motion.div>}</AnimatePresence>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search news..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}
      {error && !loading && <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No news posts found</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              {item.coverImageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                  <img src={item.coverImageUrl.startsWith('http') ? item.coverImageUrl : `${BASE.replace('/api', '')}${item.coverImageUrl}`}
                    alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    item.category === 'news' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    item.category === 'notice' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    item.category === 'event' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    item.category === 'holiday' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    item.category === 'press' && 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                    item.category === 'update' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                  )}>
                    {item.category}
                  </span>
                  {item.isFeatured && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">Featured</span>}
                  {!item.isPublished && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>}
                  {item.media?.length > 0 && <span className="text-xs text-gray-400">{item.media.length} media</span>}
                </div>
                <p className="font-medium text-gray-900 dark:text-white truncate">{item.title.en}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(item.publishedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDelete(item._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
            className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit News Post' : 'New News Post'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Title */}
              {(['en', 'am', 'or'] as const).map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title ({lang.toUpperCase()})</label>
                  <input value={form.title[lang]} onChange={e => setForm(f => ({ ...f, title: { ...f.title, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}

              {/* Content */}
              {(['en', 'am', 'or'] as const).map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content ({lang.toUpperCase()})</label>
                  <textarea value={form.content[lang]} onChange={e => setForm(f => ({ ...f, content: { ...f.content, [lang]: e.target.value } }))} rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}

              {/* Excerpt */}
              {(['en', 'am', 'or'] as const).map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt ({lang.toUpperCase()}) <span className="text-gray-400 font-normal">(short summary, optional)</span></label>
                  <textarea value={form.excerpt[lang]} onChange={e => setForm(f => ({ ...f, excerpt: { ...f.excerpt, [lang]: e.target.value } }))} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Cover'}</span>
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      try {
                        const token = localStorage.getItem('admin-token')
                        const fd = new FormData()
                        fd.append('media', file)
                        const res = await fetch(`${BASE}/news/upload`, {
                          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
                        })
                        if (!res.ok) throw new Error('Upload failed')
                        const data = await res.json()
                        setForm(f => ({ ...f, coverImageUrl: data.url }))
                      } catch (err) {
                        setError('Upload failed')
                      } finally { setUploading(false) }
                    }} className="hidden" />
                  </label>
                  {form.coverImageUrl && (
                    <button onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))} className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
                {form.coverImageUrl && (
                  <img src={form.coverImageUrl.startsWith('http') ? form.coverImageUrl : `${BASE.replace('/api', '')}${form.coverImageUrl}`}
                    alt="Cover preview" className="mt-2 w-48 h-32 object-cover rounded-lg" />
                )}
              </div>

              {/* Media Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media Gallery</label>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-fit">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Uploading...' : 'Add Media (Image/Video/Audio)'}</span>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={handleMediaUpload} className="hidden" disabled={uploading} />
                </label>
                {form.media.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {form.media.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {m.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />}
                        {m.type === 'video' && <Video className="h-5 w-5 text-purple-500 shrink-0" />}
                        {m.type === 'audio' && <Music className="h-5 w-5 text-green-500 shrink-0" />}
                        {m.type === 'document' && <FileText className="h-5 w-5 text-amber-500 shrink-0" />}
                        <span className="text-xs text-gray-500 truncate flex-1">{m.url.split('/').pop()}</span>
                        <button onClick={() => removeMedia(i)} className="p-1 text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{form.isPublished ? 'Published' : 'Draft'}</span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                <div className="flex items-center gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  <button onClick={addTag} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Update' : 'Publish'}</button>
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete News Post?</h3>
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