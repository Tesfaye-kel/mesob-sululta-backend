import { motion } from 'framer-motion'
import AnimatedSection from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'

const partners = [
  { nameEn: 'National ID Authority',      nameAm: 'የብሔራዊ መታወቂያ ባለሥልጣን',  nameOr: 'Abbaa Taayitaa ID Biyyoolessa', abbr: 'NIDA', color: 'bg-brand-green/10 text-brand-green' },
  { nameEn: 'Ministry of Trade',           nameAm: 'የንግድ ሚኒስቴር',              nameOr: 'Ministeera Daldala',            abbr: 'MOT',  color: 'bg-brand-blue/10 text-brand-blue' },
  { nameEn: 'Ethiopian Revenue Authority', nameAm: 'የኢትዮጵያ ገቢዎች ባለሥልጣን',   nameOr: 'Abbaa Taayitaa Galii Itoophiyaa', abbr: 'ERCA', color: 'bg-brand-gold/10 text-brand-gold' },
  { nameEn: 'Immigration & Nationality',   nameAm: 'ኢሚግሬሽን እና ዜግነት',         nameOr: 'Sochiitii fi Lammummaa',         abbr: 'DIIN', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  { nameEn: 'Oromia Regional State',       nameAm: 'የኦሮሚያ ክልላዊ መንግሥት',      nameOr: 'Mootummaa Naannoo Oromiyaa',    abbr: 'ORS',  color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
  { nameEn: 'Commercial Bank Ethiopia',    nameAm: 'የኢትዮጵያ ኮሜርሻል ባንክ',      nameOr: 'Baankii Daldalaa Itoophiyaa',  abbr: 'CBE',  color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  { nameEn: 'Ethio Telecom',               nameAm: 'ኢትዮ ቴሌኮም',               nameOr: 'Ethio Telecom',                abbr: 'ET',   color: 'bg-brand-blue/10 text-brand-blue' },
  { nameEn: 'Ministry of Land',            nameAm: 'የመሬት ሚኒስቴር',              nameOr: 'Ministeera Lafaa',              abbr: 'MOL',  color: 'bg-brand-green/10 text-brand-green' },
]

export default function Partners() {
  const { language, t } = useLanguage()

  return (
    <section className="py-12 bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700" aria-label={t.common.partners}>
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="text-center mb-8">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t.common.partners}
          </p>
        </AnimatedSection>
        <div className="flex flex-wrap justify-center gap-4">
          {partners.map((partner, i) => {
            const name = language === 'am' ? partner.nameAm : language === 'or' ? partner.nameOr : partner.nameEn
            return (
              <motion.div
                key={partner.abbr}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 ${partner.color} hover:shadow-md transition-all duration-200`}
                title={name}
              >
                <span className="font-bold text-sm">{partner.abbr}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">{name}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
