import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { FullScreenStatus } from './ui.tsx'

export function ProtectedRoute() {
  const { user, isAdmin, loading, configured } = useAuth()
  if (!configured) return <Navigate to="/admin/login" replace />
  if (loading) return <FullScreenStatus label="جارٍ التحقق من الصلاحية" />
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
