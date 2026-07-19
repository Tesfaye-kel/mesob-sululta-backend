import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Mail, Trash2, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { getContactMessages, markContactMessageRead, deleteContactMessage, type ContactMessage } from '@/api/admin'
import { cn } from '@/lib/utils'

export default function AdminContactMessages() {
  const [items, setItems] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'all' | 'contact' | 'feedback'>('all')
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadItems = () => {
    setLoading(true)
    setError('')
    const params = filter !== 'all' ? `type=${filter}` : ''
    getContactMessages(params)
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadItems() }, [filter])

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markContactMessageRead(id)
      setItems(prev => prev.map(i => i._id === id ? updated : i))
      if (selected?._id === id) setSelected(updated)
    } catch (err) {
      setError('Failed to mark as read')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContactMessage(id)
      setItems(prev => prev.filter(i => i._id !== id))
      if (selected?._id === id) setSelected(null)
      setSuccess('Message deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  const unreadCount = items.filter(i => !i.isRead).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All messages read'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" /><span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'contact', 'feedback'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
              filter === f ? 'bg-brand-green text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
            {f}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No messages found</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {items.map((msg, idx) => (
              <motion.div key={msg._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                onClick={() => setSelected(msg)}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all',
                  selected?._id === msg._id
                    ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600',
                  !msg.isRead && 'border-l-4 border-l-brand-green'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', msg.isRead ? 'bg-gray-300' : 'bg-brand-green')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{msg.name}</span>
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
                        msg.type === 'feedback' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                        {msg.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{msg.subject || msg.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detail */}
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 max-h-[70vh] overflow-y-auto">
            {selected ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                  <div className="flex items-center gap-1">
                    {!selected.isRead && (
                      <button onClick={() => handleMarkRead(selected._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-brand-green transition-colors"
                        title="Mark as read">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(selected._id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${selected.email}`} className="text-brand-green hover:underline">{selected.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                      selected.type === 'feedback' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                      {selected.type}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                  {selected.subject && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Subject</p>
                      <p className="text-gray-900 dark:text-white font-medium">{selected.subject}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>{confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Message?</h3>
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