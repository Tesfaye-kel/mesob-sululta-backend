const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getToken(): string | null {
  return localStorage.getItem('admin-token')
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
    localStorage.removeItem('admin-token')
    localStorage.removeItem('admin-user')
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Auth ───────────────────────────────────────────────────────
export const adminLogin = async (email: string, password: string) => {
  const data = await authFetch<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('admin-token', data.token)
  localStorage.setItem('admin-user', JSON.stringify(data.user))
  return data
}

export const adminLogout = () => {
  localStorage.removeItem('admin-token')
  localStorage.removeItem('admin-user')
}

export const getStoredUser = () => {
  const raw = localStorage.getItem('admin-user')
  return raw ? JSON.parse(raw) : null
}

export const isAuthenticated = () => !!getToken()

// ─── Dashboard ──────────────────────────────────────────────────
export interface DashboardStats {
  stats: {
    users: number
    organizations: number
    services: number
    windows: number
    announcements: number
    faqs: number
    testimonials: number
    contactSubmissions: number
    total: number
  }
  recent: {
    announcements: Array<{ _id: string; title: { en: string; am: string; or: string }; category: string; publishedAt: string; isFeatured: boolean }>
    services: Array<{ _id: string; name: { en: string; am: string; or: string }; organization: { name: { en: string } }; createdAt: string }>
    organizations: Array<{ _id: string; name: { en: string; am: string; or: string }; createdAt: string }>
  }
}

export const getDashboardStats = () => authFetch<DashboardStats>('/admin/dashboard')

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
export const updateProfile = (data: { name?: string; email?: string }) => authFetch<AdminProfile>('/admin/profile', {
  method: 'PUT',
  body: JSON.stringify(data),
})
export const changePassword = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => authFetch<{ message: string }>('/admin/change-password', {
  method: 'PUT',
  body: JSON.stringify(data),
})

// ─── Announcements ──────────────────────────────────────────────
export interface MultiLang {
  en: string
  am: string
  or: string
}

export interface Announcement {
  _id: string
  title: MultiLang
  content: MultiLang
  category: string
  isFeatured: boolean
  publishedAt: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export const getAnnouncements = (params?: string) => authFetch<Announcement[]>(`/announcements${params ? `?${params}` : ''}`)
export const getAnnouncement = (id: string) => authFetch<Announcement>(`/announcements/${id}`)
export const createAnnouncement = (data: Partial<Announcement>) => authFetch<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) })
export const updateAnnouncement = (id: string, data: Partial<Announcement>) => authFetch<Announcement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAnnouncement = (id: string) => authFetch<{ message: string }>(`/announcements/${id}`, { method: 'DELETE' })

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
export interface AboutValue {
  _id?: string
  icon: string
  title: MultiLang
  description: MultiLang
  order: number
}

export interface AboutStat {
  _id?: string
  value: string
  label: MultiLang
  order: number
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
  createdAt: string
  updatedAt: string
}

export const getAbout = () => authFetch<AboutContent>('/about')
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
  category: string
  order: number
  createdAt: string
  updatedAt: string
}

export const getGalleryItemsList = () => authFetch<GalleryItem[]>('/gallery')
export const createGalleryItem = (data: Partial<GalleryItem>) => authFetch<GalleryItem>('/gallery', { method: 'POST', body: JSON.stringify(data) })
export const updateGalleryItem = (id: string, data: Partial<GalleryItem>) => authFetch<GalleryItem>(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteGalleryItem = (id: string) => authFetch<{ message: string }>(`/gallery/${id}`, { method: 'DELETE' })

// ─── Windows (admin) ────────────────────────────────────────────
export interface WindowAdmin {
  _id: string
  number: number
  organization: { _id: string; name: MultiLang }
  services: Array<{ _id: string; name: MultiLang }>
  createdAt: string
}

export const getWindowsAdmin = () => authFetch<WindowAdmin[]>('/windows')
export const createWindow = (data: { number: number; organization: string; services?: string[] }) => authFetch<WindowAdmin>('/windows', { method: 'POST', body: JSON.stringify(data) })
export const updateWindow = (id: string, data: { number?: number; organization?: string; services?: string[] }) => authFetch<WindowAdmin>(`/windows/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteWindow = (id: string) => authFetch<{ message: string }>(`/windows/${id}`, { method: 'DELETE' })

// ─── Services (admin) ────────────────────────────────────────────
export interface ServiceAdmin {
  _id: string
  name: MultiLang
  description: MultiLang
  organization: string | { _id: string; name: MultiLang }
  requiredDocuments: string[]
  fee: number
  processingTime: string
  workingHours: string
  contactPhone: string
  createdAt: string
}

export const getServicesAdmin = (orgId?: string) => authFetch<ServiceAdmin[]>(`/services${orgId ? `?organizationId=${orgId}` : ''}`)
export const createService = (data: Partial<ServiceAdmin>) => authFetch<ServiceAdmin>('/services', { method: 'POST', body: JSON.stringify(data) })
export const updateService = (id: string, data: Partial<ServiceAdmin>) => authFetch<ServiceAdmin>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteService = (id: string) => authFetch<{ message: string }>(`/services/${id}`, { method: 'DELETE' })

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