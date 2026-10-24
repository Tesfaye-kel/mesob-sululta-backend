import { ADMIN_TOKEN_KEY } from './admin'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function adminWorkflowRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...((options.headers as Record<string, string> | undefined) || {}),
    },
  })
  const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data as T
}
