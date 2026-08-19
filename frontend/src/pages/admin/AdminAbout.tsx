import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Plus, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle, Heart, Award, Eye, TrendingUp, Target, History, ChevronDown, Upload, Building2, MessageSquare, Image, Palette } from 'lucide-react'
import { getAbout, updateAbout, uploadManagerPhoto, addAboutStory, updateAboutStory, deleteAboutStory, addAboutValue, updateAboutValue, deleteAboutValue, addAboutStat, updateAboutStat, deleteAboutStat, type AboutContent, type AboutStory, type AboutValue, type AboutStat } from '@/api/admin'
import { getImageUrl } from '@/lib/images'
import { useLanguage } from '@/contexts/LanguageContext'

const langs = ['en', 'am', 'or'] as const
const langLabels = { en: 'EN', am: 'አማ', or: 'AF' } as const
const aboutEditorLabels = {
  en: {
    mainContent: 'Main Content', mainSubtitle: 'Mission, Vision, Objectives, History, Branch Introduction',
    mission: 'Mission', vision: 'Vision', objectives: 'Objectives', branchIntroduction: 'Branch Introduction', history: 'History',
    sectionTitles: 'Section Titles / Labels', sectionTitlesSubtitle: 'Customize the section headings shown on the frontend (badge, titles, subtitles)',
    story: 'Story / History Paragraphs', values: 'Core Values', statistics: 'Statistics', manager: 'Manager Message',
  },
  am: {
    mainContent: 'ዋና ይዘት', mainSubtitle: 'ተልዕኮ፣ ራዕይ፣ ዓላማዎች፣ ታሪክ እና የቅርንጫፍ መግቢያ',
    mission: 'ተልዕኮ', vision: 'ራዕይ', objectives: 'ዓላማዎች', branchIntroduction: 'የቅርንጫፍ መግቢያ', history: 'ታሪክ',
    sectionTitles: 'የክፍል ርዕሶች / መለያዎች', sectionTitlesSubtitle: 'በድረ-ገጹ ላይ የሚታዩ ርዕሶችን እና ንዑስ ርዕሶችን ያስተካክሉ',
    story: 'ታሪክ / የታሪክ አንቀጾች', values: 'መሠረታዊ እሴቶች', statistics: 'ስታቲስቲክስ', manager: 'የአስተዳዳሪ መልዕክት',
  },
  or: {
    mainContent: 'Qabiyyee Ijoo', mainSubtitle: 'Ergama, Mul\'ata, Kaayyoo, Seenaa fi Seensa Damee',
    mission: 'Ergama', vision: 'Mul\'ata', objectives: 'Kaayyoo', branchIntroduction: 'Seensa Damee', history: 'Seenaa',
    sectionTitles: 'Mata-dureewwan / Mallattoolee Kutaa', sectionTitlesSubtitle: 'Mata-dureewwan fi ibsa fuula duraa irratti mul\'atan qindeessi',
    story: 'Seenaa / Kutaa Seenaa', values: 'Gatiilee Ijoo', statistics: 'Istaatiksii', manager: 'Ergaa Hoogganaa',
  },
} as const

const fields = ['mission', 'vision', 'objectives', 'branchIntroduction', 'history'] as const

const fieldLabels: Record<string, string> = {
  mission: 'Mission',
  vision: 'Vision',
  objectives: 'Objectives',
  branchIntroduction: 'Branch Introduction',
  history: 'History',
}

const iconOptions = ['Heart', 'Award', 'Eye', 'TrendingUp', 'Target', 'History']

const iconMap: Record<string, React.ReactNode> = {
  Heart: <Heart className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  History: <History className="h-4 w-4" />,
}

const colorOptions = ['green', 'blue', 'gold', 'red', 'purple', 'teal']

const colorClass = (c: string): string => {
  const map: Record<string, string> = {
    green: 'bg-brand-green',
    blue: 'bg-brand-blue',
    gold: 'bg-brand-gold',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    teal: 'bg-teal-600',
  }
  return map[c] || 'bg-brand-green'
}

const textColorClass = (c: string): string => {
  const map: Record<string, string> = {
    green: 'text-brand-green',
    blue: 'text-brand-blue',
    gold: 'text-brand-gold',
    red: 'text-red-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
  }
  return map[c] || 'text-brand-green'
}

