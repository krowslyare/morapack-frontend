import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'

type LoginPayload = { email: string; password: string }

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken)
  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post('/auth/login', payload)
      return data as { token: string }
    },
    onSuccess: (data) => setToken(data.token),
  })
}


