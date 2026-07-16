import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type FormData = z.infer<typeof schema>

export default function ContactPage() {
  const { t } = useLanguage()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = `Contact | MESOB Center – Sululta Branch`
  }, [])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSubmitted(true)
    reset()
  }

  return (
    <>
      <PageHeader
        title={t.contact.title}
        subtitle={t.contact.subtitle}
        breadcrumbs={[{ label: t.common.home, href: "/" }, { label: t.nav.contact }]}
      />

      <div className="section-padding">
        <div className="container-gov">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <AnimatedSection variant="fadeLeft">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Contact Information
                </h2>

                <div className="space-y-4 mb-8">
                  {[
                    {
                      icon: MapPin,
                      label: t.contact.address,
                      value: 'Main Road, Sululta Town, Oromia Region, Ethiopia',
                      color: 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light',
                    },
                    {
                      icon: Phone,
                      label: t.contact.phone,
                      value: '+251 11 111 0000',
                      href: 'tel:+251111110000',
                      color: 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300',
                    },
                    {
                      icon: Mail,
                      label: t.contact.email,
                      value: 'info@mesob-sululta.gov.et',
                      href: 'mailto:info@mesob-sululta.gov.et',
                      color: 'bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20',
                    },
                    {
                      icon: Clock,
                      label: t.contact.hours,
                      value: 'Mon–Fri: 8:30 AM – 5:30 PM\nSat: 8:30 AM – 12:00 PM',
                      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a href={item.href} className="text-gray-900 dark:text-white font-medium hover:text-brand-green dark:hover:text-brand-green-light transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-gray-900 dark:text-white font-medium whitespace-pre-line">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Emergency */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-0.5">{t.contact.emergency}</p>
                    <a href="tel:911" className="text-red-600 dark:text-red-300 font-bold text-xl">911</a>
                    <p className="text-red-600/70 dark:text-red-400/70 text-sm">Available 24/7</p>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="mt-6 bg-gradient-to-br from-brand-green/10 to-brand-blue/10 rounded-xl h-48 flex items-center justify-center border border-brand-green/20">
                  <div className="text-center">
                    <MapPin className="h-10 w-10 text-brand-green mx-auto mb-2" aria-hidden />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Sululta Town</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Oromia Region, Ethiopia</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Form */}
            <AnimatedSection variant="fadeRight" delay={0.2}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t.contact.sendMessage}
                </h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-brand-green" aria-hidden />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t.contact.successMsg}</p>
                    <Button onClick={() => setSubmitted(false)} variant="secondary">
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t.contact.name}
                        placeholder="Full Name"
                        error={errors.name?.message}
                        {...register('name')}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>
                    <Input
                      label="Phone (Optional)"
                      type="tel"
                      placeholder="+251 9XX XXX XXXX"
                      {...register('phone')}
                    />
                    <Input
                      label={t.contact.subject}
                      placeholder="How can we help you?"
                      error={errors.subject?.message}
                      {...register('subject')}
                    />
                    <Textarea
                      label={t.contact.message}
                      placeholder="Please describe your inquiry in detail..."
                      rows={5}
                      error={errors.message?.message}
                      {...register('message')}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      loading={loading}
                      leftIcon={<Send className="h-4 w-4" aria-hidden />}
                    >
                      {t.contact.submit}
                    </Button>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </>
  )
}


