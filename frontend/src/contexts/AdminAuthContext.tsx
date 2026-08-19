import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { isAuthenticated, getStoredUser, adminLogin, adminLogout, clearAdminAuthStorage, type AdminProfile } from '@/api/admin'

interface AdminAuthContextType {
  isLoggedIn: boolean
  user: AdminProfile | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // Restore session from storage on mount. Any storage failure is treated as logged out.
      const stored = getStoredUser()
      if (stored && isAuthenticated()) {
        if (stored.role === 'admin') {
          setIsLoggedIn(true)
          setUser(stored)
        } else {
          clearAdminAuthStorage()
          setIsLoggedIn(false)
          setUser(null)
        }
      } else {
        clearAdminAuthStorage()
        setIsLoggedIn(false)
        setUser(null)
      }
    } catch {
      clearAdminAuthStorage()
      setIsLoggedIn(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await adminLogin(email, password)
    // Verify the logged-in user has the admin role
    if (data.user.role !== 'admin') {
      clearAdminAuthStorage()
      throw new Error('Access denied: admin role required')
    }
    setIsLoggedIn(true)
    setUser(data.user as unknown as AdminProfile)
  }, [])

  const logout = useCallback(() => {
    adminLogout()
    setIsLoggedIn(false)
    setUser(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}