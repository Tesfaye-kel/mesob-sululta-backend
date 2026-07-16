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

// ─── Users (admin only) ─────────────────────────────────────────
export const getUsers = () => authFetch<Array<{ _id: string; name: string; email: string; role: string }>>('/admin/users')
export const deleteUser = (id: string) => authFetch<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' })
export const registerAdmin = (data: { name: string; email: string; password: string }) => authFetch<{ user: { id: string; name: string; email: string; role: string }; token: string }>('/admin/register', { method: 'POST', body: JSON.stringify(data) })