import { useState, useEffect, useCallback } from 'react'
import {
  fetchRequirementsByService,
  fetchAllRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  createBulkRequirements,
  type Requirement,
  type CreateRequirementPayload,
} from '@/api/requirementsApi'

// ── Public hook: requirements for a single service ────────

interface UseServiceRequirementsState {
  requirements: Requirement[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useServiceRequirements(serviceId: string): UseServiceRequirementsState {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!serviceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRequirementsByService(serviceId)
      setRequirements(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    load()
  }, [load])

  return { requirements, loading, error, refetch: load }
}

// ── Admin hook: full CRUD ─────────────────────────────────

interface UseRequirementsAdminState {
  requirements: Requirement[]
  loading: boolean
  error: string | null
  saving: boolean
  refetch: (serviceId?: string) => void
  add: (payload: CreateRequirementPayload) => Promise<void>
  edit: (id: string, payload: Partial<CreateRequirementPayload>) => Promise<void>
  remove: (id: string) => Promise<void>
  addBulk: (items: CreateRequirementPayload[]) => Promise<void>
}

export function useRequirementsAdmin(serviceId?: string): UseRequirementsAdminState {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (sid?: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllRequirements(sid ?? serviceId)
      setRequirements(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    load()
  }, [load])

  const add = async (payload: CreateRequirementPayload) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createRequirement(payload)
      setRequirements(prev => [...prev, created].sort((a, b) => a.sequenceNo - b.sequenceNo))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create requirement')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const edit = async (id: string, payload: Partial<CreateRequirementPayload>) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateRequirement(id, payload)
      setRequirements(prev => prev.map(r => r._id === id ? updated : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update requirement')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteRequirement(id)
      setRequirements(prev => prev.filter(r => r._id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete requirement')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const addBulk = async (items: CreateRequirementPayload[]) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createBulkRequirements(items)
      setRequirements(prev => [...prev, ...created].sort((a, b) => a.sequenceNo - b.sequenceNo))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk create requirements')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return { requirements, loading, error, saving, refetch: load, add, edit, remove, addBulk }
}
