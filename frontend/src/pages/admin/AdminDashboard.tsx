import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, HelpCircle, Building2,
  Users, MessageSquareQuote, Activity, Clock, ArrowUpRight,
} from 'lucide-react'
import { getDashboardStats, type DashboardStats } from '@/api/admin'
import { cn } from '@/lib/utils'

const statCards = [
  { key: 'organizations', label: 'Organizations', icon: Building2, color: 'blue' },
  { key: 'services', label: 'Services', icon: Activity, color: 'green' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, color: 'purple' },
  { key: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'amber' },
  { key: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, color: 'rose' },
  { key: 'users', label: 'Users', icon: Users, color: 'indigo' },
]

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/40' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' },
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Failed to load dashboard: {error}</p>
      </div>
    )
  }

  if (!data) return null

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your MESOB Sululta Branch content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon, color }) => {
          const value = data.stats[key as keyof typeof data.stats] as number
          const colors = colorMap[color]
          return (
            <motion.div
              key={key}
              variants={item}
              className={cn(
                'rounded-xl p-4 border border-gray-200 dark:border-gray-700',
                colors.bg
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors.iconBg)}>
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Total & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Items */}
        <motion.div variants={item} className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="h-5 w-5 text-brand-green" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Total Content</h2>
          </div>
          <p className="text-4xl font-bold text-brand-green">{data.stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Items managed</p>
        </motion.div>

        {/* Recent Announcements */}
        <motion.div variants={item} className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Announcements</h2>
          </div>
          <div className="space-y-3">
            {data.recent.announcements.length === 0 && (
              <p className="text-sm text-gray-400">No announcements yet</p>
            )}
            {data.recent.announcements.slice(0, 4).map(a => (
              <div key={a._id} className="flex items-start gap-2">
                <Clock className="h-3 w-3 text-gray-400 mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {a.title.en}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Orgs */}
        <motion.div variants={item} className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Organizations</h2>
          </div>
          <div className="space-y-3">
            {data.recent.organizations.length === 0 && (
              <p className="text-sm text-gray-400">No organizations yet</p>
            )}
            {data.recent.organizations.slice(0, 4).map(o => (
              <div key={o._id} className="flex items-start gap-2">
                <ArrowUpRight className="h-3 w-3 text-gray-400 mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {o.name.en}
                  </p>
                  <p className="text-xs text-gray-500">
                    Added {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}