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
  | 'downloads'
  | 'faq'
  | 'contact'
  | 'feedback'

export interface UseHomeScrollSpyOptions {
  sectionIds: HomeSectionId[]
  /** pixels from top for IntersectionObserver rootMargin */
  rootMarginTop?: number
  /** pick the most visible section if multiple are on screen */
  pickMostVisible?: boolean
}

export function useHomeScrollSpy({
  sectionIds,
  rootMarginTop = -120,
  pickMostVisible = true,
}: UseHomeScrollSpyOptions) {
  const [activeId, setActiveId] = useState<HomeSectionId>(sectionIds[0] ?? 'home')
  const reducedMotion = useMemo(() => getReducedMotion(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (reducedMotion) {
      // Minimal work when reduced motion is preferred.
      const firstExisting = sectionIds.find(id => document.getElementById(id))
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

        if (!pickMostVisible) {
          // If not picking most visible, choose the last intersecting.
          // This is stable enough for capsules.
          const visible = elements
            .map(x => ({ id: x.id, ratio: ratios.get(x.id) ?? 0 }))
            .filter(x => x.ratio > 0)

          if (visible.length) {
            visible.sort((a, b) => b.ratio - a.ratio)
            setActiveId(visible[0].id)
          }
          return
        }

        const visible = elements
          .map(x => ({ id: x.id, ratio: ratios.get(x.id) ?? 0 }))
          .filter(x => x.ratio > 0)

        if (!visible.length) return

        visible.sort((a, b) => b.ratio - a.ratio)
        setActiveId(visible[0].id)
      },
      {
        threshold: [0.08, 0.16, 0.24, 0.33, 0.5, 0.66, 0.8],
        root: null,
        rootMargin: `${rootMarginTop}px 0px -55% 0px`,
      }
    )

    for (const { el } of elements) observer.observe(el)

    return () => observer.disconnect()
  }, [sectionIds, rootMarginTop, reducedMotion, pickMostVisible])

  return activeId
}

export function scrollToHomeSection(id: HomeSectionId, offsetPx = 96) {
  const el = document.getElementById(id)
  if (!el) return

  const reducedMotion = getReducedMotion()
  const top = window.scrollY + el.getBoundingClientRect().top - offsetPx

  // Keep behavior consistent with prefers-reduced-motion.
  // Also avoid "jump" caused by instantaneous setting of scroll-behavior.
  window.scrollTo({
    top,
    behavior: reducedMotion ? 'auto' : 'smooth',
  })
}


