import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-green text-white hover:bg-brand-green-dark shadow-gov hover:shadow-lg focus-visible:ring-brand-green',
        secondary: 'bg-white dark:bg-gray-800 text-brand-green dark:text-brand-green-light border-2 border-brand-green hover:bg-brand-green hover:text-white dark:hover:bg-brand-green dark:hover:text-white focus-visible:ring-brand-green',
        gold: 'bg-brand-gold text-white hover:bg-brand-gold-dark shadow-md hover:shadow-lg focus-visible:ring-brand-gold',
        outline: 'border border-gray-200 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-gray-400',
        ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400',
        destructive: 'bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-red',
        link: 'text-brand-green dark:text-brand-green-light underline-offset-4 hover:underline p-0 h-auto shadow-none',
      },
      size: {
        sm: 'px-4 py-2 text-sm h-9',
        md: 'px-6 py-3 text-sm h-11',
        lg: 'px-8 py-4 text-base h-13',
        xl: 'px-10 py-5 text-lg h-15',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
