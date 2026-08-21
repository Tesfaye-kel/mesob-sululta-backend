const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── Storage keys (single source of truth) ─────────────────────
export const ADMIN_TOKEN_KEY = 'admin-token'
export const ADMIN_USER_KEY = 'admin-user'
// Legacy key from an older implementation — cleaned up on logout
const LEGACY_TOKEN_KEY = 'token'

// ─── Safe localStorage helpers ─────────────────────────────────
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage unavailable — fail silently
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // localStorage unavailable — fail silently
  }
}

function getToken(): string | null {
  return safeGet(ADMIN_TOKEN_KEY)
}

// ─── Clean up all admin auth storage ───────────────────────────
export function clearAdminAuthStorage(): void {
  safeRemove(ADMIN_TOKEN_KEY)
  safeRemove(ADMIN_USER_KEY)
  // Remove legacy/duplicate key from older implementation
  safeRemove(LEGACY_TOKEN_KEY)
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearAdminAuthStorage()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    const details = error.details && typeof error.details === 'object'
      ? Object.values(error.details as Record<string, { message?: string }>).map(detail => detail?.message).filter(Boolean).join(', ')
      : ''
    throw new Error(details ? `${error.message || `HTTP ${res.status}`}: ${details}` : error.message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Auth ───────────────────────────────────────────────────────
export const adminLogin = async (email: string, password: string) => {
  const data = await authFetch<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  safeSet(ADMIN_TOKEN_KEY, data.token)
  safeSet(ADMIN_USER_KEY, JSON.stringify(data.user))
  return data
}

export const adminLogout = () => {
  clearAdminAuthStorage()
}

export const getStoredUser = () => {
  const raw = safeGet(ADMIN_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Corrupted/old-format data — clear it so it can't crash the app
    clearAdminAuthStorage()
    return null
  }
}

export const isAuthenticated = () => !!getToken()

// ─── Dashboard ──────────────────────────────────────────────────
export interface DashboardStats {
stats: {
    users: number
    organizations: number
    services: number
    windows: number
    news: number
    faqs: number
    testimonials: number
    contactSubmissions: number
    unreadMessages: number
    total: number
  }
  feedback: FeedbackSummary
  recent: {
    news: Array<{ _id: string; title: { en: string; am: string; or: string }; category: string; publishedAt: string; isFeatured: boolean }>
    services: Array<{ _id: string; name: { en: string; am: string; or: string }; organization: { name: { en: string } }; createdAt: string }>
    organizations: Array<{ _id: string; name: { en: string; am: string; or: string }; createdAt: string }>
  }
}

export interface FeedbackSummary {
  votes: Record<1 | 2 | 3 | 4 | 5, number>
  totalRatings: number
  mostFrequentRating: 1 | 2 | 3 | 4 | 5
  percentages: Record<1 | 2 | 3 | 4 | 5, number>
  overallProjectScore: number
  showOverallProjectScore: boolean
}

export const getDashboardStats = () => authFetch<DashboardStats>('/admin/dashboard')
export const getFeedbackDashboard = () => authFetch<FeedbackSummary>('/admin/feedback')
export const updateFeedbackPercentages = (percentages: Record<1 | 2 | 3 | 4 | 5, number>, showOverallProjectScore?: boolean) =>
  authFetch<FeedbackSummary>('/admin/feedback/percentages', {
    method: 'PUT',
    body: JSON.stringify({ percentages, ...(showOverallProjectScore === undefined ? {} : { showOverallProjectScore }) }),
  })

// ─── Profile ────────────────────────────────────────────────────
export interface AdminProfile {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export const getProfile = () => authFetch<AdminProfile>('/admin/profile')
export const updateProfile = async (data: { name?: string; email?: string }) => {
  const updated = await authFetch<AdminProfile>('/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  safeSet(ADMIN_USER_KEY, JSON.stringify(updated))
  return updated
}
export const changePassword = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => authFetch<{ message: string }>('/admin/change-password', {
  method: 'PUT',
  body: JSON.stringify(data),
})

// ─── MultiLang ──────────────────────────────────────────────────
export interface MultiLang {
  en: string
  am: string
  or: string
}

// ─── News ────────────────────────────────────────
export interface NewsMedia {
  type: 'image' | 'video' | 'audio' | 'document' | 'other' | 'youtube'
  url: string
  caption: MultiLang
  altText?: MultiLang
  description?: MultiLang
  displayOrder?: number
  fileSize?: number
  mimeType?: string
  isCover?: boolean
}

export interface NewsItem {
  _id: string
  title: MultiLang
  content: MultiLang
  excerpt: MultiLang
  category: string
  author: MultiLang
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  coverImageUrl: string
  externalUrl: string
  media: NewsMedia[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface NewsListResponse {
  news: NewsItem[]
  total: number
  page: number
  pages: number
}

export const getNewsList = (params?: string) => authFetch<NewsListResponse>(`/news${params ? `?${params}` : ''}`)
export const getNewsItem = (id: string) => authFetch<NewsItem>(`/news/${id}`)
export const getRelatedNews = (id: string) => authFetch<NewsItem[]>(`/news/related/${id}`)
export const getNewsCategories = () => authFetch<string[]>('/news/categories')
export const getNewsTags = () => authFetch<string[]>('/news/tags')
export const createNews = (data: Partial<NewsItem>) => authFetch<NewsItem>('/news', { method: 'POST', body: JSON.stringify(data) })
export const updateNews = (id: string, data: Partial<NewsItem>) => authFetch<NewsItem>(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteNews = (id: string) => authFetch<{ message: string }>(`/news/${id}`, { method: 'DELETE' })
export const getLatestNews = (since?: string) => authFetch<{ count: number; latest: { title: MultiLang; publishedAt: string } | null }>(`/news/latest${since ? `?since=${since}` : ''}`)
export const deleteNewsMedia = (filename: string) => authFetch<{ message: string }>(`/news/media/${filename}`, { method: 'DELETE' })
// POST /news/upload and /news/upload-multiple handled by direct multipart upload in component

// ─── Social Media ────────────────────────────────────────
export interface SocialMediaPlatform {
  _id: string
  platform: string
  icon: string
  url: string
  displayOrder: number
  isActive: boolean
  openInNewTab: boolean
  createdAt: string
  updatedAt: string
}

export const getSocialMediaList = () => authFetch<SocialMediaPlatform[]>('/social-media/all')
export const getSocialMedia = (id: string) => authFetch<SocialMediaPlatform>(`/social-media/${id}`)
export const createSocialMedia = (data: Partial<SocialMediaPlatform>) => authFetch<SocialMediaPlatform>('/social-media', { method: 'POST', body: JSON.stringify(data) })
export const updateSocialMedia = (id: string, data: Partial<SocialMediaPlatform>) => authFetch<SocialMediaPlatform>(`/social-media/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSocialMedia = (id: string) => authFetch<{ message: string }>(`/social-media/${id}`, { method: 'DELETE' })

// ─── FAQs ───────────────────────────────────────────────────────
export interface FAQ {
  _id: string
  question: MultiLang
  answer: MultiLang
  category: string
  order: number
  isPopular: boolean
  createdAt: string
  updatedAt: string
}

export const getFAQs = (params?: string) => authFetch<FAQ[]>(`/faqs${params ? `?${params}` : ''}`)
export const getFAQ = (id: string) => authFetch<FAQ>(`/faqs/${id}`)
export const createFAQ = (data: Partial<FAQ>) => authFetch<FAQ>('/faqs', { method: 'POST', body: JSON.stringify(data) })
export const updateFAQ = (id: string, data: Partial<FAQ>) => authFetch<FAQ>(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFAQ = (id: string) => authFetch<{ message: string }>(`/faqs/${id}`, { method: 'DELETE' })

// ─── Testimonials ───────────────────────────────────────────────
export interface Testimonial {
  _id: string
  name: string
  title: string
  quote: MultiLang
  avatar: string
  rating: number
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export const getTestimonials = (params?: string) => authFetch<Testimonial[]>(`/testimonials${params ? `?${params}` : ''}`)
export const getTestimonial = (id: string) => authFetch<Testimonial>(`/testimonials/${id}`)
export const createTestimonial = (data: Partial<Testimonial>) => authFetch<Testimonial>('/testimonials', { method: 'POST', body: JSON.stringify(data) })
export const updateTestimonial = (id: string, data: Partial<Testimonial>) => authFetch<Testimonial>(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTestimonial = (id: string) => authFetch<{ message: string }>(`/testimonials/${id}`, { method: 'DELETE' })

// ─── Organizations ──────────────────────────────────────────────
export interface OrganizationSummary {
  _id: string
  name: MultiLang
  description: MultiLang
  logoUrl: string
  displayOrder: number
  serviceCount: number
  createdAt: string
  updatedAt: string
}

export const getOrganizations = () => authFetch<OrganizationSummary[]>('/organizations')
export const getOrganization = (id: string) => authFetch<OrganizationSummary>(`/organizations/${id}`)
export const createOrganization = (data: Partial<OrganizationSummary>) => authFetch<OrganizationSummary>('/organizations', { method: 'POST', body: JSON.stringify(data) })
export const updateOrganization = (id: string, data: Partial<OrganizationSummary>) => authFetch<OrganizationSummary>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOrganization = (id: string) => authFetch<{ message: string }>(`/organizations/${id}`, { method: 'DELETE' })

// ─── About ──────────────────────────────────────────────────────
export interface AboutHighlight {
  _id?: string
  text: MultiLang
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
  isVisible: boolean
}

export interface AboutStory {
  _id?: string
  paragraph: MultiLang
  order: number
}

export interface AboutContent {
  _id: string
  mission: MultiLang
  vision: MultiLang
  objectives: MultiLang
  branchIntroduction: MultiLang
  history: MultiLang
  story: AboutStory[]
  values: AboutValue[]
  stats: AboutStat[]
  managerMessage: MultiLang
  managerName: string
  managerTitle: MultiLang
  managerPhoto: string
  storyBadge: MultiLang
  storyTitle: MultiLang
  missionTitle: MultiLang
  visionTitle: MultiLang
  valuesTitle: MultiLang
  valuesSubtitle: MultiLang
  managerMessageTitle: MultiLang
  createdAt: string
  updatedAt: string
}

export const getAbout = () => authFetch<AboutContent>('/about?includeHidden=true')
export const updateAbout = (data: Partial<AboutContent>) => authFetch<AboutContent>('/about', { method: 'PUT', body: JSON.stringify(data) })

// About sub-document CRUD
export const addAboutStory = (data: Partial<AboutStory>) => authFetch<AboutContent>('/about/stories', { method: 'POST', body: JSON.stringify(data) })
export const updateAboutStory = (id: string, data: Partial<AboutStory>) => authFetch<AboutContent>(`/about/stories/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAboutStory = (id: string) => authFetch<{ message: string }>(`/about/stories/${id}`, { method: 'DELETE' })

export const addAboutValue = (data: Partial<AboutValue>) => authFetch<AboutContent>('/about/values', { method: 'POST', body: JSON.stringify(data) })
export const updateAboutValue = (id: string, data: Partial<AboutValue>) => authFetch<AboutContent>(`/about/values/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAboutValue = (id: string) => authFetch<{ message: string }>(`/about/values/${id}`, { method: 'DELETE' })

export const addAboutStat = (data: Partial<AboutStat>) => authFetch<AboutContent>('/about/stats', { method: 'POST', body: JSON.stringify(data) })
export const updateAboutStat = (id: string, data: Partial<AboutStat>) => authFetch<AboutContent>(`/about/stats/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAboutStat = (id: string) => authFetch<{ message: string }>(`/about/stats/${id}`, { method: 'DELETE' })

// ─── Generic file upload helper (uses auth token, no double /api) ────────────
export const uploadFile = async (path: string, fieldName: string, file: File): Promise<{ imageUrl: string; url?: string; filename?: string }> => {
  const token = getToken()
  const formData = new FormData()
  formData.append(fieldName, file)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (res.status === 401) {
    clearAdminAuthStorage()
    throw new Error('Session expired — please log in again')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Upload failed (${res.status})` }))
    throw new Error(err.message || 'Upload failed')
  }
  return res.json()
}

// About manager photo upload
export const uploadManagerPhoto = async (file: File): Promise<{ imageUrl: string }> => {
  const token = getToken()
  const formData = new FormData()
  formData.append('photo', file)
  const res = await fetch(`${BASE}/about/upload-manager-photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || 'Upload failed')
  }
  return res.json()
}

// ─── Contact ────────────────────────────────────────────────────
export interface ContactContent {
  _id: string
  address: MultiLang
  phone: string
  email: string
  workingHours: MultiLang
  mapEmbedUrl: string
  createdAt: string
  updatedAt: string
}

export const getContact = () => authFetch<ContactContent>('/contact')
export const updateContact = (data: Partial<ContactContent>) => authFetch<ContactContent>('/contact', { method: 'PUT', body: JSON.stringify(data) })

// ─── Gallery ────────────────────────────────────────────────────
export interface GalleryItem {
  _id: string
  title: MultiLang
  description: MultiLang
  caption: MultiLang
  imageUrl: string
  videoUrl?: string
  mediaType?: 'image' | 'video'
  category: string
  order: number
  createdAt: string
  updatedAt: string
}

export const getGalleryItemsList = () => authFetch<GalleryItem[]>('/gallery')
export const createGalleryItem = (data: Partial<GalleryItem>) => authFetch<GalleryItem>('/gallery', { method: 'POST', body: JSON.stringify(data) })
export const updateGalleryItem = (id: string, data: Partial<GalleryItem>) => authFetch<GalleryItem>(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteGalleryItem = (id: string) => authFetch<{ message: string }>(`/gallery/${id}`, { method: 'DELETE' })

// ─── Floors (admin) ─────────────────────────────────────────────
export interface FloorAdmin {
  _id: string
  floorNumber: number
  name: { en: string; am: string; or: string }
  description: { en: string; am: string; or: string }
}

export const getFloorsAdmin = () => authFetch<FloorAdmin[]>('/floors')
export const createFloor = (data: Partial<FloorAdmin>) => authFetch<FloorAdmin>('/floors', { method: 'POST', body: JSON.stringify(data) })
export const updateFloor = (id: string, data: Partial<FloorAdmin>) => authFetch<FloorAdmin>(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFloor = (id: string) => authFetch<{ message: string }>(`/floors/${id}`, { method: 'DELETE' })

// ─── Windows (admin) ────────────────────────────────────────────
export interface WindowAdmin {
  _id: string
  number: string
  name?: { en?: string; am?: string; or?: string }
  floor: number
  organization: { _id: string; name: MultiLang }
  serviceCount?: number
  description?: { en: string; am: string; or: string }
  createdAt: string
}

export const getWindowsAdmin = (organizationId?: string) => authFetch<WindowAdmin[]>(`/windows${organizationId ? `?organization=${encodeURIComponent(organizationId)}` : ''}`)
export const createWindow = (data: { number: string; name?: { en: string; am: string; or: string }; floor: number; organization: string; description?: { en: string; am: string; or: string } }) => authFetch<WindowAdmin>('/windows', { method: 'POST', body: JSON.stringify(data) })
export const updateWindow = (id: string, data: Partial<WindowAdmin & { organization: string }>) => authFetch<WindowAdmin>(`/windows/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteWindow = (id: string) => authFetch<{ message: string }>(`/windows/${id}`, { method: 'DELETE' })

// Assign services to a window
export const assignServicesToWindow = (windowId: string, serviceIds: string[]) =>
  authFetch<{ message: string; services: ServiceAdmin[] }>(`/windows/${windowId}/assign-services`, {
    method: 'PUT',
    body: JSON.stringify({ serviceIds }),
  })

// Get available (unassigned) services for a window
export const getAvailableServicesForWindow = (windowId: string) =>
  authFetch<ServiceAdmin[]>(`/windows/${windowId}/available-services`)

// ─── Services (admin) ────────────────────────────────────────────
export interface ServiceAdmin {
  _id: string
  name: MultiLang
  description: MultiLang
  organization: string | { _id: string; name: MultiLang } | null
  window: string | { _id: string; number: string; floor: number } | null
  requiredDocuments: string[]
  fee: number
  processingTime: string
  workingHours: string
  contactPhone: string
  createdAt: string
}

export const getServicesAdmin = (orgId?: string) => authFetch<ServiceAdmin[]>(`/services${orgId ? `?organizationId=${encodeURIComponent(orgId)}` : ''}`)
export const createService = (data: Partial<ServiceAdmin>) => authFetch<ServiceAdmin>('/services', { method: 'POST', body: JSON.stringify(data) })
export const updateService = (id: string, data: Partial<ServiceAdmin>) => authFetch<ServiceAdmin>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteService = (id: string) => authFetch<{ message: string }>(`/services/${id}`, { method: 'DELETE' })
export const deleteServicesByWindow = (windowId: string) => authFetch<{ message: string; deletedCount: number }>(`/services/by-window/${windowId}`, { method: 'DELETE' })
export const deleteServicesByOrganization = (organizationId: string) => authFetch<{ message: string; deletedCount: number }>(`/services/by-organization/${organizationId}`, { method: 'DELETE' })

// ─── Requirements (admin) ────────────────────────────────────────
export interface RequirementAdmin {
  _id: string
  service: string | { _id: string; name: MultiLang }
  requirementText: MultiLang
  notes: MultiLang
  isMandatory: boolean
  sequenceNo: number
  createdAt: string
}

export const getRequirementsByService = (serviceId: string) => authFetch<RequirementAdmin[]>(`/requirements?serviceId=${serviceId}`)
export const createRequirement = (data: Partial<RequirementAdmin>) => authFetch<RequirementAdmin>('/requirements', { method: 'POST', body: JSON.stringify(data) })
export const updateRequirement = (id: string, data: Partial<RequirementAdmin>) => authFetch<RequirementAdmin>(`/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteRequirement = (id: string) => authFetch<{ message: string }>(`/requirements/${id}`, { method: 'DELETE' })

// ─── Contact Messages ────────────────────────────────────────────
export interface ContactMessage {
  _id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  type: 'contact' | 'feedback'
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export const getContactMessages = (params?: string) => authFetch<ContactMessage[]>(`/contact-messages${params ? `?${params}` : ''}`)
export const getContactMessage = (id: string) => authFetch<ContactMessage>(`/contact-messages/${id}`)
export const createContactMessage = (data: Partial<ContactMessage>) => authFetch<ContactMessage>('/contact-messages', { method: 'POST', body: JSON.stringify(data) })
export const updateContactMessage = (id: string, data: Partial<ContactMessage>) => authFetch<ContactMessage>(`/contact-messages/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const markContactMessageRead = (id: string) => authFetch<ContactMessage>(`/contact-messages/${id}/read`, { method: 'PUT' })
export const deleteContactMessage = (id: string) => authFetch<{ message: string }>(`/contact-messages/${id}`, { method: 'DELETE' })

// ─── Users (admin only) ─────────────────────────────────────────
export const getUsers = () => authFetch<Array<{ _id: string; name: string; email: string; role: string }>>('/admin/users')
export const deleteUser = (id: string) => authFetch<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' })
export const registerAdmin = (data: { name: string; email: string; password: string }) => authFetch<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/admin/register', { method: 'POST', body: JSON.stringify(data) })

// ─── Organization Content ────────────────────────────────────────
export interface OrgContentLeadership {
  _id?: string
  name: string
  role: MultiLang
  avatar: string
  color: string
  order: number
}

export interface OrganizationContent {
  _id: string
  leadership: OrgContentLeadership[]
  futureExpansion: MultiLang
  hierarchyTitle: MultiLang
  createdAt: string
  updatedAt: string
}

export const getOrganizationContent = () => authFetch<OrganizationContent>('/organization-content')
export const updateOrganizationContent = (data: Partial<OrganizationContent>) => authFetch<OrganizationContent>('/organization-content', { method: 'PUT', body: JSON.stringify(data) })

export const addOrgContentLeadership = (data: Partial<OrgContentLeadership>) => authFetch<OrganizationContent>('/organization-content/leadership', { method: 'POST', body: JSON.stringify(data) })
export const updateOrgContentLeadership = (id: string, data: Partial<OrgContentLeadership>) => authFetch<OrganizationContent>(`/organization-content/leadership/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOrgContentLeadership = (id: string) => authFetch<OrganizationContent>(`/organization-content/leadership/${id}`, { method: 'DELETE' })

// ─── Offices ────────────────────────────────────────────────────
export interface Office {
  _id: string
  name: MultiLang
  address: MultiLang
  phone: string
  email: string
  location?: {
    latitude: number | null
    longitude: number | null
  }
  workingHours: MultiLang
  description: MultiLang
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export const getOffices = () => authFetch<Office[]>('/offices')
export const getOffice = (id: string) => authFetch<Office>(`/offices/${id}`)
export const createOffice = (data: Partial<Office>) => authFetch<Office>('/offices', { method: 'POST', body: JSON.stringify(data) })
export const updateOffice = (id: string, data: Partial<Office>) => authFetch<Office>(`/offices/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOffice = (id: string) => authFetch<{ message: string }>(`/offices/${id}`, { method: 'DELETE' })