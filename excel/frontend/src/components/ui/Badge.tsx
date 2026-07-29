import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light',
        secondary: 'bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20',
        accent: 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300',
        destructive: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        outline: 'border border-current bg-transparent',
        notice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        holiday: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
        press: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        new: 'bg-brand-green text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
