export type AnchorId = string

export const HOME_ANCHORS = [
  'home',
  'about',
  'services',
  'organization',
  'announcements',
  'gallery',
  'faq',
  'contact',
  'feedback',
] as const

export type HomeAnchorId = (typeof HOME_ANCHORS)[number]

