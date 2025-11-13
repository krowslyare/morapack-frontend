// Este hook maneja la lógica del formulario de login:
// - Controla el estado de carga (isLoading)
// - Captura los datos del formulario al enviarlo
// - Simula un proceso de autenticación (login)
// - Muestra mensajes toast en lugar de alertas nativas

import { type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'

// Este hook delega el login real al hook useLogin (react-query)
export function useLoginForm() {
  const navigate = useNavigate()
  const mutation = useLogin()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string) || ''
    const password = (formData.get('password') as string) || ''
    const remember = formData.get('remember') === 'on'

    if (!email || !password) {
      toast.warn('Por favor, complete todos los campos.')
      return
    }

    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data?.success) {
            toast.success(`Bienvenido, ${data.session?.userName ?? email}!`)
            // Si el usuario marcó "recordarme" podríamos persistir la sesión en localStorage
            if (remember && data.session) {
              try {
                localStorage.setItem('morapack_session', JSON.stringify(data.session))
              } catch (err) {
                // No fatal: solo logueamos
                console.warn('No se pudo persistir la sesión en localStorage', err)
              }
            }
            // Redirigir a la página principal
            navigate('/')
          } else {
            toast.error(data?.message ?? 'No se pudo autenticar')
          }
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || 'Error al conectar con el servidor'
          toast.error(message)
        },
      },
    )
  }

  return {
    isLoading: mutation.status === 'pending',
    handleSubmit,
  }
}
