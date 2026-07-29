import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Star, CheckCircle, MessageSquare, ThumbsUp, AlertCircle, Lightbulb } from 'lucide-react'
import AnimatedSection from '@/components/common/AnimatedSection'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const schema = z.object({
  type: z.enum(['suggestion', 'complaint', 'compliment', 'general']),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  service: z.string().min(1, 'Please select a service'),
  rating: z.number().min(1).max(5),
  message: z.string().min(20, 'Please provide more detail (at least 20 characters)'),
  anonymous: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function FeedbackSection() {
  const { t, language } = useLanguage()

  const feedbackTypes = [
    { value: 'compliment', icon: ThumbsUp,      label: t.feedback.compliment, color: 'border-brand-green text-brand-green bg-brand-green/5 dark:bg-brand-green/10',  activeColor: 'bg-brand-green text-white border-brand-green' },
    { value: 'suggestion', icon: Lightbulb,     label: t.feedback.suggestion, color: 'border-brand-gold text-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10',      activeColor: 'bg-brand-gold text-white border-brand-gold' },
    { value: 'complaint',  icon: AlertCircle,   label: t.feedback.complaint,  color: 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10',                      activeColor: 'bg-red-500 text-white border-red-500' },
    { value: 'general',    icon: MessageSquare, label: t.feedback.rate,       color: 'border-brand-blue text-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10',       activeColor: 'bg-brand-blue text-white border-brand-blue' },
  ]

  const serviceOptions = [
    language === 'am' ? 'ብሔራዊ መታወቂያ' : language === 'or' ? 'ID Biyyoolessa'       : 'National ID',
    language === 'am' ? 'ፓስፖርት'        : language === 'or' ? 'Paasipoorti'           : 'Passport',
    language === 'am' ? 'የንግድ ምዝገባ'    : language === 'or' ? 'Galmee Daldalaa'       : 'Business Registration',
    language === 'am' ? 'TIN ምዝገባ'     : language === 'or' ? 'Galmee TIN'            : 'TIN',
    language === 'am' ? 'የሲቪል ምዝገባ'   : language === 'or' ? 'Galmee Sivilii'        : 'Civil Registration',
    language === 'am' ? 'የመሬት አገልግሎቶች': language === 'or' ? 'Tajaajila Lafaa'       : 'Land Services',
    language === 'am' ? 'ሌላ'            : language === 'or' ? 'Kan biraa'             : 'Other',
  ]

  const ratingLabels = language === 'am'
    ? ['','ደካማ','መካከለኛ','ጥሩ','በጣም ጥሩ','እጹብ ድንቅ']
    : language === 'or'
    ? ['','Dadhabaa','Giddu','Gaarii','Baay\'ee Gaarii','Ajaa\'ibaa']
    : ['','Poor','Fair','Good','Very Good','Excellent']

  const feedbackTypeLabel = language === 'am' ? 'የአስተያየት ዓይነት' : language === 'or' ? 'Gosa Yaadaa'     : 'Feedback Type'
  const ratingLabel       = language === 'am' ? 'አጠቃላይ ደረጃ'     : language === 'or' ? 'Sadarkaa Waliigalaa' : 'Overall Rating'
  const serviceLabel      = language === 'am' ? 'የተጠቀሙበት አገልግሎት': language === 'or' ? 'Tajaajila Fayyadamtan' : 'Service Used'
  const selectService     = language === 'am' ? 'አገልግሎት ይምረጡ...' : language === 'or' ? 'Tajaajila filadhu...' : 'Select a service...'
  const thankYouTitle     = language === 'am' ? 'ለአስተያየትዎ እናመሰግናለን!' : language === 'or' ? "Yaadaaf Galatoomi!" : 'Thank You for Your Feedback!'
  const thankYouDesc      = language === 'am' ? 'አስተያየትዎ አገልግሎቶቻችንን ለማሻሻል ይረዳናል።' : language === 'or' ? "Yaadni kee tajaajila keenya foyyeessuuf nu gargaara." : 'Your feedback helps us improve our services.'
  const submitAnother     = language === 'am' ? 'ሌላ አስተያየት ያስገቡ' : language === 'or' ? 'Yaada Biraa Galchi' : 'Submit Another Feedback'
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general', rating: 0, anonymous: false },
  })

  const currentType = watch('type')
  const currentRating = watch('rating')
  const isAnonymous = watch('anonymous')

  const onSubmit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="container-gov max-w-2xl">
      {submitted ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
          <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-brand-green" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{thankYouTitle}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">{thankYouDesc}</p>
          <Button onClick={() => setSubmitted(false)}>{submitAnother}</Button>
        </motion.div>
      ) : (
        <AnimatedSection variant="fadeUp">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{feedbackTypeLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {feedbackTypes.map(ft => (
                    <button key={ft.value} type="button" onClick={() => setValue('type', ft.value as FormData['type'])}
                      className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200', currentType === ft.value ? ft.activeColor : ft.color)}>
                      <ft.icon className="h-5 w-5" aria-hidden />
                      <span className="text-xs font-semibold">{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{ratingLabel}</label>
                <div className="flex gap-2" role="group" aria-label={ratingLabel}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button"
                      onClick={() => setValue('rating', star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${star} / 5`}>
                      <Star className={cn('h-8 w-8 transition-colors', (hoveredStar || currentRating) >= star ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-gray-600')} aria-hidden />
                    </button>
                  ))}
                  {currentRating > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 self-center">
                      {ratingLabels[currentRating]}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{serviceLabel}</label>
                <select {...register('service')} className="input-gov" aria-label={serviceLabel}>
                  <option value="">{selectService}</option>
                  {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.service.message}</p>}
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center gap-3">
                <button type="button" role="switch" aria-checked={isAnonymous}
                  onClick={() => setValue('anonymous', !isAnonymous)}
                  className={cn('relative w-11 h-6 rounded-full transition-colors duration-200', isAnonymous ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700')}>
                  <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200', isAnonymous ? 'translate-x-6' : 'translate-x-1')} aria-hidden />
                </button>
                <label className="text-sm text-gray-700 dark:text-gray-300">{t.feedback.anonymous}</label>
              </div>

              {!isAnonymous && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label={t.common.phoneOptional.replace('Phone', t.contact.name)} placeholder={language === 'am' ? 'ስምዎ' : language === 'or' ? "Maqaa kee" : 'Your name'} {...register('name')} />
                  <Input label={t.common.emailAddress} type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
                </motion.div>
              )}

              <Textarea
                label={t.feedback.title}
                placeholder={language === 'am' ? 'ልምድዎን ያጋሩ...' : language === 'or' ? "Muuxannoo kee qoodi..." : 'Please share your experience...'}
                rows={5} error={errors.message?.message} {...register('message')} />

              <Button type="submit" size="lg" className="w-full" loading={loading} leftIcon={<MessageSquare className="h-4 w-4" aria-hidden />}>
                {t.feedback.submit}
              </Button>
            </form>
          </div>
        </AnimatedSection>
      )}
    </div>
  )
}
