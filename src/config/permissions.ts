// Tipos de usuario disponibles en el sistema
export type UserType = 'ADMIN' | 'CLIENTE'

// Rutas disponibles en el sistema
export type RouteKey =
  | 'landing'
  | 'envios'
  | 'envios-registrar'
  | 'monitoreo'
  | 'planificacion'
  | 'simulacion-tiempo-real'
  | 'simulacion-semanal'
  | 'simulacion-colapso'
  | 'datos'
  | 'reportes'

// Módulos visibles en la landing page
export type ModuleKey = 'envios' | 'monitoreo' | 'datos' | 'reportes'

// Configuración de permisos por tipo de usuario
export const PERMISSIONS: Record<UserType, {
  routes: RouteKey[]
  modules: ModuleKey[]
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}> = {
  ADMIN: {
    routes: [
      'landing',
      'envios',
      'envios-registrar',
      'monitoreo',
      'planificacion',
      'simulacion-tiempo-real',
      'simulacion-semanal',
      'simulacion-colapso',
      'datos',
      'reportes',
    ],
    modules: ['envios', 'monitoreo', 'datos', 'reportes'],
    canEdit: true,
    canDelete: true,
    canExport: true,
  },

// TO-DO
  CLIENTE: {
    routes: [
      'landing',
      'envios',
      'reportes',
    ],
    modules: ['envios', 'reportes'],
    canEdit: false,
    canDelete: false,
    canExport: false,
  },
}

// Mapeo de rutas a sus paths
export const ROUTE_PATHS: Record<RouteKey, string> = {
  'landing': '/',
  'envios': '/envios',
  'envios-registrar': '/envios/registrar',
  'monitoreo': '/monitoreo',
  'planificacion': '/planificacion',
  'simulacion-tiempo-real': '/simulacion/tiempo-real',
  'simulacion-semanal': '/simulacion/semanal',
  'simulacion-colapso': '/simulacion/colapso',
  'datos': '/datos',
  'reportes': '/reportes',
}

// Información de cada módulo para la landing page
export const MODULE_INFO: Record<ModuleKey, {
  icon: string
  label: string
  path: string
}> = {
  envios: {
    icon: 'box',
    label: 'ENVIOS',
    path: '/envios',
  },
  monitoreo: {
    icon: 'connecting_airports',
    label: 'MONITOREO',
    path: '/monitoreo',
  },
  datos: {
    icon: 'database',
    label: 'DATOS',
    path: '/datos',
  },
  reportes: {
    icon: 'description',
    label: 'REPORTES',
    path: '/reportes',
  },
}

// Función helper para verificar si un usuario tiene acceso a una ruta
export function hasRouteAccess(userType: UserType | undefined, route: RouteKey): boolean {
  if (!userType) return false
  return PERMISSIONS[userType]?.routes.includes(route) ?? false
}

// Función helper para verificar si un usuario puede ver un módulo
export function hasModuleAccess(userType: UserType | undefined, module: ModuleKey): boolean {
  if (!userType) return false
  return PERMISSIONS[userType]?.modules.includes(module) ?? false
}

// Función helper para obtener los módulos disponibles para un usuario
export function getAvailableModules(userType: UserType | undefined): ModuleKey[] {
  if (!userType) return []
  return PERMISSIONS[userType]?.modules ?? []
}

// Función helper para verificar permisos de acción
export function canPerformAction(
  userType: UserType | undefined,
  action: 'edit' | 'delete' | 'export'
): boolean {
  if (!userType) return false
  const permissions = PERMISSIONS[userType]
  switch (action) {
    case 'edit':
      return permissions?.canEdit ?? false
    case 'delete':
      return permissions?.canDelete ?? false
    case 'export':
      return permissions?.canExport ?? false
    default:
      return false
  }
}
