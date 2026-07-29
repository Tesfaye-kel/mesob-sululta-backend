import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Requirement, CreateRequirementPayload } from '@/api/requirementsApi'

// ── Zod schema ────────────────────────────────────────────
const schema = z.object({
  requirementText: z.object({
    en: z.string().min(2, 'English text is required'),
    am: z.string().min(2, 'Amharic text is required'),
    or: z.string().min(2, 'Afaan Oromo text is required'),
  }),
  notes: z.object({
    en: z.string().default(''),
    am: z.string().default(''),
    or: z.string().default(''),
  }),
  isMandatory: z.boolean().default(true),
  sequenceNo: z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof schema>

interface RequirementFormProps {
  serviceId: string
  /** If provided, the form edits this requirement */
  existing?: Requirement
  saving: boolean
  onSubmit: (payload: CreateRequirementPayload) => Promise<void>
  onCancel: () => void
}

// ── Reusable field wrapper ─────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={2}
      className={cn(
        'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        'px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green',
        'resize-none transition-colors',
        className
      )}
      {...props}
    />
  )
}

// ── Main component ────────────────────────────────────────
export default function RequirementForm({
  serviceId,
  existing,
  saving,
  onSubmit,
  onCancel,
}: RequirementFormProps) {
  const isEdit = Boolean(existing)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requirementText: { en: '', am: '', or: '' },
      notes: { en: '', am: '', or: '' },
      isMandatory: true,
      sequenceNo: 0,
    },
  })

  // Pre-fill when editing
  useEffect(() => {
    if (existing) {
      reset({
        requirementText: existing.requirementText,
        notes: existing.notes,
        isMandatory: existing.isMandatory,
        sequenceNo: existing.sequenceNo,
      })
    } else {
      reset({
        requirementText: { en: '', am: '', or: '' },
        notes: { en: '', am: '', or: '' },
        isMandatory: true,
        sequenceNo: 0,
      })
    }
  }, [existing, reset])

  const submit = async (values: FormValues) => {
    await onSubmit({ service: serviceId, ...values })
    if (!isEdit) reset()
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5 shadow-sm"
      aria-label={isEdit ? 'Edit requirement' : 'Add new requirement'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Requirement' : 'New Requirement'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* ── Requirement Text ── */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Requirement Text <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="English" error={errors.requirementText?.en?.message}>
            <Textarea
              placeholder="e.g. Kebele support letter"
              {...register('requirementText.en')}
              aria-invalid={Boolean(errors.requirementText?.en)}
            />
          </Field>
          <Field label="አማርኛ" error={errors.requirementText?.am?.message}>
            <Textarea
              placeholder="ለምሳሌ፦ የቀበሌ ድጋፍ ደብዳቤ"
              {...register('requirementText.am')}
              aria-invalid={Boolean(errors.requirementText?.am)}
              className="font-ethiopic"
            />
          </Field>
          <Field label="Afaan Oromoo" error={errors.requirementText?.or?.message}>
            <Textarea
              placeholder="fkn: Xalayaa deggarsa ganda"
              {...register('requirementText.or')}
              aria-invalid={Boolean(errors.requirementText?.or)}
            />
          </Field>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Notes <span className="text-gray-400 text-xs">(optional)</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="English">
            <Textarea placeholder="Additional note..." {...register('notes.en')} />
          </Field>
          <Field label="አማርኛ">
            <Textarea
              placeholder="ተጨማሪ ማብራሪያ..."
              {...register('notes.am')}
              className="font-ethiopic"
            />
          </Field>
          <Field label="Afaan Oromoo">
            <Textarea placeholder="Ibsa dabalata..." {...register('notes.or')} />
          </Field>
        </div>
      </div>

      {/* ── Mandatory + Sequence ── */}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('isMandatory')}
            className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Mandatory</span>
        </label>

        <div className="flex items-center gap-2">
          <label
            htmlFor="sequenceNo"
            className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap"
          >
            Order #
          </label>
          <input
            id="sequenceNo"
            type="number"
            min={0}
            {...register('sequenceNo')}
            className={cn(
              'w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              'px-3 py-1.5 text-sm text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green',
              'transition-colors'
            )}
          />
          {errors.sequenceNo && (
            <p className="text-xs text-red-500">{errors.sequenceNo.message}</p>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isEdit ? 'Save Changes' : 'Add Requirement'}
        </button>
      </div>
    </form>
  )
}
