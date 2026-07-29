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
    // Always scroll to top of home page on refresh so the navbar active state
    // correctly shows "Mana/Home".
    const scrollTarget = (state as { scrollTo?: string } | null)?.scrollTo

    const t = window.setTimeout(() => {
      if (scrollTarget) {
        const el = document.getElementById(scrollTarget)
        if (el) {
          const navHeight = 96
          const top = window.scrollY + el.getBoundingClientRect().top - navHeight
          window.scrollTo({ top, behavior: 'smooth' })
          return
        }
      }

      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 0)
    return () => window.clearTimeout(t)
  }, [pathname, state])

  return null
}
