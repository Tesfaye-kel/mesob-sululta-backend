const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface RequirementText {
  en: string
  am: string
  or: string
}

export interface Requirement {
  _id: string
  service: string | { _id: string; name: RequirementText }
  requirementText: RequirementText
  notes: RequirementText
  isMandatory: boolean
  sequenceNo: number
  createdAt: string
  updatedAt: string
}

export interface CreateRequirementPayload {
  service: string
  requirementText: RequirementText
  notes?: RequirementText
  isMandatory?: boolean
  sequenceNo?: number
}

// ── helpers ──────────────────────────────────────────────
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── public API ────────────────────────────────────────────

/** Fetch all requirements for a given service id */
export async function fetchRequirementsByService(serviceId: string): Promise<Requirement[]> {
  const res = await fetch(`${BASE_URL}/requirements/by-service/${serviceId}`)
  return handleResponse<Requirement[]>(res)
}

/** Fetch all requirements (optionally filtered by serviceId query param) */
export async function fetchAllRequirements(serviceId?: string): Promise<Requirement[]> {
  const url = serviceId
    ? `${BASE_URL}/requirements?serviceId=${serviceId}`
    : `${BASE_URL}/requirements`
  const res = await fetch(url)
  return handleResponse<Requirement[]>(res)
}

/** Fetch a single requirement by id */
export async function fetchRequirementById(id: string): Promise<Requirement> {
  const res = await fetch(`${BASE_URL}/requirements/${id}`)
  return handleResponse<Requirement>(res)
}

// ── admin API (requires JWT) ──────────────────────────────

export async function createRequirement(payload: CreateRequirementPayload): Promise<Requirement> {
  const res = await fetch(`${BASE_URL}/requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handleResponse<Requirement>(res)
}

export async function updateRequirement(
  id: string,
  payload: Partial<CreateRequirementPayload>
): Promise<Requirement> {
  const res = await fetch(`${BASE_URL}/requirements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handleResponse<Requirement>(res)
}

export async function deleteRequirement(id: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/requirements/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse<{ message: string }>(res)
}

export async function createBulkRequirements(
  requirements: CreateRequirementPayload[]
): Promise<Requirement[]> {
  const res = await fetch(`${BASE_URL}/requirements/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ requirements }),
  })
  return handleResponse<Requirement[]>(res)
}
