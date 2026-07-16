export type AnchorId = string

export const HOME_ANCHORS = [
  'home',
  'about',
  'services',
  'organization',
  'announcements',
  'gallery',
  'downloads',
  'faq',
  'contact',
  'feedback',
] as const

export type HomeAnchorId = (typeof HOME_ANCHORS)[number]

