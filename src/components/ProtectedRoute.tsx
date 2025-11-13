import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { RouteKey } from '../config/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  route: RouteKey
  redirectTo?: string
}

export function ProtectedRoute({ children, route, redirectTo = '/' }: ProtectedRouteProps) {
  const { hasRouteAccess } = usePermissions()

  if (!hasRouteAccess(route)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
