const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Resolves an image URL from the backend to a fully qualified URL.
 * Supports multiple formats stored in the database:
 * - Relative path: `/uploads/gallery/filename.jpg`
 * - Relative path: `/uploads/news/filename.jpg`
 * - Full URL: `http://...` or `https://...`
 * - Just filename (legacy): `filename.jpg`
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return ''

  // Already a full URL (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Already starts with /uploads (like /uploads/gallery/xxx or /uploads/news/xxx)
  if (url.startsWith('/uploads')) {
    const baseUrl = API_BASE.replace('/api', '')
    return `${baseUrl}${url}`
  }

  // Just a filename - assume it's in the general uploads (legacy)
  const baseUrl = API_BASE.replace('/api', '')
  return `${baseUrl}/uploads/${url}`
}

/**
 * Gets the backend base URL (without /api suffix)
 */
export function getBaseUrl(): string {
  return API_BASE.replace('/api', '')
}