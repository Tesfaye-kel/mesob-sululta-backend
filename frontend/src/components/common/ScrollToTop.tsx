import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the main content area on every route change.
 * If location.state.scrollTo is set, scrolls to that section instead.
 * Place this once inside <BrowserRouter>, before any routes.
 */
export default function ScrollToTop() {
  const { pathname, state } = useLocation()

  useEffect(() => {
    const scrollTarget = (state as { scrollTo?: string } | null)?.scrollTo

    // Let the route/page render first to avoid jumpy transitions.
    const t = window.setTimeout(() => {
      if (scrollTarget) {
        const el = document.getElementById(scrollTarget)
        if (el) {
          const navHeight = 96 // h-20 + buffer
          const top = window.scrollY + el.getBoundingClientRect().top - navHeight
          window.scrollTo({ top, behavior: 'smooth' })
          return
        }
      }

      const main = document.getElementById('main-content')
      if (main) {
        const top = main.getBoundingClientRect().top + window.scrollY - 16
        window.scrollTo({ top, behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 200) // slightly longer to ensure sections are rendered
    return () => window.clearTimeout(t)
  }, [pathname, state])

  return null   
}
