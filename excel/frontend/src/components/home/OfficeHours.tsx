import { Clock, MapPin, Phone, Mail } from 'lucide-react'
import AnimatedSection from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'

function getCurrentDayIndex() { return new Date().getDay() }

export default function OfficeHours() {
  const { t, language } = useLanguage()
  const todayJs = getCurrentDayIndex()
  const scheduleDayIndex = todayJs === 0 ? 6 : todayJs - 1

  const schedule = [
    { dayEn: 'Monday',    dayAm: 'ሰኞ',    dayOr: 'Wiixata',  hours: '8:30 AM – 5:30 PM', open: true },
    { dayEn: 'Tuesday',   dayAm: 'ማክሰኞ',  dayOr: 'Kibxata',  hours: '8:30 AM – 5:30 PM', open: true },
    { dayEn: 'Wednesday', dayAm: 'እሮብ',   dayOr: 'Roobii',   hours: '8:30 AM – 5:30 PM', open: true },
    { dayEn: 'Thursday',  dayAm: 'ሐሙስ',   dayOr: 'Kamiisa',  hours: '8:30 AM – 5:30 PM', open: true },
    { dayEn: 'Friday',    dayAm: 'አርብ',    dayOr: 'Jimaata',  hours: '8:30 AM – 5:30 PM', open: true },
    { dayEn: 'Saturday',  dayAm: 'ቅዳሜ',   dayOr: 'Sanbata',  hours: '8:30 AM – 12:00 PM', open: true },
    { dayEn: 'Sunday',    dayAm: 'እሑድ',   dayOr: 'Dilbata',
      hours: language === 'am' ? 'ዝግ' : language === 'or' ? 'Cufaa' : 'Closed', open: false },
  ]

  const todayLabel = language === 'am' ? '(ዛሬ)' : language === 'or' ? '(Har\'a)' : '(Today)'

  return (
    <section className="section-padding bg-brand-green text-white" aria-label={t.contact.hours}>
      <div className="container-gov">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Hours */}
          <AnimatedSection variant="fadeLeft">
            <div>
              <span className="gov-badge bg-white/15 text-white mb-4 inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {t.contact.hours}
              </span>
              <h2 className="text-3xl font-bold mb-6">{t.common.workingHoursTitle}</h2>
              <div className="space-y-2">
                {schedule.map((item, i) => {
                  const day = language === 'am' ? item.dayAm : language === 'or' ? item.dayOr : item.dayEn
                  return (
                    <div key={item.dayEn} className={`flex items-center justify-between p-3 rounded-xl transition-all ${i === scheduleDayIndex ? 'bg-white/20 border border-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-3">
                        {i === scheduleDayIndex && <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse shrink-0" aria-hidden />}
                        <span className={`font-medium ${!item.open ? 'text-white/50' : i === scheduleDayIndex ? 'text-white font-bold' : 'text-white/90'}`}>
                          {day}
                          {i === scheduleDayIndex && <span className="ml-2 text-xs text-brand-gold font-semibold">{todayLabel}</span>}
                        </span>
                      </div>
                      <span className={`text-sm ${!item.open ? 'text-white/40' : 'text-white/90'}`}>{item.hours}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* Contact */}
          <AnimatedSection variant="fadeRight" delay={0.2}>
            <div>
              <h2 className="text-3xl font-bold mb-6">{t.common.visitContact}</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl">
                  <MapPin className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold mb-0.5">{t.contact.address}</p>
                    <p className="text-white/80 text-sm">
                      {language === 'am' ? 'ዋና መንገድ፣ ሱሉልታ ከተማ፣ ኦሮሚያ ክልል፣ ኢትዮጵያ' :
                       language === 'or' ? 'Karaa Guddaa, Magaalaa Sululta, Oromiyaa, Itoophiyaa' :
                       'Main Road, Sululta Town, Oromia Region, Ethiopia'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                  <Phone className="h-6 w-6 text-brand-gold shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold mb-0.5">{t.contact.phone}</p>
                    <a href="tel:+251111110000" className="text-white/80 text-sm hover:text-white transition-colors">+251 11 111 0000</a>
                    <span className="text-white/50 mx-2 text-sm">|</span>
                    <a href="tel:911" className="text-red-300 text-sm font-semibold hover:text-white transition-colors">
                      {language === 'am' ? 'አስቸኳይ: 911' : language === 'or' ? 'Hatattama: 911' : 'Emergency: 911'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                  <Mail className="h-6 w-6 text-brand-gold shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold mb-0.5">{t.contact.email}</p>
                    <a href="mailto:info@mesob-sululta.gov.et" className="text-white/80 text-sm hover:text-white transition-colors">info@mesob-sululta.gov.et</a>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl h-48 flex items-center justify-center border border-white/20">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-brand-gold mx-auto mb-2" aria-hidden />
                  <p className="text-white/70 text-sm">
                    {language === 'am' ? 'ካርታ እይታ' : language === 'or' ? 'Mul\'ata Kaartaa' : 'Map View'}
                  </p>
                  <p className="text-white/50 text-xs">
                    {language === 'am' ? 'ሱሉልታ ከተማ፣ ኦሮሚያ' : language === 'or' ? 'Magaalaa Sululta, Oromiyaa' : 'Sululta Town, Oromia'}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
