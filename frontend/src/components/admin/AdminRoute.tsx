import { Outlet } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import AdminLogin from '@/pages/admin/AdminLogin'

export default function AdminRoute() {
  const { isLoggedIn, loading, user } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Must be logged in AND have the admin role
  if (!isLoggedIn || !user || user.role !== 'admin') {
    return <AdminLogin />
  }

  return <Outlet />
}