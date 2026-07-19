import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Heart, Award, Eye, TrendingUp, Target, History } from 'lucide-react'
import { getAbout, updateAbout, addAboutStory, updateAboutStory, deleteAboutStory, addAboutValue, updateAboutValue, deleteAboutValue, addAboutStat, updateAboutStat, deleteAboutStat, type AboutContent, type AboutStory, type AboutValue, type AboutStat } from '@/api/admin'

const langs = ['en', 'am', 'or'] as const

const fields = ['mission', 'vision', 'objectives', 'branchIntroduction', 'history'] as const

const fieldLabels: Record<string, string> = {
  mission: 'Mission',
  vision: 'Vision',
  objectives: 'Objectives',
  branchIntroduction: 'Branch Introduction',
  history: 'History',
}

const iconOptions = ['Heart', 'Award', 'Eye', 'TrendingUp', 'Target', 'History']

const iconMap: Record<string, React.ReactNode> = {
  Heart: <Heart className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  History: <History className="h-4 w-4" />,
}

const emptyStory = { paragraph: { en: '', am: '', or: '' }, order: 0 }
const emptyValue = { icon: 'Heart', title: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, order: 0 }
const emptyStat = { value: '', label: { en: '', am: '', or: '' }, order: 0 }

export default function AdminAbout() {
  const [data, setData] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<Record<string, { en: string; am: string; or: string }>>({})

  // Manager message form
  const [managerForm, setManagerForm] = useState({ managerName: '', managerMessage: { en: '', am: '', or: '' }, managerTitle: { en: '', am: '', or: '' } })

  // Story modal
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [editingStory, setEditingStory] = useState<AboutStory | null>(null)
  const [storyForm, setStoryForm] = useState(emptyStory)

  // Value modal
  const [showValueForm, setShowValueForm] = useState(false)
  const [editingValue, setEditingValue] = useState<AboutValue | null>(null)
  const [valueForm, setValueForm] = useState(emptyValue)

  // Stat modal
  const [showStatForm, setShowStatForm] = useState(false)
  const [editingStat, setEditingStat] = useState<AboutStat | null>(null)
  const [statForm, setStatForm] = useState(emptyStat)

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  useEffect(() => {
    getAbout()
      .then((d) => {
        setData(d)
        const init: Record<string, { en: string; am: string; or: string }> = {}
        fields.forEach(f => {
          init[f] = { en: d[f]?.en || '', am: d[f]?.am || '', or: d[f]?.or || '' }
        })
        setForm(init)
        setManagerForm({
          managerName: d.managerName || '',
          managerMessage: { en: d.managerMessage?.en || '', am: d.managerMessage?.am || '', or: d.managerMessage?.or || '' },
          managerTitle: { en: d.managerTitle?.en || '', am: d.managerTitle?.am || '', or: d.managerTitle?.or || '' },
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateAbout({ ...form, ...managerForm })
      setData(updated)
      setSuccess('About content updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Story CRUD
  const handleSaveStory = async () => {
    try {
      if (editingStory && editingStory._id) {
        const updated = await updateAboutStory(editingStory._id, storyForm)
        setData(updated)
      } else {
        const updated = await addAboutStory(storyForm)
        setData(updated)
      }
      setShowStoryForm(false)
      setEditingStory(null)
      setStoryForm(emptyStory)
      setSuccess('Story saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story')
    }
  }

  const handleDeleteStory = async (id: string) => {
    try {
      await deleteAboutStory(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess('Story deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Value CRUD
  const handleSaveValue = async () => {
    try {
      if (editingValue && editingValue._id) {
        const updated = await updateAboutValue(editingValue._id, valueForm)
        setData(updated)
      } else {
        const updated = await addAboutValue(valueForm)
        setData(updated)
      }
      setShowValueForm(false)
      setEditingValue(null)
      setValueForm(emptyValue)
      setSuccess('Value saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save value')
    }
  }

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteAboutValue(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess('Value deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Stat CRUD
  const handleSaveStat = async () => {
    try {
      if (editingStat && editingStat._id) {
        const updated = await updateAboutStat(editingStat._id, statForm)
        setData(updated)
      } else {
        const updated = await addAboutStat(statForm)
        setData(updated)
      }
      setShowStatForm(false)
      setEditingStat(null)
      setStatForm(emptyStat)
      setSuccess('Stat saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stat')
    }
  }

  const handleDeleteStat = async (id: string) => {
    try {
      await deleteAboutStat(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess('Stat deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About Content</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all About section content</p>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Text Fields ── */}
      <div className="space-y-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Main Content</h2>
        {fields.map(field => (
          <motion.div key={field} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">{fieldLabels[field]}</h3>
            <div className="space-y-3">
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">{lang}</label>
                  <textarea
                    value={form[field]?.[lang] || ''}
                    onChange={e => setForm(f => ({ ...f, [field]: { ...f[field], [lang]: e.target.value } }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                    placeholder={`${fieldLabels[field]} in ${lang}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Story Section ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Story / History Paragraphs</h2>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingStory(null); setStoryForm(emptyStory); setShowStoryForm(true) }}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Story
          </motion.button>
        </div>
        <div className="space-y-2">
          {data?.story?.length === 0 && <p className="text-sm text-gray-400">No story paragraphs added yet.</p>}
          {data?.story?.map((story, idx) => (
            <motion.div key={story._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-400 w-6 shrink-0">#{story.order}</span>
              <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{story.paragraph.en}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingStory(story); setStoryForm({ paragraph: { ...story.paragraph }, order: story.order }); setShowStoryForm(true) }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => story._id && setConfirmDelete({ type: 'story', id: story._id })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Values Section ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Core Values</h2>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingValue(null); setValueForm(emptyValue); setShowValueForm(true) }}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Value
          </motion.button>
        </div>
        <div className="space-y-2">
          {data?.values?.length === 0 && <p className="text-sm text-gray-400">No values added yet.</p>}
          {data?.values?.map((val, idx) => (
            <motion.div key={val._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <span className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                {iconMap[val.icon] || <Heart className="h-4 w-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{val.title.en}</p>
                <p className="text-xs text-gray-500 truncate">{val.description.en}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingValue(val); setValueForm({ icon: val.icon, title: { ...val.title }, description: { ...val.description }, order: val.order }); setShowValueForm(true) }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => val._id && setConfirmDelete({ type: 'value', id: val._id })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Stats Section ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h2>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingStat(null); setStatForm(emptyStat); setShowStatForm(true) }}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Stat
          </motion.button>
        </div>
        <div className="space-y-2">
          {data?.stats?.length === 0 && <p className="text-sm text-gray-400">No stats added yet.</p>}
          {data?.stats?.map((stat, idx) => (
            <motion.div key={stat._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <span className="text-lg font-bold text-brand-green w-12 shrink-0">{stat.value}</span>
              <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{stat.label.en}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingStat(stat); setStatForm({ value: stat.value, label: { ...stat.label }, order: stat.order }); setShowStatForm(true) }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => stat._id && setConfirmDelete({ type: 'stat', id: stat._id })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Manager Message ── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Manager Message</h2>
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager Name</label>
            <input value={managerForm.managerName} onChange={e => setManagerForm(f => ({ ...f, managerName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          {langs.map(lang => (
            <div key={lang}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager Title ({lang.toUpperCase()})</label>
              <input value={managerForm.managerTitle[lang]} onChange={e => setManagerForm(f => ({ ...f, managerTitle: { ...f.managerTitle, [lang]: e.target.value } }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
            </div>
          ))}
          {langs.map(lang => (
            <div key={lang}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message ({lang.toUpperCase()})</label>
              <textarea value={managerForm.managerMessage[lang]} onChange={e => setManagerForm(f => ({ ...f, managerMessage: { ...f.managerMessage, [lang]: e.target.value } }))} rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save All Changes
        </button>
      </div>

      {/* ── Story Form Modal ── */}
      <AnimatePresence>{showStoryForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowStoryForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingStory ? 'Edit Story' : 'Add Story'}</h2>
              <button onClick={() => setShowStoryForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paragraph ({lang.toUpperCase()})</label>
                  <textarea value={storyForm.paragraph[lang]} onChange={e => setStoryForm(f => ({ ...f, paragraph: { ...f.paragraph, [lang]: e.target.value } }))} rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                <input type="number" value={storyForm.order} onChange={e => setStoryForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowStoryForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveStory} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingStory ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Value Form Modal ── */}
      <AnimatePresence>{showValueForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowValueForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingValue ? 'Edit Value' : 'Add Value'}</h2>
              <button onClick={() => setShowValueForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <select value={valueForm.icon} onChange={e => setValueForm(f => ({ ...f, icon: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  {iconOptions.map(ico => <option key={ico} value={ico}>{ico}</option>)}
                </select>
              </div>
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title ({lang.toUpperCase()})</label>
                  <input value={valueForm.title[lang]} onChange={e => setValueForm(f => ({ ...f, title: { ...f.title, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description ({lang.toUpperCase()})</label>
                  <textarea value={valueForm.description[lang]} onChange={e => setValueForm(f => ({ ...f, description: { ...f.description, [lang]: e.target.value } }))} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                <input type="number" value={valueForm.order} onChange={e => setValueForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowValueForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveValue} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingValue ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Stat Form Modal ── */}
      <AnimatePresence>{showStatForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingStat ? 'Edit Stat' : 'Add Stat'}</h2>
              <button onClick={() => setShowStatForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value (e.g. 50+, 98%)</label>
                <input value={statForm.value} onChange={e => setStatForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              {langs.map(lang => (
                <div key={lang}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label ({lang.toUpperCase()})</label>
                  <input value={statForm.label[lang]} onChange={e => setStatForm(f => ({ ...f, label: { ...f.label, [lang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                <input type="number" value={statForm.order} onChange={e => setStatForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowStatForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveStat} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingStat ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Delete Confirmation ── */}
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
                if (confirmDelete.type === 'story') handleDeleteStory(confirmDelete.id)
                else if (confirmDelete.type === 'value') handleDeleteValue(confirmDelete.id)
                else if (confirmDelete.type === 'stat') handleDeleteStat(confirmDelete.id)
              }} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}