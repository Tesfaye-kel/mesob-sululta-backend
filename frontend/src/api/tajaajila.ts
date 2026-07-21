const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

export const getServiceById = (id: string) => get<Service>(`/services/${id}`)
export const getServiceRequirements = (id: string) => get<Requirement[]>(`/services/${id}/requirements`)

export const getNewsList = (params?: string) => get<NewsItem[]>(`/news${params ? `?${params}` : ''}`)
export const getLatestNews = (since?: string) => get<{ count: number; latest: { title: MultiLang; publishedAt: string } | null }>(`/news/latest${since ? `?since=${since}` : ''}`)