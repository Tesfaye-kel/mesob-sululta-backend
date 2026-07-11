import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import AnimatedSection from '@/components/common/AnimatedSection'
import { useLanguage } from '@/contexts/LanguageContext'

const testimonials = [
  {
    id: 1, name: 'Almaz Bekele', avatar: 'A', avatarColor: 'bg-brand-green',
    roleEn: 'Small Business Owner', roleAm: 'የአነስተኛ ንግድ ባለቤት', roleOr: 'Abbaa Daldala Xixiqqaa',
    locationEn: 'Sululta', locationAm: 'ሱሉልታ', locationOr: 'Sululta',
    contentEn: 'I registered my business in just 5 days! Previously it took weeks. MESOB Center has truly transformed government service delivery in our area.',
    contentAm: 'ንግዴን በ5 ቀናት ብቻ ተመዝግቤ! ቀደም ሲል ሳምንታትን ይወስድ ነበር። MESOB ማዕከል በእርግጥ የመንግሥት አገልግሎት አሰጣጥን ለውጧል።',
    contentOr: "Daldala koo guyyaa 5 qofatti galmeesse! Duraan torbanootaa fudhata ture. Giddaan MESOB tajaajila mootummaa naannoo keenya keessatti jijjiire.",
    rating: 5,
  },
  {
    id: 2, name: 'Demeke Tadesse', avatar: 'D', avatarColor: 'bg-brand-blue',
    roleEn: 'Farmer', roleAm: 'ገበሬ', roleOr: 'Qonnaan Bulaa',
    locationEn: 'Sululta Woreda', locationAm: 'ሱሉልታ ወረዳ', locationOr: 'Aanaa Sululta',
    contentEn: 'Getting my land certificate was so simple and straightforward. The staff were very helpful and professional. I recommend MESOB to everyone.',
    contentAm: 'የመሬት ምስክር ወረቀቴን ማግኘት በጣም ቀላልና ቀጥተኛ ነበር። ሠራተኞቹ በጣም ጠቃሚና ሙያዊ ነበሩ። MESOB ለሁሉም እመክራለሁ።',
    contentOr: "Ragaa lafa koo argachuun salphaa fi kallattii ture. Hojjettoonni gargaaroo fi ogeeyyii turan. MeSOB hundaaf nan gorse.",
    rating: 5,
  },
  {
    id: 3, name: 'Fatuma Haji', avatar: 'F', avatarColor: 'bg-brand-gold',
    roleEn: 'Teacher', roleAm: 'መምህር', roleOr: 'Barsiisaa',
    locationEn: 'Sululta Town', locationAm: 'ሱሉልታ ከተማ', locationOr: 'Magaalaa Sululta',
    contentEn: 'I was able to get my National ID card renewed in 3 days. No long queues, no running around. This is exactly what citizens needed.',
    contentAm: 'የብሔራዊ መታወቂያ ካርዴን በ3 ቀናት ማደስ ቻልኩ። ረዘም ያሉ ሰልፎች የሉም፣ ሩጫ የለም። ዜጎች ፍላጎቱ ይህ ነበር።',
    contentOr: "Kaardii ID biyyoolessa koo guyyaa 3 keessatti haaromfachuu danda'e. Sarara dheeraa fi fiigichaa hin jiru. Kun lammiileen barbaadanidha.",
    rating: 5,
  },
  {
    id: 4, name: 'Girma Worku', avatar: 'G', avatarColor: 'bg-purple-600',
    roleEn: 'Investor', roleAm: 'ባለሀብት', roleOr: 'Invastara',
    locationEn: 'Sululta Industrial Zone', locationAm: 'ሱሉልታ ኢንዱስትሪ ዞን', locationOr: 'Naannoo Industirii Sululta',
    contentEn: 'The investment registration process was seamless. The ICT team guided us through the digital payment system efficiently.',
    contentAm: 'የኢንቨስትመንት ምዝገባ ሂደቱ ቀላልና ሲቀላቀሉ ምንም ዓይነት ችግር አልነበረም። የICT ቡድን ዲጂታል ክፍያ ስርዓቱ ውስጥ ቀልጣፋ ሁኔታ ሲያልፉ ክትትል አድርጓቸዋል።',
    contentOr: "Galmeensa invastimantii salphaa ture. Gareen ICT sirna kaffaltii dijitaalaa keessa nu qajeelche.",
    rating: 5,
  },
  {
    id: 5, name: 'Tigist Haile', avatar: 'T', avatarColor: 'bg-teal-600',
    roleEn: 'Entrepreneur', roleAm: 'ሥራ ፈጣሪ', roleOr: 'Girmaamsaa',
    locationEn: 'Sululta', locationAm: 'ሱሉልታ', locationOr: 'Sululta',
    contentEn: 'The multilingual support in Amharic and Afaan Oromo makes it very accessible for everyone in our community.',
    contentAm: 'የብዙ ቋንቋ ድጋፍ በአማርኛ እና አፋን ኦሮሞ ለሁሉም ሰው በጣም ቀላሉ ለማግኘት ያደርጋል።',
    contentOr: 'Deeggarsi afaan hedduu Amaariffaa fi Afaan Oromootiin hawaasa keenya keessa hundaaf dhaqqabamaa godha.',
    rating: 4,
  },
]

