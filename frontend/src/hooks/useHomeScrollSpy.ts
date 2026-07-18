import { useEffect, useMemo, useState } from 'react'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function getReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

export type HomeSectionId =
  | 'home'
  | 'about'
  | 'services'
  | 'organization'
  | 'announcements'
  | 'gallery'
  | 'faq'
  | 'contact'
  | 'feedback'

export interface UseHomeScrollSpyOptions {
  sectionIds: HomeSectionId[]
  /** pixels from top for IntersectionObserver rootMargin */
  rootMarginTop?: number
  /** pick the most visible section if multiple are on screen */
  pickMostVisible?: boolean
  /** offset from top where sections are considered "active" */
  activeOffset?: number
}

export function useHomeScrollSpy({
  sectionIds,
  rootMarginTop = -120,
  pickMostVisible = true,
  activeOffset = 100,
}: UseHomeScrollSpyOptions) {
  const [activeId, setActiveId] = useState<HomeSectionId>(sectionIds[0] ?? 'home')
  const [scrollProgress, setScrollProgress] = useState(0)
  const reducedMotion = useMemo(() => getReducedMotion(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (reducedMotion) {
      // Fallback: find first visible section on load
      const firstExisting = sectionIds.find(id => {
        const el = document.getElementById(id)
        if (!el) return false
        const rect = el.getBoundingClientRect()
        return rect.top < window.innerHeight && rect.bottom > 0
      })
      if (firstExisting) setActiveId(firstExisting)
      return
    }

    const elements = sectionIds
      .map(id => ({ id, el: document.getElementById(id) }))
      .filter((x): x is { id: HomeSectionId; el: HTMLElement } => Boolean(x.el))

    if (!elements.length) return

    const ratios = new Map<HomeSectionId, number>()

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id as HomeSectionId
          ratios.set(id, entry.intersectionRatio)
        }

        // Calculate scroll progress (0 to 1)
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const progress = docHeight > 0 ? window.scrollY / docHeight : 0
        setScrollProgress(clamp(progress, 0, 1))

        if (!pickMostVisible) {
          const visible = elements
            .map(x => ({ id: x.id, ratio: ratios.get(x.id) ?? 0 }))
            .filter(x => x.ratio > 0)

          if (visible.length) {
            visible.sort((a, b) => b.ratio - a.ratio)
            setActiveId(visible[0].id)
          }
          return
        }

        // Enhanced: use scroll position relative to each section
        let bestSection: HomeSectionId = sectionIds[0] ?? 'home'
        let bestScore = -Infinity

        for (const { id, el } of elements) {
          const rect = el.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          
          // How much of the section is visible
          const visibleTop = Math.max(0, rect.top)
          const visibleBottom = Math.min(viewportHeight, rect.bottom)
          const visibleHeight = Math.max(0, visibleBottom - visibleTop)
          const ratio = visibleHeight / rect.height

          // Distance from the active offset point (top of viewport + offset)
          const distanceFromOffset = Math.abs(rect.top - activeOffset)
          const distanceScore = Math.max(0, 1 - distanceFromOffset / viewportHeight)

          // Combine visibility ratio with distance score
          const score = ratio * 0.6 + distanceScore * 0.4

          if (score > bestScore) {
            bestScore = score
            bestSection = id
          }
        }

        setActiveId(bestSection)
      },
      {
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        root: null,
        rootMargin: `${rootMarginTop}px 0px -40% 0px`,
      }
    )

    for (const { el } of elements) observer.observe(el)

    return () => observer.disconnect()
  }, [sectionIds, rootMarginTop, reducedMotion, pickMostVisible, activeOffset])

  return { activeId, scrollProgress }
}

export function scrollToHomeSection(id: HomeSectionId, offsetPx = 96) {
  const el = document.getElementById(id)
  if (!el) return

  const reducedMotion = getReducedMotion()
  const top = window.scrollY + el.getBoundingClientRect().top - offsetPx

  window.scrollTo({
    top,
    behavior: reducedMotion ? 'auto' : 'smooth',
  })
}