import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'

type LoginPayload = { email: string; password: string }

// Ajustamos el hook para la nueva forma de respuesta del backend (AuthResponse -> { success, message, session })
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (payload: LoginPayload) => {
      // El backend espera "username" no "email"
      const { data } = await api.post('/auth/login', {
        username: payload.email,
        password: payload.password
      })
      return data as { success: boolean; message?: string; session?: any }
    },
    onSuccess: (data) => {
      // Si el backend devuelve session, la guardamos en el store
      if (data && data.session) {
        setSession(data.session)
      }
    },
  })
}
