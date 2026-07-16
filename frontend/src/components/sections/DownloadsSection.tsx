import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Calendar } from 'lucide-react'
import { downloads, downloadCategories } from '@/data/downloads'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

const fileTypeColors: Record<string, string> = {
  PDF:  'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  DOCX: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  XLSX: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  ZIP:  'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
}

export default function DownloadsSection() {
  const { t, language } = useLanguage()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = downloads.filter(d => {
    const title = language === 'am' ? d.titleAm : language === 'or' ? d.titleOr : d.titleEn
    return (category === 'All' || d.category === category) &&
           (!search || title.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="container-gov">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder={t.downloads.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {downloadCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                category === cat
                  ? 'bg-brand-green text-white shadow-gov'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-green hover:text-brand-green'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {filtered.length} {language === 'am' ? 'ሰነዶች ይገኛሉ' : language === 'or' ? "galmeelee argamu" : `document${filtered.length !== 1 ? 's' : ''} available`}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {language === 'am' ? 'ሰነዶች አልተገኙም' : language === 'or' ? 'Galmeeleen hin argamne' : 'No documents found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'am' ? 'ፍለጋዎን ያስተካክሉ።' : language === 'or' ? 'Barbaaduu kee sirreessi.' : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc, i) => {
            const title = language === 'am' ? doc.titleAm : language === 'or' ? doc.titleOr : doc.titleEn
            const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[doc.icon] || Icons.FileText

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-green/10 dark:bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${fileTypeColors[doc.fileType] || 'bg-gray-100 text-gray-600'}`}>
                        {doc.fileType}
                      </span>
                      <Badge variant="muted" size="sm">{doc.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{title}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{doc.descriptionEn}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span>{doc.fileSize}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" aria-hidden />
                    {doc.downloads.toLocaleString()}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {formatDate(doc.dateAdded)}
                  </div>
                </div>
                <Button size="sm" className="w-full" leftIcon={<Download className="h-4 w-4" aria-hidden />}>
                  {t.downloads.download}
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
