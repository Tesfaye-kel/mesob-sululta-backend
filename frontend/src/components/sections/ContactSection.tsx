import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, Facebook, Twitter, Linkedin, ExternalLink, ArrowRight } from 'lucide-react'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { getContact, getSocialMedia, type ContactContent, type SocialMediaPlatform } from '@/api/tajaajila'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(5),
  message: z.string().min(20),
})

type FormData = z.infer<typeof schema>

interface ContactSectionProps {
  compact?: boolean
  showHeader?: boolean
}

export default function ContactSection({ compact = false, showHeader = true }: ContactSectionProps) {
  const { t, language } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contact, setContact] = useState<ContactContent | null>(null)
  const [socialMedia, setSocialMedia] = useState<SocialMediaPlatform[]>([])

  useEffect(() => {
    getContact()
      .then(setContact)
      .catch(() => {}) // silently fail, fallback to hardcoded defaults
    getSocialMedia()
      .then(data => setSocialMedia(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${BASE}/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'contact' }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setSubmitted(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  const address = contact?.address?.[language] || contact?.address?.en || 'Main Road, Sululta Town, Oromia, Ethiopia'
  const phone = contact?.phone || '+251 11 111 0000'
  const email = contact?.email || 'info@mesob-sululta.gov.et'
  const hours = contact?.workingHours?.[language] || contact?.workingHours?.en || 'Mon–Fri: 8:30 AM – 5:30 PM\nSat: 8:30 AM – 12:00 PM'
  const activeSocial = socialMedia
    .filter(item => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const socialIcon = (icon: string) => {
    const name = icon.toLowerCase()
    const props = { className: 'h-7 w-7', 'aria-hidden': true as const }
    if (name.includes('facebook')) return <Facebook {...props} />
    if (name.includes('twitter') || name === 'x') return <Twitter {...props} />
    if (name.includes('linkedin')) return <Linkedin {...props} />
    if (name.includes('telegram') || name.includes('send')) return <Send {...props} />
    return <ExternalLink {...props} />
  }

  const content = (
    <div className="container-gov">
      {showHeader && (
        <AnimatedSection variant="fadeUp" className="text-center mb-12">
          <span className="gov-badge bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light mb-3">
            Get in Touch
          </span>
          <h2 className="section-title">{t.contact.title}</h2>
          <p className="section-subtitle mx-auto">{t.contact.subtitle}</p>
        </AnimatedSection>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <AnimatedSection variant="fadeLeft">
          <div className="space-y-4">
            {[
              { icon: MapPin, label: t.contact.address, value: address, color: 'bg-brand-green/10 text-brand-green' },
              { icon: Phone, label: t.contact.phone, value: phone, href: `tel:${phone.replace(/[^+\d]/g, '')}`, color: 'bg-brand-blue/10 text-brand-blue' },
              { icon: Mail, label: t.contact.email, value: email, href: `mailto:${email}`, color: 'bg-brand-gold/10 text-brand-gold' },
              { icon: Clock, label: t.contact.hours, value: hours, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-gray-900 dark:text-white font-medium hover:text-brand-green transition-colors">{item.value}</a>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium whitespace-pre-line">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Google Maps — Sululta */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
              <iframe
                title="MESOB Sululta Branch Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15731.23!2d38.7699!3d9.1763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85f2d9b5e5a9%3A0x0!2sSululta%2C+Ethiopia!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set"
                width="100%"
                height="260"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label="Map showing Sululta, Oromia, Ethiopia"
              />
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection variant="fadeRight" delay={0.2}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{t.contact.successMsg}</p>
                <Button onClick={() => setSubmitted(false)} variant="secondary">Send Another</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <Input label={t.contact.name} error={errors.name?.message} {...register('name')} />
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
                <Input label={t.contact.subject} error={errors.subject?.message} {...register('subject')} />
                <Textarea label={t.contact.message} rows={5} error={errors.message?.message} {...register('message')} />
                <Button type="submit" size="lg" className="w-full" loading={loading} leftIcon={<Send className="h-4 w-4" />}>
                  {t.contact.submit}
                </Button>
              </form>
            )}
          </div>
        </AnimatedSection>
      </div>

      {activeSocial.length > 0 && (
        <div className="mt-12 border-y border-gray-200 dark:border-gray-700 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center w-full">
            <div className="flex items-center justify-center gap-2 shrink-0 md:min-w-56 md:justify-start">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {language === 'or' ? 'Kanaan Nu Qunnamaa' : language === 'am' ? 'በእነዚህ ያግኙን' : 'Connect with us'}
              </span>
              <ArrowRight className="h-5 w-5 text-brand-green" aria-hidden />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {activeSocial.map(item => (
              <a
                key={item._id}
                href={item.url}
                target={item.openInNewTab ? '_blank' : undefined}
                rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                aria-label={item.platform}
                className="flex min-h-20 items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-brand-green hover:text-brand-green transition-colors"
              >
                {socialIcon(item.icon || item.platform)}
                <span className="font-semibold">{item.platform}</span>
              </a>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}