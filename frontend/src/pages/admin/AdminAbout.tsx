import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { getAbout, updateAbout, type AboutContent } from '@/api/admin'

const langs = ['en', 'am', 'or'] as const

const fields = ['mission', 'vision', 'objectives', 'branchIntroduction', 'history'] as const

export default function AdminAbout() {
  const [data, setData] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<Record<string, { en: string; am: string; or: string }>>({})

  useEffect(() => {
    getAbout()
      .then((d) => {
        setData(d)
        const init: Record<string, { en: string; am: string; or: string }> = {}
        fields.forEach(f => {
          init[f] = { en: d[f]?.en || '', am: d[f]?.am || '', or: d[f]?.or || '' }
        })
        setForm(init)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateAbout(form)
      setData(updated)
      setSuccess('About content updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const fieldLabels: Record<string, string> = {
    mission: 'Mission',
    vision: 'Vision',
    objectives: 'Objectives',
    branchIntroduction: 'Branch Introduction',
    history: 'History',
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About Content</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage the About section content in all three languages</p>
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

      <div className="space-y-6">
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

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}