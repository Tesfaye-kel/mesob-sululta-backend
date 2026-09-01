import { useEffect } from 'react'
import AboutSection from '@/components/sections/AboutSection'

export default function AboutPage() {
  useEffect(() => {
    document.title = `About | MESOB Center – Sululta Branch`
  }, [])

  return (
    <div>
      <div className="section-padding pt-0">
        <div className="container-gov">
        <AboutSection />
        </div>
      </div>
    </div>
  )
}