import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Hook que inicializa la sesión desde localStorage al cargar la app
 * Debe usarse en el componente raíz (App.tsx) para asegurar que la sesión
 * se restaura antes de renderizar las rutas
 */
export function useInitializeAuth() {
  useEffect(() => {
    const initializeSession = useAuthStore.getState().initializeSession
    initializeSession()
  }, [])
}
