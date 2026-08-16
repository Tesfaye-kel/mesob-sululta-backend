import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from '../i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations['en']
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'mesob-language'

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage unavailable — fail silently
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = safeGet(LANGUAGE_STORAGE_KEY)
    return (stored === 'en' || stored === 'am' || stored === 'or') ? stored : 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    safeSet(LANGUAGE_STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'am' ? 'am' : lang === 'or' ? 'om' : 'en'
  }

  useEffect(() => {
    document.documentElement.lang = language === 'am' ? 'am' : language === 'or' ? 'om' : 'en'
    if (language === 'am') {
      document.documentElement.classList.add('font-ethiopic')
    } else {
      document.documentElement.classList.remove('font-ethiopic')
    }
  }, [language])

  const t = translations[language] as typeof translations['en']
  const isRTL = false // Ethiopian languages are LTR

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}