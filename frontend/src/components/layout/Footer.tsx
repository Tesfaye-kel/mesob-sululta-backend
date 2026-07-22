import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, ExternalLink, Facebook, Twitter, Youtube, Send } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import MesobLogo, { EthiopiaEmblem } from '@/components/brand/MesobLogo'

export default function Footer() {
  const { t, language } = useLanguage()

  const quickLinks = [
    { labelEn: 'Home',          labelAm: 'መነሻ',          labelOr: 'Mana',            path: '/' },
    { labelEn: 'About Us',      labelAm: 'ስለ እኛ',         labelOr: "Waa'ee Keenya",   path: '/about' },
    { labelEn: 'Organization',  labelAm: 'ድርጅት',          labelOr: 'Dhaabbata',       path: '/organization' },
    { labelEn: 'News', labelAm: 'ዜና',     labelOr: 'Beeksisaalee',    path: '/news' },
    { labelEn: 'Gallery',       labelAm: 'ጋለሪ',           labelOr: 'Galerii',         path: '/gallery' },
    { labelEn: 'FAQ',           labelAm: 'ጥያቄዎች',        labelOr: 'Gaaffilee',       path: '/faq' },
    { labelEn: 'Contact',       labelAm: 'ያናግሩን',         labelOr: 'Nu Qunnamaa',     path: '/contact' },
  ]

  const serviceLinks = [
    { labelEn: 'National ID',           labelAm: 'ብሔራዊ መታወቂያ',   labelOr: 'ID Biyyoolessa',     path: '/tajaajila' },
    { labelEn: 'Passport Services',     labelAm: 'የፓስፖርት አገልግሎቶች', labelOr: 'Tajaajila Paasipoorti', path: '/tajaajila' },
    { labelEn: 'Business Registration', labelAm: 'የንግድ ምዝገባ',      labelOr: 'Galmee Daldalaa',    path: '/tajaajila' },
    { labelEn: 'TIN Registration',      labelAm: 'TIN ምዝገባ',       labelOr: 'Galmee TIN',         path: '/tajaajila' },
    { labelEn: 'Civil Registration',    labelAm: 'የሲቪል ምዝገባ',      labelOr: 'Galmee Sivilii',     path: '/tajaajila' },
    { labelEn: 'Digital Payments',      labelAm: 'ዲጂታል ክፍያዎች',    labelOr: 'Kaffaltii Dijitaalaa', path: '/tajaajila' },
  ]

  const legalLinks = [
    { labelEn: 'Privacy Policy', labelAm: 'የግላዊነት ፖሊሲ',    labelOr: 'Imaammata Dhuunfaa',  path: '/privacy' },
    { labelEn: 'Terms of Use',   labelAm: 'የአጠቃቀም ውሎች',    labelOr: 'Hayyama Fayyadamuu',  path: '/terms' },
    { labelEn: 'Accessibility',  labelAm: 'ተደራሽነት',         labelOr: 'Dhaqqabbii',          path: '/accessibility' },
    { labelEn: 'FAQ',            labelAm: 'ጥያቄዎች',           labelOr: 'Gaaffilee',           path: '/faq' },
    { labelEn: 'Feedback',       labelAm: 'አስተያየት',          labelOr: 'Yaada',               path: '/feedback' },
    { labelEn: 'Contact',        labelAm: 'ያናግሩን',           labelOr: 'Nu Qunnamaa',         path: '/contact' },
  ]

  const govPortalsLabel = language === 'am' ? 'የመንግሥት ፖርታሎች' : language === 'or' ? 'Poortaaloota Mootummaa' : 'Government Portals'
  const followUsLabel   = language === 'am' ? 'ይከተሉን:'          : language === 'or' ? 'Nu Hordofaa:'          : 'Follow us:'

  const getLabel = (link: { labelEn: string; labelAm: string; labelOr: string }) =>
    language === 'am' ? link.labelAm : language === 'or' ? link.labelOr : link.labelEn

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300" aria-label="Site footer">
      <div className="h-1.5 bg-gradient-to-r from-brand-green via-brand-gold to-brand-red" aria-hidden />

      <div className="container-gov pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <MesobLogo size={44} />
              <div>
                <p className="font-bold text-white text-base leading-tight">{t.siteName}</p>
                <p className="text-xs text-gray-400 leading-tight">{t.siteTagline}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">{t.oneStopShop}.</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" aria-hidden />
                <span>
                  {language === 'am' ? 'ዋና መንገድ፣ ሱሉልታ ከተማ፣ ኦሮሚያ ክልል' :
                   language === 'or' ? 'Karaa Guddaa, Magaalaa Sululta, Oromiyaa' :
                   'Main Road, Sululta Town, Oromia Region'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-brand-gold shrink-0" aria-hidden />
                <a href="tel:+251111110000" className="hover:text-white transition-colors">+251 11 111 0000</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-brand-gold shrink-0" aria-hidden />
                <a href="mailto:info@mesob-sululta.gov.et" className="hover:text-white transition-colors break-all">
                  info@mesob-sululta.gov.et
                </a>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p>{t.common.workingHours}</p>
                  <p>{t.common.workingHoursSat}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2" role="list">
              {quickLinks.map(link => (
                <li key={link.path + link.labelEn}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-150 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-gold shrink-0" aria-hidden />
                    {getLabel(link)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.footer.services}</h3>
            <ul className="space-y-2" role="list">
              {serviceLinks.map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-150 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-gold shrink-0" aria-hidden />
                    {getLabel(link)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Gov portals */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2 mb-6" role="list">
              {legalLinks.map(link => (
                <li key={link.path + link.labelEn}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-150 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-gold shrink-0" aria-hidden />
                    {getLabel(link)}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">{govPortalsLabel}</h3>
            <ul className="space-y-2" role="list">
              {[
                { label: 'PMO Ethiopia',      url: 'https://pmo.gov.et' },
                { label: 'National ID Portal', url: 'https://id.gov.et' },
                { label: 'ENA News Agency',    url: 'https://ena.et' },
              ].map(link => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <EthiopiaEmblem size={28} />
              <div className="text-xs text-gray-500">
                <p>{t.footer.copyright}</p>
                <p>{t.footer.rights}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{followUsLabel}</span>
              {[
                { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com/mesobsululta' },
                { Icon: Twitter,  label: 'Twitter/X', href: 'https://twitter.com/mesobsululta' },
                { Icon: Youtube,  label: 'YouTube',   href: 'https://youtube.com/@mesobsululta' },
                { Icon: Send,     label: 'Telegram',  href: 'https://t.me/mesobsululta' },
              ].map(({ Icon, label, href }) => (
                <a key={label} href={href} aria-label={label} className="p-2 rounded-lg bg-gray-800 hover:bg-brand-green text-gray-400 hover:text-white transition-all duration-200">
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
