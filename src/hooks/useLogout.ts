import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export function useLogout() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  
  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      const { data } = await api.post('/auth/logout')
      return data
    },
    onSuccess: () => {
      // Limpiar sesión del store
      setSession(null)
      // Limpiar localStorage si existe
      localStorage.removeItem('morapack_session')
      // Redirigir al login
      navigate('/login')
    },
    onError: () => {
      // Incluso si falla el logout en el backend, limpiamos localmente
      setSession(null)
      localStorage.removeItem('morapack_session')
      navigate('/login')
    }
  })
}