export default function Testimonials() {
  const { language, t } = useLanguage()
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000)
    return () => clearInterval(timer)
  }, [autoPlay])

  const prev = () => { setAutoPlay(false); setCurrent(c => (c - 1 + testimonials.length) % testimonials.length) }
  const next = () => { setAutoPlay(false); setCurrent(c => (c + 1) % testimonials.length) }
  const visible = Array.from({ length: 3 }, (_, i) => testimonials[(current + i) % testimonials.length])

  const getText = (item: typeof testimonials[0]) => ({
    role:    language === 'am' ? item.roleAm    : language === 'or' ? item.roleOr    : item.roleEn,
    location:language === 'am' ? item.locationAm: language === 'or' ? item.locationOr: item.locationEn,
    content: language === 'am' ? item.contentAm : language === 'or' ? item.contentOr : item.contentEn,
  })

  return (
    <section className="section-padding" aria-label={t.common.testimonials}>
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light mb-3">
            {t.common.testimonials}
          </span>
          <h2 className="section-title text-center">{t.common.whatCitizensSay}</h2>
          <p className="section-subtitle mx-auto text-center">{t.common.whatCitizensSaySubtitle}</p>
        </AnimatedSection>

        <div className="relative">
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {visible.map((item, i) => {
                const tx = getText(item)
                return (
                  <motion.div key={`${item.id}-${current}-${i}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-card relative"
                  >
                    <Quote className="absolute top-4 right-4 h-8 w-8 text-brand-green/10" aria-hidden />
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${item.avatarColor}`}>{item.avatar}</div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tx.role} • {tx.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-3" aria-label={`Rating: ${item.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < item.rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-200 dark:text-gray-600'}`} aria-hidden />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{tx.content}"</p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div key={current}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-card"
              >
                {(() => { const tx = getText(testimonials[current]); return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${testimonials[current].avatarColor}`}>{testimonials[current].avatar}</div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{testimonials[current].name}</p>
                        <p className="text-xs text-gray-500">{tx.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{tx.content}"</p>
                  </>
                )})()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-200" aria-label="Previous">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex gap-2" role="tablist">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => { setAutoPlay(false); setCurrent(i) }}
                  className={`transition-all duration-200 rounded-full ${i === current ? 'w-6 h-2 bg-brand-green' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-brand-green/50'}`}
                  aria-label={`Go to testimonial ${i + 1}`} role="tab" aria-selected={i === current} />
              ))}
            </div>
            <button onClick={next} className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-200" aria-label="Next">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
