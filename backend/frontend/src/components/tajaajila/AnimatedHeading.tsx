import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedHeadingProps {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  delay?: number
}

export default function AnimatedHeading({
  children,
  as: Tag = 'h1',
  className,
  delay = 0,
}: AnimatedHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      <Tag
        className={cn(
          'font-bold text-gray-900 dark:text-gray-900',
          Tag === 'h1' && 'text-2xl md:text-3xl lg:text-4xl',
          Tag === 'h2' && 'text-xl md:text-2xl lg:text-3xl',
          Tag === 'h3' && 'text-lg md:text-xl',
          className
        )}
      >
        {children}
      </Tag>
    </motion.div>
  )
}
