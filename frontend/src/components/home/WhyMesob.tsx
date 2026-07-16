import { Zap, Shield, Clock, Users, Award, Globe } from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'

const features = [
  {
    icon: Zap,
    titleEn: 'Fast & Efficient', titleAm: 'ፈጣን እና ውጤታማ', titleOr: 'Ariifataa fi Hojjetaa',
    descEn: 'Reduced waiting times with streamlined digital processes and queue management systems.',
    descAm: 'ዲጂታዊ ሂደቶች እና ሰዓት አስተዳደር ስርዓቶች ጋር ቀነሰ የመጠበቅ ጊዜ።',
    descOr: "Yeroo eeggannaa hir'atan sagantaa dijitaalaa fi sirna too'annaa sarara waliin.",
    color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  },
  {
    icon: Shield,
    titleEn: 'Secure & Trusted', titleAm: 'ደህንነቱ የተጠበቀ እና የሚታመን', titleOr: 'Nagaadhumaa fi Amanamaa',
    descEn: 'Government-grade security protocols protecting all citizen data and transactions.',
    descAm: 'ሁሉንም የዜጎች ዳታ እና ግብይቶች የሚጠብቁ የመንግሥት ደረጃ ደህንነት ፕሮቶኮሎች።',
    descOr: 'Praatookoloota tiswistrii sadarkaa mootummaa odeeffannoo lammiilee fi raawwii eegu.',
    color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  },
  {
    icon: Clock,
    titleEn: 'One-Stop Convenience', titleAm: 'አንድ ቦታ ምቾት', titleOr: "Baay'inaan Bakka Tokkotti",
    descEn: 'Access 50+ federal services in one location without visiting multiple offices.',
    descAm: 'ሁሉም ቢሮዎችን ሳይጎበኙ 50+ ፌዴራዊ አገልግሎቶችን በአንድ ቦታ ያግኙ።',
    descOr: 'Tajaajila federaalaa 50+ olis bakka tokkotti waajjiroota adda addaa osoo hin daawwatin argadhu.',
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Users,
    titleEn: 'Citizen-Centered', titleAm: 'ዜጎች ማዕከል ያደረገ', titleOr: 'Lammiilee Xiyyeeffatee',
    descEn: 'Services designed with citizens at the heart – accessible, inclusive, and dignified.',
    descAm: 'ዜጎችን ልቡ ያደረጉ አገልግሎቶች – ቀላሉ ለማግኘት፣ ሁሉም ሊጠቀምበት የሚችለው እና ክብር ያለው።',
    descOr: 'Tajaajilaaleen lammiileen onnee taasifaman – dhaqqabamoo, walqixxummaawaa fi kabajamaa.',
    color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  {
    icon: Award,
    titleEn: 'Quality Assured', titleAm: 'ጥራቱ የተረጋገጠ', titleOr: 'Qulqullina Mirkanaofame',
    descEn: '98% citizen satisfaction rating with ISO-compliant service standards.',
    descAm: '98% ዜጎች እርካታ ደረጃ ISO የሚሟሉ የአገልግሎት ደረጃዎች ጋር።',
    descOr: 'Sadarkaa quufinsa lammiilee 98% sadarkaa tajaajila ISO walii galu waliin.',
    color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  },
  {
    icon: Globe,
    titleEn: 'Multilingual Support', titleAm: 'ብዙ ቋንቋ ድጋፍ', titleOr: 'Deeggarsa Afaan Hedduu',
    descEn: 'Services available in English, Amharic, and Afaan Oromo for all citizens.',
    descAm: 'ለሁሉም ዜጎች በእንግሊዝኛ፣ አማርኛ እና አፋን ኦሮሞ አገልግሎቶች ይገኛሉ።',
    descOr: 'Tajaajilaaleen Afaan Ingliffaa, Amaariffaa fi Afaan Oromootiin lammiilee hunda dhaqqabsiifamu.',
    color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  },
]

export default function WhyMesob() {
  const { language, t } = useLanguage()

  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/30" aria-label={t.common.whyMesob}>
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300 mb-3">
            {t.common.whyMesob}
          </span>
          <h2 className="section-title text-center">{t.common.whyChoose}</h2>
          <p className="section-subtitle mx-auto text-center">{t.common.whyChooseSubtitle}</p>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            const title = language === 'am' ? feature.titleAm : language === 'or' ? feature.titleOr : feature.titleEn
            const desc  = language === 'am' ? feature.descAm  : language === 'or' ? feature.descOr  : feature.descEn
            return (
              <StaggerItem key={feature.titleEn}>
                <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
