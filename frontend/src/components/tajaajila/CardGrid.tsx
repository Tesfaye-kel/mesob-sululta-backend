import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

interface CardGridProps {
  children: React.ReactNode
  className?: string
}

export function CardGrid({ children, className }: CardGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={
        className ??
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      }
    >
      {children}
    </motion.div>
  )
}

export function CardItem({ children }: { children: React.ReactNode }) {
  return <motion.div variants={item} className="h-full">{children}</motion.div>
}