const emptyStory = { paragraph: { en: '', am: '', or: '' }, order: 0 }
const emptyValue = { icon: 'Heart', title: { en: '', am: '', or: '' }, description: { en: '', am: '', or: '' }, color: 'green', order: 0 }
const emptyStat = { value: '', label: { en: '', am: '', or: '' }, color: 'green', order: 0, isVisible: true }

// ─── Accordion Section Component ─────────────────────────────────
function AccordionSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <Icon className="h-5 w-5 text-brand-green shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminAbout() {
  const { t } = useLanguage()
  const admin = t.admin
  const [selectedLang, setSelectedLang] = useState<typeof langs[number]>('en')
  const editorLabels = aboutEditorLabels[selectedLang]
  const [data, setData] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<Record<string, { en: string; am: string; or: string }>>({})

  // Manager message form
  const [managerForm, setManagerForm] = useState({ managerName: '', managerPhoto: '', managerMessage: { en: '', am: '', or: '' }, managerTitle: { en: '', am: '', or: '' } })

  // Section title forms (localized)
  const [sectionTitles, setSectionTitles] = useState({
    storyBadge: { en: '', am: '', or: '' },
    storyTitle: { en: '', am: '', or: '' },
    missionTitle: { en: '', am: '', or: '' },
    visionTitle: { en: '', am: '', or: '' },
    valuesTitle: { en: '', am: '', or: '' },
    valuesSubtitle: { en: '', am: '', or: '' },
    managerMessageTitle: { en: '', am: '', or: '' },
  })

  // Story modal
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [editingStory, setEditingStory] = useState<AboutStory | null>(null)
  const [storyForm, setStoryForm] = useState(emptyStory)

  // Value modal
  const [showValueForm, setShowValueForm] = useState(false)
  const [editingValue, setEditingValue] = useState<AboutValue | null>(null)
  const [valueForm, setValueForm] = useState(emptyValue)

  // Stat modal
  const [showStatForm, setShowStatForm] = useState(false)
  const [editingStat, setEditingStat] = useState<AboutStat | null>(null)
  const [statForm, setStatForm] = useState(emptyStat)

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  useEffect(() => {
    getAbout()
      .then((d) => {
        setData(d)
        const init: Record<string, { en: string; am: string; or: string }> = {}
        fields.forEach(f => {
          init[f] = { en: d[f]?.en || '', am: d[f]?.am || '', or: d[f]?.or || '' }
        })
        setForm(init)
        setManagerForm({
          managerName: d.managerName || '',
          managerPhoto: d.managerPhoto || '',
          managerMessage: { en: d.managerMessage?.en || '', am: d.managerMessage?.am || '', or: d.managerMessage?.or || '' },
          managerTitle: { en: d.managerTitle?.en || '', am: d.managerTitle?.am || '', or: d.managerTitle?.or || '' },
        })
        setSectionTitles({
          storyBadge: { en: d.storyBadge?.en || '', am: d.storyBadge?.am || '', or: d.storyBadge?.or || '' },
          storyTitle: { en: d.storyTitle?.en || '', am: d.storyTitle?.am || '', or: d.storyTitle?.or || '' },
          missionTitle: { en: d.missionTitle?.en || '', am: d.missionTitle?.am || '', or: d.missionTitle?.or || '' },
          visionTitle: { en: d.visionTitle?.en || '', am: d.visionTitle?.am || '', or: d.visionTitle?.or || '' },
          valuesTitle: { en: d.valuesTitle?.en || '', am: d.valuesTitle?.am || '', or: d.valuesTitle?.or || '' },
          valuesSubtitle: { en: d.valuesSubtitle?.en || '', am: d.valuesSubtitle?.am || '', or: d.valuesSubtitle?.or || '' },
          managerMessageTitle: { en: d.managerMessageTitle?.en || '', am: d.managerMessageTitle?.am || '', or: d.managerMessageTitle?.or || '' },
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateAbout({ ...form, ...managerForm, ...sectionTitles })
      setData(updated)
      setSuccess(admin.aboutSaved)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToSave)
    } finally {
      setSaving(false)
    }
  }

// ─── Manager Photo Upload ──────────────────────────────────────
  const handleManagerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const data = await uploadManagerPhoto(file)
      setManagerForm(prev => ({ ...prev, managerPhoto: data.imageUrl }))
      setSuccess(admin.imageSelected)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToSave)
    } finally {
      setUploading(false)
    }
  }

  // Story CRUD
  const handleSaveStory = async () => {
    try {
      if (editingStory && editingStory._id) {
        const updated = await updateAboutStory(editingStory._id, storyForm)
        setData(updated)
      } else {
        const updated = await addAboutStory(storyForm)
        setData(updated)
      }
      setShowStoryForm(false)
      setEditingStory(null)
      setStoryForm(emptyStory)
      setSuccess(admin.storySaved)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToSave)
    }
  }

  const handleDeleteStory = async (id: string) => {
    try {
      await deleteAboutStory(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess(admin.storyDeleted)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToDelete)
    }
    setConfirmDelete(null)
  }

  // Value CRUD
  const handleSaveValue = async () => {
    try {
      if (editingValue && editingValue._id) {
        const updated = await updateAboutValue(editingValue._id, valueForm)
        setData(updated)
      } else {
        const updated = await addAboutValue(valueForm)
        setData(updated)
      }
      setShowValueForm(false)
      setEditingValue(null)
      setValueForm(emptyValue)
      setSuccess(admin.valueSaved)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToSave)
    }
  }

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteAboutValue(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess(admin.valueDeleted)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  // Stat CRUD
  const handleSaveStat = async () => {
    try {
      if (editingStat && editingStat._id) {
        const updated = await updateAboutStat(editingStat._id, statForm)
        setData(updated)
      } else {
        const updated = await addAboutStat(statForm)
        setData(updated)
      }
      setShowStatForm(false)
      setEditingStat(null)
      setStatForm(emptyStat)
      setSuccess(admin.statSaved)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : admin.failedToSave)
    }
  }

  const handleDeleteStat = async (id: string) => {
    try {
      await deleteAboutStat(id)
      const updated = await getAbout()
      setData(updated)
      setSuccess(admin.statDeleted)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
    setConfirmDelete(null)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{admin.aboutTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{admin.aboutDesc}</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {langs.map(lang => (
            <button key={lang} type="button" onClick={() => setSelectedLang(lang)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${selectedLang === lang ? 'bg-white dark:bg-gray-700 text-brand-green shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
              {langLabels[lang]}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {/* ── Main Text Fields ── */}
        <AccordionSection icon={Info} title={editorLabels.mainContent} subtitle={editorLabels.mainSubtitle} defaultOpen={true}>
          <div className="space-y-6">
            {fields.map(field => (
              <div key={field}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">{editorLabels[field]}</h3>
                <div className="space-y-2">
                  {(() => {
                    const lang = selectedLang
                    return <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">{langLabels[lang]}</label>
                      <textarea
                        value={form[field]?.[lang] || ''}
                        onChange={e => setForm(f => ({ ...f, [field]: { ...f[field], [lang]: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                        placeholder={`${editorLabels[field]} (${langLabels[lang]})`}
                      />
                    </div>
                  })()}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Section Titles ── */}
        <AccordionSection icon={Palette} title={editorLabels.sectionTitles} subtitle={editorLabels.sectionTitlesSubtitle}>
          <div className="space-y-4">
            {Object.entries(sectionTitles).map(([key, val]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input
                  value={val[selectedLang]}
                  onChange={e => setSectionTitles(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof sectionTitles], [selectedLang]: e.target.value } }))}
                  placeholder={langLabels[selectedLang]}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Story Section ── */}
        <AccordionSection icon={Building2} title={editorLabels.story} subtitle={data?.story?.length ? `${data.story.length} ${selectedLang === 'or' ? 'kutaa' : selectedLang === 'am' ? 'አንቀጾች' : 'paragraphs'}` : selectedLang === 'or' ? 'Kutaan hin jiru' : selectedLang === 'am' ? 'አንቀጽ የለም' : 'No paragraphs yet'}>
          <div className="space-y-2">
            <div className="flex justify-end mb-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingStory(null); setStoryForm(emptyStory); setShowStoryForm(true) }}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> {admin.addStory}
              </motion.button>
            </div>
            {data?.story?.length === 0 && <p className="text-sm text-gray-400">{selectedLang === 'or' ? 'Kutaan seenaa amma iyyuu hin dabalamin.' : selectedLang === 'am' ? 'እስካሁን ምንም የታሪክ አንቀጾች አልተጨመሩም።' : 'No story paragraphs added yet.'}</p>}
            {data?.story?.map((story, idx) => (
              <motion.div key={story._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-green shrink-0">#{story.order}</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{story.paragraph.en}</p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { setEditingStory(story); setStoryForm({ paragraph: { ...story.paragraph }, order: story.order }); setShowStoryForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <Edit3 className="h-3.5 w-3.5" /> {admin.edit}
                  </button>
                  <button
                    onClick={() => story._id && setConfirmDelete({ type: 'story', id: story._id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> {admin.delete}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Values Section ── */}
        <AccordionSection icon={Heart} title={editorLabels.values} subtitle={data?.values?.length ? `${data.values.length} ${selectedLang === 'or' ? 'gatii' : selectedLang === 'am' ? 'እሴቶች' : 'values'}` : selectedLang === 'or' ? 'Gatiin hin jiru' : selectedLang === 'am' ? 'እሴት የለም' : 'No values yet'}>
          <div className="space-y-2">
            <div className="flex justify-end mb-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingValue(null); setValueForm(emptyValue); setShowValueForm(true) }}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> {admin.addValue}
              </motion.button>
            </div>
            {data?.values?.length === 0 && <p className="text-sm text-gray-400">No values added yet.</p>}
            {data?.values?.map((val, idx) => (
              <motion.div key={val._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <span className={`w-8 h-8 rounded-lg ${colorClass(val.color)}/10 flex items-center justify-center text-brand-green shrink-0`}>
                  {iconMap[val.icon] || <Heart className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{val.title.en}</p>
                  <p className="text-xs text-gray-500 truncate">{val.description.en}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditingValue(val); setValueForm({ icon: val.icon, title: { ...val.title }, description: { ...val.description }, color: val.color || 'green', order: val.order }); setShowValueForm(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => val._id && setConfirmDelete({ type: 'value', id: val._id })}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Stats Section ── */}
        <AccordionSection icon={TrendingUp} title={editorLabels.statistics} subtitle={data?.stats?.length ? `${data.stats.length} ${selectedLang === 'or' ? 'tilmaama' : selectedLang === 'am' ? 'ስታቶች' : 'stats'}` : selectedLang === 'or' ? 'Tilmaamni hin jiru' : selectedLang === 'am' ? 'ስታት የለም' : 'No stats yet'}>
          <div className="space-y-2">
            <div className="flex justify-end mb-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingStat(null); setStatForm(emptyStat); setShowStatForm(true) }}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-all">
                <Plus className="h-3.5 w-3.5" /> {admin.addStat}
              </motion.button>
            </div>
            {data?.stats?.length === 0 && <p className="text-sm text-gray-400">No stats added yet.</p>}
            {data?.stats?.map((stat, idx) => (
              <motion.div key={stat._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <span className={`text-lg font-bold ${textColorClass(stat.color)} w-12 shrink-0`}>{stat.value}</span>
                <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{stat.label.en}</p>
                <span className={`text-xs font-medium ${stat.isVisible !== false ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {stat.isVisible !== false ? 'Shown' : 'Hidden'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditingStat(stat); setStatForm({ value: stat.value, label: { ...stat.label }, color: stat.color || 'green', order: stat.order, isVisible: stat.isVisible !== false }); setShowStatForm(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => stat._id && setConfirmDelete({ type: 'stat', id: stat._id })}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* ── Manager Message ── */}
        <AccordionSection icon={MessageSquare} title={editorLabels.manager} subtitle={selectedLang === 'or' ? 'Maqaa, suuraa, mata-duree fi caqasaa' : selectedLang === 'am' ? 'ስም፣ ፎቶ፣ ርዕስ እና ጥቅስ' : 'Name, photo, title, and quote'}>
          <div className="space-y-4">
            {/* Manager Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{admin.managerPhoto}</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {managerForm.managerPhoto ? (
                    <img src={getImageUrl(managerForm.managerPhoto)}
                      alt="Manager" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center text-white text-2xl font-bold">
                      {managerForm.managerName ? managerForm.managerName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? admin.uploading : admin.uploadPhoto}
                  <input type="file" accept="image/*" className="hidden" onChange={handleManagerPhotoUpload} disabled={uploading} />
                </label>
                {managerForm.managerPhoto && (
                  <button onClick={() => setManagerForm(prev => ({ ...prev, managerPhoto: '' }))}
                    className="text-xs text-red-500 hover:text-red-700">{admin.remove}</button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.managerName}</label>
              <input value={managerForm.managerName} onChange={e => setManagerForm(f => ({ ...f, managerName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.managerTitle} ({langLabels[selectedLang]})</label>
                <input value={managerForm.managerTitle[selectedLang]} onChange={e => setManagerForm(f => ({ ...f, managerTitle: { ...f.managerTitle, [selectedLang]: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.messageLabel} ({langLabels[selectedLang]})</label>
                <textarea value={managerForm.managerMessage[selectedLang]} onChange={e => setManagerForm(f => ({ ...f, managerMessage: { ...f.managerMessage, [selectedLang]: e.target.value } }))} rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
              </div>
          </div>
        </AccordionSection>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {admin.saveAllChanges}
        </button>
      </div>

      {/* ── Story Form Modal ── */}
      <AnimatePresence>{showStoryForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowStoryForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingStory ? admin.editStory : admin.addStory}</h2>
              <button onClick={() => setShowStoryForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.paragraph} ({langLabels[selectedLang]})</label>
                  <textarea value={storyForm.paragraph[selectedLang]} onChange={e => setStoryForm(f => ({ ...f, paragraph: { ...f.paragraph, [selectedLang]: e.target.value } }))} rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.order}</label>
                <input type="number" value={storyForm.order} onChange={e => setStoryForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowStoryForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">{admin.cancel}</button>
                <button onClick={handleSaveStory} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingStory ? admin.update : admin.add}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Value Form Modal ── */}
      <AnimatePresence>{showValueForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowValueForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingValue ? admin.editValue : admin.addValue}</h2>
              <button onClick={() => setShowValueForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.iconName}</label>
                <select value={valueForm.icon} onChange={e => setValueForm(f => ({ ...f, icon: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green">
                  {iconOptions.map(ico => <option key={ico} value={ico}>{ico}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.color}</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button key={c} type="button" onClick={() => setValueForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-lg ${colorClass(c)} ${valueForm.color === c ? 'ring-2 ring-offset-2 ring-brand-green' : ''}`}
                      title={c} />
                  ))}
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.title} ({langLabels[selectedLang]})</label>
                  <input value={valueForm.title[selectedLang]} onChange={e => setValueForm(f => ({ ...f, title: { ...f.title, [selectedLang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.description} ({langLabels[selectedLang]})</label>
                  <textarea value={valueForm.description[selectedLang]} onChange={e => setValueForm(f => ({ ...f, description: { ...f.description, [selectedLang]: e.target.value } }))} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.order}</label>
                <input type="number" value={valueForm.order} onChange={e => setValueForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowValueForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">{admin.cancel}</button>
                <button onClick={handleSaveValue} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingValue ? admin.update : admin.add}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Stat Form Modal ── */}
      <AnimatePresence>{showStatForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatForm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingStat ? admin.editStat : admin.addStat}</h2>
              <button onClick={() => setShowStatForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.valueExample}</label>
                <input value={statForm.value} onChange={e => setStatForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.color}</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button key={c} type="button" onClick={() => setStatForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-lg ${colorClass(c)} ${statForm.color === c ? 'ring-2 ring-offset-2 ring-brand-green' : ''}`}
                      title={c} />
                  ))}
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.label} ({langLabels[selectedLang]})</label>
                  <input value={statForm.label[selectedLang]} onChange={e => setStatForm(f => ({ ...f, label: { ...f.label, [selectedLang]: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{admin.order}</label>
                <input type="number" value={statForm.order} onChange={e => setStatForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={statForm.isVisible} onChange={e => setStatForm(f => ({ ...f, isVisible: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                Show this statistic on the frontend
              </label>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowStatForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">{admin.cancel}</button>
                <button onClick={handleSaveStat} className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:bg-brand-green-dark transition-all">{editingStat ? admin.update : admin.add}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>{confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{admin.delete} {confirmDelete.type}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{admin.deleteConfirmDesc}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">{admin.cancel}</button>
              <button onClick={() => {
                if (confirmDelete.type === 'story') handleDeleteStory(confirmDelete.id)
                else if (confirmDelete.type === 'value') handleDeleteValue(confirmDelete.id)
                else if (confirmDelete.type === 'stat') handleDeleteStat(confirmDelete.id)
              }} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">{admin.delete}</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}
