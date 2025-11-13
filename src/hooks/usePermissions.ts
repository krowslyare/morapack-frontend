import { useAuthStore } from '../store/useAuthStore'
import type { UserType, RouteKey, ModuleKey } from '../config/permissions'
import {
  hasRouteAccess,
  hasModuleAccess,
  canPerformAction,
  getAvailableModules,
} from '../config/permissions'

export function usePermissions() {
  const session = useAuthStore((s) => s.session)
  const userType = session?.userType as UserType | undefined

  return {
    userType,
    hasRouteAccess: (route: RouteKey) => hasRouteAccess(userType, route),
    hasModuleAccess: (module: ModuleKey) => hasModuleAccess(userType, module),
    canEdit: () => canPerformAction(userType, 'edit'),
    canDelete: () => canPerformAction(userType, 'delete'),
    canExport: () => canPerformAction(userType, 'export'),
    getAvailableModules: () => getAvailableModules(userType),
  }
}
