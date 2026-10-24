import { Star, Quote } from 'lucide-react'
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

  const getText = (item: typeof testimonials[0]) => ({
    role:    language === 'am' ? item.roleAm    : language === 'or' ? item.roleOr    : item.roleEn,
    location:language === 'am' ? item.locationAm: language === 'or' ? item.locationOr: item.locationEn,
    content: language === 'am' ? item.contentAm : language === 'or' ? item.contentOr : item.contentEn,
  })

  const renderCards = (duplicate = false) => (
    <div className="flex w-max shrink-0 gap-6 pr-6" role={duplicate ? undefined : 'list'} aria-hidden={duplicate || undefined}>
      {testimonials.map(item => {
        const tx = getText(item)
        return (
          <article
            key={`${duplicate ? 'duplicate-' : ''}${item.id}`}
            role={duplicate ? undefined : 'listitem'}
            className="relative flex min-h-[250px] w-[min(82vw,22rem)] shrink-0 flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-card dark:border-gray-700 dark:bg-gray-800"
          >
            <Quote className="absolute right-4 top-4 h-8 w-8 text-brand-green/10" aria-hidden />
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${item.avatarColor}`}>
                {item.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tx.role} • {tx.location}</p>
              </div>
            </div>
            <div className="mb-3 flex gap-0.5" aria-label={`Rating: ${item.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${index < item.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-200 dark:text-gray-600'}`}
                  aria-hidden
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">"{tx.content}"</p>
          </article>
        )
      })}
    </div>
  )

  return (
    <section className="section-padding" aria-label={t.common.testimonials}>
      <div className="container-gov">
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light mb-3">
            {t.common.testimonials}
          </span>
        </AnimatedSection>

        <div className="overflow-hidden" aria-label={t.common.testimonials}>
          <div className="testimonials-marquee-track">
            {renderCards()}
            {renderCards(true)}
          </div>
        </div>
      </div>
    </section>
  )
}
