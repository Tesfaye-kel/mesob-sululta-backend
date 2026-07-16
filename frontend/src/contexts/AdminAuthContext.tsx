import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { isAuthenticated, getStoredUser, adminLogin, adminLogout, type AdminProfile } from '@/api/admin'

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
    const stored = getStoredUser()
    if (stored && isAuthenticated()) {
      setIsLoggedIn(true)
      setUser(stored)
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await adminLogin(email, password)
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