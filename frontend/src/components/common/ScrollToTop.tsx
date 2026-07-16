import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls the window to the top on every route change.
 * Place this once inside <BrowserRouter>, before any routes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Let the route/page render first to avoid jumpy transitions.
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [pathname])

  return null
}
