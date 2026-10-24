const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'mesob-citizen-token'
const IDENTITY_KEY = 'mesob-citizen-user'
const EXPIRES_KEY = 'mesob-citizen-expires'

export interface CitizenUser {
  id: string
  name: string
  role: 'citizen'
  occupation?: string
  maskedNationalId?: string
}

function storeCitizenSession(result: { token: string; user: CitizenUser; expiresIn: number }) {
  sessionStorage.setItem(TOKEN_KEY, result.token)
  sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(result.user))
  sessionStorage.setItem(EXPIRES_KEY, String(Date.now() + result.expiresIn * 1000))
  return result.user
}

export interface CitizenService {
  _id: string
  name: { en: string; am?: string; or?: string }
  description?: { en?: string; am?: string; or?: string }
  organization?: { _id: string; name: { en: string; am?: string; or?: string } } | string | null
  requiredDocuments: string[]
  requirements?: Array<{
    requirementText: { en: string; am?: string; or?: string }
    notes?: { en?: string; am?: string; or?: string }
    isMandatory: boolean
  }>
  resourceLinks?: string[]
  fee?: number
  processingTime?: string
  window?: {
    _id: string
    number: string | number
    floor: number
    name?: { en?: string; am?: string; or?: string }
  } | string | null
}

export interface CitizenOffice {
  _id: string
  name: { en: string; am?: string; or?: string }
  description?: { en?: string; am?: string; or?: string }
  logoUrl?: string
  defaultWindow?: {
    _id: string
    number: string | number
    floor: number
  } | null
}

export interface CitizenSession {
  id: string
  label: string
  start: string
  end: string
  capacity: number
  booked: number
  remaining: number
  available: boolean
  status: string
}

export interface CitizenAvailability {
  date: string
  bookable: boolean
  alreadyBooked?: boolean
  sessions: CitizenSession[]
}

export interface CitizenAvailabilityResult {
  timeZone: string
  horizonDays: number
  calendarDays: number
  nextAvailableDate: string | null
  dates: CitizenAvailability[]
}

export interface CitizenBooking {
  _id: string
  appointmentReference: string
  serviceId: CitizenService | string | null
  officeId: CitizenOffice | string
  windowId: { number: string | number; floor: number; name?: { en?: string; am?: string; or?: string } } | string
  slotDate: string
  session: 'session1' | 'session2'
  queueNumber: number
  status: string
  deliveryId?: {
    _id: string
    status: string
    outcome: string
    feedbackDeadlineAt?: string | null
  } | string
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (auth && token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`) as Error & { code?: string }
    error.code = data.code
    throw error
  }
  return data as T
}

export async function loginCitizenAccount(name: string, password: string) {
  const result = await request<{ token: string; user: CitizenUser; expiresIn: number }>(
    '/auth/citizen/login',
    { method: 'POST', body: JSON.stringify({ name, password }) },
    false
  )
  return storeCitizenSession(result)
}

export const setCitizenFirstPassword = (data: {
  token?: string
  name: string
  nationalId: string
  password: string
  confirmation: string
}) => request<{ message: string }>('/auth/citizen/first-password', {
  method: 'POST',
  body: JSON.stringify(data),
}, false)

export interface CitizenProfile {
  name: string
  email: string
  occupation: string
  maskedNationalId: string
  status: string
  registeredAt: string
}

export const getCitizenProfile = () => request<{ profile: CitizenProfile }>('/auth/citizen/profile')
export const changeCitizenPassword = (currentPassword: string, newPassword: string) =>
  request<{ message: string }>('/auth/citizen/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

export function getCitizenSession(): CitizenUser | null {
  try {
    const expiresAt = Number(sessionStorage.getItem(EXPIRES_KEY) || 0)
    if (!expiresAt || expiresAt <= Date.now()) {
      logoutCitizen()
      return null
    }
    const raw = sessionStorage.getItem(IDENTITY_KEY)
    if (!raw || !sessionStorage.getItem(TOKEN_KEY)) return null
    return JSON.parse(raw) as CitizenUser
  } catch {
    logoutCitizen()
    return null
  }
}

export function logoutCitizen() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(IDENTITY_KEY)
  sessionStorage.removeItem(EXPIRES_KEY)
}

export const getCitizenOptions = () =>
  request<{ offices: CitizenOffice[]; services: CitizenService[] }>('/appointments/options')
export const getCitizenAvailability = (windowId: string, officeId?: string) =>
  request<CitizenAvailabilityResult>(
    `/appointments/availability?windowId=${encodeURIComponent(windowId)}${officeId ? `&officeId=${encodeURIComponent(officeId)}` : ''}`
  )
export const createCitizenBooking = (data: { officeId: string; windowId: string; slotDate: string; session: string; idempotencyKey: string }) =>
  request<{ message: string; booking: CitizenBooking }>('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
export const getCitizenBookings = () => request<{ bookings: CitizenBooking[] }>('/appointments/mine')
export const cancelCitizenBooking = (id: string) =>
  request<{ message: string }>(`/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const getCitizenReceipts = () => request<{ receipts: Array<{ _id: string; receiptNumber: string; serviceId: CitizenService; issuedAt: string; qrCode: string }> }>('/appointments/receipts/mine')
export const getCitizenFeedback = () =>
  request<{ feedback: Array<{ _id: string; type: string; message: string; status: string; response: string; serviceId: CitizenService; serviceDeliveryId: string }> }>('/appointments/feedback/mine')
export const getCitizenNotifications = () =>
  request<{ notifications: Array<{ _id: string; type: string; title: string; message: string; isRead: boolean; relatedId?: string; createdAt: string }> }>('/appointments/notifications/mine')
export const submitCitizenFeedback = (data: { serviceDeliveryId: string; type: string; category: string; message: string; rating: number }) =>
  request<{ message: string }>('/appointments/feedback', { method: 'POST', body: JSON.stringify(data) })
