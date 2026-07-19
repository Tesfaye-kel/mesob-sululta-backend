import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(20),
})

type FormData = z.infer<typeof schema>

interface ContactSectionProps {
  compact?: boolean
  showHeader?: boolean
}

export default function ContactSection({ compact = false, showHeader = true }: ContactSectionProps) {
  const { t } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
              { icon: MapPin, label: t.contact.address, value: 'Main Road, Sululta Town, Oromia, Ethiopia', color: 'bg-brand-green/10 text-brand-green' },
              { icon: Phone, label: t.contact.phone, value: '+251 11 111 0000', href: 'tel:+251111110000', color: 'bg-brand-blue/10 text-brand-blue' },
              { icon: Mail, label: t.contact.email, value: 'info@mesob-sululta.gov.et', href: 'mailto:info@mesob-sululta.gov.et', color: 'bg-brand-gold/10 text-brand-gold' },
              { icon: Clock, label: t.contact.hours, value: 'Mon–Fri: 8:30 AM – 5:30 PM\nSat: 8:30 AM – 12:00 PM', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' },
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
    </div>
  )

  if (compact) return content

  return <div className="section-padding">{content}</div>
}
