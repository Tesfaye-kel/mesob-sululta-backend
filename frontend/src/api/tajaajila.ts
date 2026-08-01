const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ContactContent {
  _id: string
  address: MultiLang
  phone: string
  email: string
  workingHours: MultiLang
  mapEmbedUrl: string
}

export interface MultiLang {
  en: string
  am: string
  or: string
}

export interface OrgRef {
  _id: string
  name: MultiLang
}

export interface WindowSummary {
  _id: string
  number: string
  floor: number
  serviceCount: number
  description: MultiLang
  organization: OrgRef
}

export interface WindowGroupedByFloor {
  floor: number
  windows: WindowSummary[]
}

export interface Organization {
  _id: string
  name: MultiLang
  description: MultiLang
  logoUrl: string
  serviceCount: number
}

export interface Service {
  _id: string
  name: MultiLang
  description: MultiLang
  organization: OrgRef
  window: { _id: string; number: string; floor: number } | null
  requiredDocuments: string[]
  fee: number
  processingTime: string
  workingHours: string
  contactPhone: string
}

export interface Requirement {
  _id: string
  service: string
  requirementText: MultiLang
  notes: MultiLang
  isMandatory: boolean
  sequenceNo: number
}

export interface NewsItem {
  _id: string
  title: MultiLang
  content: MultiLang
  excerpt: MultiLang
  category: string
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  coverImageUrl: string
  media: Array<{ type: string; url: string; caption: MultiLang }>
  tags: string[]
  createdAt: string
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const getWindows = () => get<WindowSummary[]>('/windows')
export const getWindowsByOrganization = (orgId: string) => get<WindowGroupedByFloor[]>(`/windows/by-organization/${orgId}`)
export const getWindowServices = (id: string) => get<Service[]>(`/windows/${id}/services`)

export const getOrganizations = () => get<Organization[]>('/organizations')
export const getOrganizationServices = (id: string) => get<Service[]>(`/organizations/${id}/services`)
export const getOrganizationById = (id: string) => get<Organization>(`/organizations/${id}`)
export const getOrganizationWithWindows = (id: string) => get<{ organization: Organization; windowGroups: WindowGroupedByFloor[] }>(`/organizations/${id}/with-windows`)

export const getServiceById = (id: string) => get<Service>(`/services/${id}`)
export const getServiceRequirements = (id: string) => get<Requirement[]>(`/services/${id}/requirements`)
export const searchServices = (q: string) => get<Service[]>(`/services/search?q=${encodeURIComponent(q)}`)

export const getContact = () => get<ContactContent>('/contact')

// ─── About ──────────────────────────────────────────────────────
export interface AboutStory {
  _id?: string
  paragraph: MultiLang
  order: number
}

export interface AboutValue {
  _id?: string
  icon: string
  title: MultiLang
  description: MultiLang
  color: string
  order: number
}

export interface AboutStat {
  _id?: string
  value: string
  label: MultiLang
  color: string
  order: number
}

export interface AboutContent {
  _id: string
  mission: MultiLang
  vision: MultiLang
  objectives: MultiLang
  branchIntroduction: MultiLang
  history: MultiLang
  storyBadge: MultiLang
  storyTitle: MultiLang
  missionTitle: MultiLang
  visionTitle: MultiLang
  valuesTitle: MultiLang
  valuesSubtitle: MultiLang
  managerMessageTitle: MultiLang
  managerPhoto: string
  story: AboutStory[]
  values: AboutValue[]
  stats: AboutStat[]
  managerMessage: MultiLang
  managerName: string
  managerTitle: MultiLang
  createdAt: string
  updatedAt: string
}

export const getAbout = () => get<AboutContent>('/about')

export const getNewsList = (params?: string) => get<NewsItem[]>(`/news${params ? `?${params}` : ''}`)
export const getLatestNews = (since?: string) => get<{ count: number; latest: { title: MultiLang; publishedAt: string } | null }>(`/news/latest${since ? `?since=${since}` : ''}`)
