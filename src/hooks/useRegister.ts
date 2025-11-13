import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import type { RegisterRequest } from '../types'

// Este hook encapsula la llamada a la API para registrar un nuevo usuario.
// No guarda la sesión automáticamente, ya que el flujo típico es
// registrar -> redirigir a login -> iniciar sesión.
export function useRegister() {
  return useMutation({
    mutationKey: ['register'],
    mutationFn: async (payload: RegisterRequest) => {
      // Asumimos que el endpoint de registro es /auth/register
      const { data } = await api.post('/auth/register', payload)
      // La respuesta podría ser algo como { success: boolean, message: string }
      return data as { success: boolean; message?: string }
    },
  })
}
