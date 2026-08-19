import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Newspaper, HelpCircle, Building2,
  Users, Activity, Clock,
  Star, Save, X, CheckCircle2,
} from 'lucide-react'
import { getDashboardStats, updateFeedbackPercentages, type DashboardStats } from '@/api/admin'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const statCards = [
  { key: 'organizations', labelKey: 'organizations', icon: Building2, color: 'blue' },
  { key: 'services', labelKey: 'services', icon: Activity, color: 'green' },
  { key: 'windows', labelKey: 'windows', icon: LayoutDashboard, color: 'rose' },
  { key: 'news', labelKey: 'news', icon: Newspaper, color: 'purple' },
  { key: 'faqs', labelKey: 'faqs', icon: HelpCircle, color: 'amber' },
  { key: 'unreadMessages', labelKey: 'unreadMessages', icon: Clock, color: 'indigo' },
  { key: 'users', labelKey: 'users', icon: Users, color: 'indigo' },
]

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/40' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-100 dark:bg-teal-900/40' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' },
}

export default function AdminDashboard() {
  const { t } = useLanguage()
  const admin = t.admin
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRating, setEditingRating] = useState<number | null>(null)
  const [percentageDraft, setPercentageDraft] = useState('')
  const [savingPercentage, setSavingPercentage] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [savingVisibility, setSavingVisibility] = useState(false)

  useEffect(() => {
    let active = true
    const load = () => getDashboardStats()
      .then(next => { if (active) setData(next) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    load()
    const interval = window.setInterval(load, 15000)
    return () => { active = false; window.clearInterval(interval) }
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
        <p className="text-red-500">{admin.failedToLoad}: {error}</p>
      </div>
    )
  }

  if (!data) return null

  const startPercentageEdit = (rating: number) => {
    setEditingRating(rating)
    setPercentageDraft(String(data.feedback.percentages[rating as 1 | 2 | 3 | 4 | 5]))
    setFeedbackMessage('')
    setFeedbackError('')
  }

  const savePercentage = async (rating: number) => {
    const value = Number(percentageDraft)
    if (!Number.isFinite(value) || percentageDraft.trim() === '' || value < 0 || value > 100) {
      setFeedbackError(admin.invalidPercentage)
      return
    }
    setSavingPercentage(true)
    setFeedbackMessage('')
    setFeedbackError('')
    try {
      const percentages = { ...data.feedback.percentages, [rating]: value } as DashboardStats['feedback']['percentages']
      const feedback = await updateFeedbackPercentages(percentages)
      setData(current => current ? { ...current, feedback } : current)
      setEditingRating(null)
      setFeedbackMessage(admin.percentageSaved)
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Could not save percentage.')
    } finally {
      setSavingPercentage(false)
    }
  }

  const toggleOverallScore = async () => {
    setSavingVisibility(true)
    setFeedbackMessage('')
    setFeedbackError('')
    try {
      const feedback = await updateFeedbackPercentages(data.feedback.percentages, !data.feedback.showOverallProjectScore)
      setData(current => current ? { ...current, feedback } : current)
      setFeedbackMessage('Frontend percentage visibility updated.')
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Could not update visibility.')
    } finally {
      setSavingVisibility(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.dashboardTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {admin.overviewTitle}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ key, labelKey, icon: Icon, color }) => {
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {key === 'windows' ? 'Windows' : (admin as any)[labelKey]}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Total Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Total Items */}
        <motion.div variants={item} className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="h-5 w-5 text-brand-green" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{admin.totalContent}</h2>
          </div>
          <p className="text-4xl font-bold text-brand-green">{data.stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{admin.itemsManaged}</p>
        </motion.div>

      </div>

      <motion.section variants={item} className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{admin.feedbackStatistics}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{admin.feedbackScoreHint}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">{admin.overallProjectScore}</p>
            <p className="text-3xl font-bold text-brand-green">{data.feedback.overallProjectScore}%</p>
          </div>
        </div>
        <label className="flex items-center gap-3 mb-5 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={data.feedback.showOverallProjectScore} onChange={toggleOverallScore} disabled={savingVisibility}
            className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
          Show this percentage number on the frontend
        </label>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(rating => {
            const starRating = rating as 1 | 2 | 3 | 4 | 5
            const isEditing = editingRating === rating
            return (
              <div key={rating} className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
                <div className="flex items-center gap-1 w-20 shrink-0">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{rating}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">{data.feedback.votes[starRating]} {admin.votes}</span>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="1" value={percentageDraft} onChange={e => setPercentageDraft(e.target.value)} className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" aria-label={`${rating} star percentage`} autoFocus />
                    <button type="button" onClick={() => savePercentage(rating)} disabled={savingPercentage} className="p-1.5 rounded text-brand-green hover:bg-brand-green/10" aria-label={admin.savePercentage}><Save className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditingRating(null)} className="p-1.5 rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={admin.cancelEditing}><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => startPercentageEdit(rating)} className="text-sm font-semibold text-brand-green hover:underline" aria-label={`${admin.editPercentage} ${rating}`}>
                    {data.feedback.percentages[starRating]}% {admin.edit}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">{admin.totalRatings}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{data.feedback.totalRatings}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">{admin.mostFrequentRating}</p><p className="text-xl font-bold text-amber-500">{data.feedback.mostFrequentRating} {admin.stars}</p></div>
        </div>
        {feedbackMessage && <p className="flex items-center gap-2 mt-4 text-sm text-brand-green"><CheckCircle2 className="h-4 w-4" />{feedbackMessage}</p>}
        {feedbackError && <p className="mt-4 text-sm text-red-500">{feedbackError}</p>}
      </motion.section>
    </motion.div>
  )
}