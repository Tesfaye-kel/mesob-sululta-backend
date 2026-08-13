/**
 * Simple localStorage cache with TTL (time-to-live).
 * On successful fetch → saveCache(key, data)
 * On failed fetch    → loadCache(key) returns stale data or null
 */

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry<T> {
  data: T
  savedAt: number
}

export function saveCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() }
    localStorage.setItem(`mesob_cache_${key}`, JSON.stringify(entry))
  } catch {
    // localStorage might be full or unavailable — fail silently
  }
}

export function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`mesob_cache_${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.savedAt > TTL_MS) return null
    return entry.data
  } catch {
    return null
  }
}

export function clearCache(key: string): void {
  try {
    localStorage.removeItem(`mesob_cache_${key}`)
  } catch {}
}
