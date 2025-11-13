// Tipos de usuario disponibles en el sistema
export type UserType = 'ADMIN' | 'CLIENTE'

// Rutas disponibles en el sistema
export type RouteKey =
  | 'landing'
  | 'envios'
  | 'envios-registrar'
  | 'planificacion'
  | 'simulacion-diaria'
  | 'simulacion-tiempo-real'
  | 'simulacion-semanal'
  | 'simulacion-colapso'
  | 'datos'
  | 'reportes'

// Módulos visibles en la landing page
export type ModuleKey = 
  | 'envios' 
  | 'datos' 
  | 'planificacion' 
  | 'simulacion-diaria' 
  | 'simulacion-semanal' 
  | 'simulacion-colapso' 
  | 'reportes'

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
      'planificacion',
      'simulacion-tiempo-real',
      'simulacion-semanal',
      'simulacion-colapso',
      'datos',
      'reportes',
    ],
    modules: ['envios', 'datos', 'planificacion', 'simulacion-diaria', 'simulacion-semanal', 'simulacion-colapso', 'reportes'],
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
  'planificacion': '/planificacion',
  'simulacion-diaria': '/simulacion/diaria',
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
    icon: 'local_shipping',
    label: 'ENVIOS',
    path: '/envios',
  },
  datos: {
    icon: 'database',
    label: 'DATOS',
    path: '/datos',
  },
  planificacion: {
    icon: 'calendar_month',
    label: 'PLANIFICACION',
    path: '/planificacion',
  },
  'simulacion-diaria': {
    icon: 'wb_sunny',
    label: 'SIMULACION DIARIA',
    path: '/simulacion/diaria',
  },
  'simulacion-semanal': {
    icon: 'date_range',
    label: 'SIMULACION SEMANAL',
    path: '/simulacion/semanal',
  },
  'simulacion-colapso': {
    icon: 'warning',
    label: 'SIMULACION COLAPSO',
    path: '/simulacion/colapso',
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
