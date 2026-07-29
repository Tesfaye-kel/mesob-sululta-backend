import { motion } from 'framer-motion'
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'
import { departments } from '@/data/departments'

const leadership = [
  { name: 'Ato Abebe Girma',      roleEn: 'Branch Manager',         roleAm: 'የቅርንጫፍ ሥራ አስኪያጅ',     roleOr: 'Hooggana Damee',             avatar: 'A', color: 'bg-brand-green' },
  { name: 'W/ro Tigist Haile',    roleEn: 'Deputy Manager',         roleAm: 'ምክትል ሥራ አስኪያጅ',       roleOr: 'Itti Aanaa Hooggana',        avatar: 'T', color: 'bg-brand-blue' },
  { name: 'Ato Girma Bekele',     roleEn: 'Head of Administration', roleAm: 'የአስተዳደር ኃላፊ',          roleOr: 'Hogganaa Bulchiinsaa',       avatar: 'G', color: 'bg-brand-gold' },
  { name: 'W/ro Selamawit Alemu', roleEn: 'Head of Finance',        roleAm: 'የፋይናንስ ኃላፊ',           roleOr: 'Hogganaa Maallaqaa',         avatar: 'S', color: 'bg-purple-600' },
]

export default function OrganizationSection() {
  const { t, language } = useLanguage()

  const branchManagerLabel = language === 'am' ? 'ቅርንጫፍ ሥራ አስኪያጅ' : language === 'or' ? 'Hooggana Damee' : 'Branch Manager'
  const deputyLabel        = language === 'am' ? 'ምክትል ሥራ አስኪያጅ'  : language === 'or' ? 'Itti Aanaa Hooggana' : 'Deputy Manager'
  const opsLabel           = language === 'am' ? 'ሥራዎች እና አገልግሎቶች' : language === 'or' ? 'Hojiiwwanii fi Tajaajilaalee' : 'Operations & Services'
  const futureDesc         = language === 'am' ? t.about.futureExpansionDesc : language === 'or' ? t.organization.futureExpansionDesc : t.organization.futureExpansionDesc

  return (
    <div className="container-gov">
      {/* Org chart */}
      <AnimatedSection variant="fadeUp" className="mb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-8">
            {t.organization.hierarchy}
          </h2>
          <div className="min-w-[600px]">
            <div className="flex justify-center mb-4">
              <div className="bg-brand-green text-white rounded-xl px-6 py-3 text-center">
                <p className="font-bold">{branchManagerLabel}</p>
                <p className="text-xs text-white/70">MESOB {t.siteTagline}</p>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" aria-hidden />
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-brand-blue text-white rounded-xl px-6 py-3 text-center">
                <p className="font-bold">{deputyLabel}</p>
                <p className="text-xs text-white/70">{opsLabel}</p>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-4xl border-t-2 border-gray-300 dark:border-gray-600" aria-hidden />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {departments.slice(0, 8).map((dept) => {
                const name = language === 'am' ? dept.nameAm : language === 'or' ? dept.nameOr : dept.nameEn
                return (
                  <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-900 dark:text-white text-xs">{name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Leadership */}
      <AnimatedSection variant="fadeUp" className="text-center mb-10">
        <h2 className="section-title">{t.organization.leadership}</h2>
      </AnimatedSection>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {leadership.map((person) => {
          const role = language === 'am' ? person.roleAm : language === 'or' ? person.roleOr : person.roleEn
          return (
            <StaggerItem key={person.name}>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 text-center hover:shadow-card-hover transition-all duration-300 group">
                <motion.div
                  className={`w-16 h-16 rounded-2xl ${person.color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  {person.avatar}
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{person.name}</h3>
                <p className="text-sm text-brand-green dark:text-brand-green-light font-medium">{role}</p>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      <AnimatedSection variant="fadeUp">
        <div className="bg-brand-gold/5 dark:bg-brand-gold/10 border border-brand-gold/20 dark:border-brand-gold/30 rounded-2xl p-6 text-center">
          <span className="text-2xl mb-2 block" aria-hidden>🚀</span>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t.organization.futureExpansion}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">{futureDesc}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
