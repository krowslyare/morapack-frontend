import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Sidebar } from './Sidebar'

export function ProtectedLayout() {
  const session = useAuthStore((s) => s.session)
  const location = useLocation()

  // Si no hay sesión, redirigir a login
  
  //if (!session) {
    //return <Navigate to="/login" replace />
  //}

  // Si es la ruta raíz (/), no mostrar sidebar, solo el contenido
  
  //if (location.pathname === '/') {
    // El contenido será el Outlet que renderiza LandingPage
    //return undefined
  //}

  // Para otras rutas protegidas, mostrar el Sidebar
  return <Sidebar />
}
