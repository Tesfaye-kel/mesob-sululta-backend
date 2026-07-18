import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { getContact, updateContact, type ContactContent } from '@/api/admin'

const langs = ['en', 'am', 'or'] as const

export default function AdminContact() {
  const [data, setData] = useState<ContactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    address: { en: '', am: '', or: '' },
    phone: '',
    email: '',
    workingHours: { en: '', am: '', or: '' },
    mapEmbedUrl: '',
  })

  useEffect(() => {
    getContact()
      .then((d) => {
        setData(d)
        setForm({
          address: { en: d.address?.en || '', am: d.address?.am || '', or: d.address?.or || '' },
          phone: d.phone || '',
          email: d.email || '',
          workingHours: { en: d.workingHours?.en || '', am: d.workingHours?.am || '', or: d.workingHours?.or || '' },
          mapEmbedUrl: d.mapEmbedUrl || '',
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateContact(form)
      setData(updated)
      setSuccess('Contact information updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Information</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage contact details, address, and working hours</p>
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
        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-brand-green" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Address</h3>
          </div>
          <div className="space-y-3">
            {langs.map(lang => (
              <div key={lang}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">{lang}</label>
                <input value={form.address[lang]} onChange={e => setForm(f => ({ ...f, address: { ...f.address, [lang]: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-brand-green" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Phone</h3>
            </div>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="+251 11 111 0000" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-brand-green" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
            </div>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="info@mesob-sululta.gov.et" />
          </motion.div>
        </div>

        {/* Working Hours */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-brand-green" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Working Hours</h3>
          </div>
          <div className="space-y-3">
            {langs.map(lang => (
              <div key={lang}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">{lang}</label>
                <input value={form.workingHours[lang]} onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, [lang]: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Map Embed URL */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-brand-green" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Map Embed URL</h3>
          </div>
          <input value={form.mapEmbedUrl} onChange={e => setForm(f => ({ ...f, mapEmbedUrl: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="https://maps.google.com/..." />
        </motion.div>
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