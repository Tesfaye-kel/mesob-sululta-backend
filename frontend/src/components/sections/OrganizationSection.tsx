import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'
import { departments } from '@/data/departments'
import { Loader2, Users } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface LeadershipMember {
  _id?: string
  name: string
  role: { en: string; am: string; or: string }
  avatar: string
  color: string
  order: number
}

export default function OrganizationSection() {
  const { t, language } = useLanguage()
  const [leadership, setLeadership] = useState<LeadershipMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/organization-content`)
      .then(r => r.json())
      .then((data: { leadership: LeadershipMember[] }) => {
        const sorted = (data.leadership || []).sort((a, b) => a.order - b.order)
        setLeadership(sorted)
      })
      .catch(() => {
        // Silently fail - component will show empty state
      })
      .finally(() => setLoading(false))
  }, [])

  const branchManagerLabel = language === 'am' ? 'ቅርንጫፍ ሥራ አስኪያጅ' : language === 'or' ? 'Hooggana Damee' : 'Branch Manager'
  const deputyLabel        = language === 'am' ? 'ምክትል ሥራ አስኪያጅ'  : language === 'or' ? 'Itti Aanaa Hooggana' : 'Deputy Manager'
  const opsLabel           = language === 'am' ? 'ሥራዎች እና አገልግሎቶች' : language === 'or' ? 'Hojiiwwanii fi Tajaajilaalee' : 'Operations & Services'
  const futureDesc         = language === 'am' ? t.about.futureExpansionDesc : language === 'or' ? t.organization.futureExpansionDesc : t.organization.futureExpansionDesc

  const getRole = (member: LeadershipMember) => {
    if (language === 'am') return member.role.am || member.role.en
    if (language === 'or') return member.role.or || member.role.en
    return member.role.en
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  const getImageUrl = (avatar: string) => {
    if (!avatar) return ''
    if (avatar.startsWith('http')) return avatar
    return `${BASE}${avatar}`
  }

  const topLeader = leadership.length > 0 ? leadership[0] : null
  const teamMembers = leadership.length > 1 ? leadership.slice(1) : []

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

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
        </div>
      )}

      {!loading && leadership.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{language === 'am' ? 'እስካሁን የአመራር አባላት አልተጨመሩም' : language === 'or' ? 'Amma iyyuu miseensonni hooggansa hin dabalamne' : 'No leadership members added yet'}</p>
        </div>
      )}

      {!loading && leadership.length > 0 && (
        <>
          {/* Top Leader - Featured */}
          {topLeader && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-12"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-brand-green/20 dark:border-brand-green/30 text-center hover:shadow-xl transition-all duration-300 group max-w-sm w-full">
                <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-5 ring-4 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all duration-300">
                  {topLeader.avatar ? (
                    <img
                      src={getImageUrl(topLeader.avatar)}
                      alt={topLeader.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full ${topLeader.color || 'bg-brand-green'} flex items-center justify-center text-white text-4xl font-bold`}>
                      {getInitial(topLeader.name)}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{topLeader.name}</h3>
                <p className="text-brand-green dark:text-brand-green-light font-medium text-base">{getRole(topLeader)}</p>
              </div>
            </motion.div>
          )}

          {/* Team Members */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {teamMembers.map((member) => (
              <StaggerItem key={member._id || member.name}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 text-center hover:shadow-card-hover transition-all duration-300 group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-brand-green/30 group-hover:scale-110 transition-all duration-300">
                    {member.avatar ? (
                      <img
                        src={getImageUrl(member.avatar)}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`w-full h-full ${member.color || 'bg-brand-green'} flex items-center justify-center text-white text-2xl font-bold`}>
                        {getInitial(member.name)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                  <p className="text-sm text-brand-green dark:text-brand-green-light font-medium">{getRole(member)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      )}

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