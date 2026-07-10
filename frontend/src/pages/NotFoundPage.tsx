import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NotFoundPage() {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `404 – Page Not Found | MESOB Center`
  }, [])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-9xl font-bold text-gradient-gov mb-4" aria-hidden>
            404
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t.errors.notFound}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {t.errors.notFoundMsg}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button size="lg" leftIcon={<Home className="h-5 w-5" />}>
                {t.common.backHome}
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="secondary" leftIcon={<Search className="h-5 w-5" />}>
                Browse Services
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

