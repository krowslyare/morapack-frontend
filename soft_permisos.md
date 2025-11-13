# Sistema de Permisos - MoraPack

## Descripción

Control de acceso basado en `userType`. Sistema frontend para proyecto universitario.

## Tipos de Usuario

### ADMIN
- Acceso completo a todas las rutas y módulos
- Puede editar, eliminar y exportar

### CLIENTE
- Acceso limitado a visualización
- Solo puede ver envíos y reportes
- Sin permisos de edición ni eliminación

## Archivos

### `/src/config/permissions.ts`
Configuración central de permisos.

### `/src/hooks/usePermissions.ts`
Hook para verificar permisos: `const { hasRouteAccess, canEdit } = usePermissions()`

### `/src/components/ProtectedRoute.tsx`
Componente opcional para proteger rutas.

## Uso

```tsx
const { canEdit, canDelete } = usePermissions()

{canEdit() && <button>Editar</button>}
{canDelete() && <button>Eliminar</button>}
```

### Landing y Sidebar
Filtran automáticamente según permisos del usuario.

## Modificar Permisos

Edita `/src/config/permissions.ts`:

```typescript
export const PERMISSIONS: Record<UserType, {...}> = {
  ADMIN: {
    routes: ['landing', 'envios', 'monitoreo', 'planificacion', ...],
    modules: ['envios', 'monitoreo', 'datos', 'reportes'],
    canEdit: true,
    canDelete: true,
    canExport: true,
  },
  CLIENTE: {
    routes: ['landing', 'envios', 'reportes'],
    modules: ['envios', 'reportes'],
    canEdit: false,
    canDelete: false,
    canExport: false,
  },
}
```

### Agregar ítem al Sidebar

En `/src/components/layout/Sidebar.tsx`:

```typescript
const SIDEBAR_ITEMS = [
  { route: 'envios', path: '/envios', icon: 'box', label: 'Envíos' },
  // Agregar nuevo ítem aquí
]
```

## Testing

Cambiar `userType` en el backend:

```java
session.setUserType("CLIENTE");  // o "ADMIN"
```

## Notas

- Control solo frontend (suficiente para proyecto universitario)
- userType viene del backend en la sesión
- Filtrado automático en Landing y Sidebar
