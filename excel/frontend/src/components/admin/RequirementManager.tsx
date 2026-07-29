import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Circle,
  GripVertical,
} from 'lucide-react'
import { useRequirementsAdmin } from '@/hooks/useRequirements'
import RequirementForm from '@/components/admin/RequirementForm'
import type { Requirement, CreateRequirementPayload } from '@/api/requirementsApi'
import { cn } from '@/lib/utils'

interface RequirementManagerProps {
  serviceId: string
  /** Shown in the panel heading */
  serviceNameEn?: string
}

export default function RequirementManager({ serviceId, serviceNameEn }: RequirementManagerProps) {
  const { requirements, loading, error, saving, add, edit, remove } =
    useRequirementsAdmin(serviceId)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Requirement | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  async function handleAdd(payload: CreateRequirementPayload) {
    await add(payload)
    setShowForm(false)
    flash('Requirement added.')
  }

  async function handleEdit(payload: CreateRequirementPayload) {
    if (!editTarget) return
    await edit(editTarget._id, payload)
    setEditTarget(undefined)
    flash('Requirement updated.')
  }

  async function handleDelete(id: string) {
    await remove(id)
    setDeleteConfirm(null)
    flash('Requirement deleted.')
  }

  const isFormVisible = showForm || Boolean(editTarget)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Requirements
            {serviceNameEn && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                — {serviceNameEn}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} configured
          </p>
        </div>

        {!isFormVisible && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/50"
            aria-label="Add new requirement"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Requirement
          </button>
        )}
      </div>

      {/* Global error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg px-4 py-3"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {/* Success flash */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg px-4 py-3"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form — add or edit */}
      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <RequirementForm
              serviceId={serviceId}
              existing={editTarget}
              saving={saving}
              onSubmit={editTarget ? handleEdit : handleAdd}
              onCancel={() => {
                setShowForm(false)
                setEditTarget(undefined)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-green" aria-label="Loading requirements" />
        </div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm">No requirements yet.</p>
          <p className="text-xs mt-1">Click "Add Requirement" to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Requirements list">
          <AnimatePresence initial={false}>
            {requirements.map((req) => (
              <motion.li
                key={req._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                  req.isMandatory
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/20'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                )}
              >
                {/* Drag handle (visual only) */}
                <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" aria-hidden />

                {/* Mandatory indicator */}
                {req.isMandatory ? (
                  <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5 shrink-0" aria-label="Mandatory" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" aria-label="Optional" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Three languages side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                      {req.requirementText.en}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug font-ethiopic">
                      {req.requirementText.am}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      {req.requirementText.or}
                    </span>
                  </div>

                  {/* Notes row (only if any language has a note) */}
                  {(req.notes.en || req.notes.am || req.notes.or) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{req.notes.en}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-ethiopic">{req.notes.am}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{req.notes.or}</span>
                    </div>
                  )}

                  {/* Meta pills */}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        req.isMandatory
                          ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {req.isMandatory ? 'Mandatory' : 'Optional'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      #{req.sequenceNo}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditTarget(req)
                      setShowForm(false)
                    }}
                    disabled={saving}
                    aria-label={`Edit ${req.requirementText.en}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  {deleteConfirm === req._id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleDelete(req._id)}
                        disabled={saving}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(req._id)}
                      disabled={saving}
                      aria-label={`Delete ${req.requirementText.en}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
