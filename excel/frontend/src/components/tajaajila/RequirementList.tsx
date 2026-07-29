import { CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmptyState from './EmptyState'
import type { Requirement } from '@/api/tajaajila'

interface RequirementListProps {
  requirements: Requirement[]
}

export default function RequirementList({ requirements }: RequirementListProps) {
  if (requirements.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Wantoonni barbaachisan amma hin galmeeffamne."
        description="Bulchiinsi dhiyeenya kana ni guuta."
      />
    )
  }

  const mandatory = requirements.filter(r => r.isMandatory)
  const optional = requirements.filter(r => !r.isMandatory)

  return (
    <div className="space-y-6">
      {mandatory.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Dirqama
          </h3>
          <ul className="space-y-2">
            {mandatory.map(req => (
              <li
                key={req._id}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20"
              >
                <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {req.requirementText.or || req.requirementText.en}
                  </p>
                  {req.notes.or && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{req.notes.or}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {optional.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Dirqama Miti
          </h3>
          <ul className="space-y-2">
            {optional.map(req => (
              <li
                key={req._id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700'
                )}
              >
                <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {req.requirementText.or || req.requirementText.en}
                  </p>
                  {req.notes.or && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{req.notes.or}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
