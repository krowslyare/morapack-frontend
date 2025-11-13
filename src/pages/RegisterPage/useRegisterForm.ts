// Este hook maneja la lógica del formulario de registro:
// - Controla el estado de carga (isLoading)
// - Captura los datos del formulario al enviarlo
// - Llama al hook de mutación `useRegister`
// - Muestra notificaciones (toast) según el resultado

import { type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useRegister } from '../../hooks/useRegister'

export function useRegisterForm() {
  const navigate = useNavigate()
  const mutation = useRegister()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string) || ''
    const email = (formData.get('email') as string) || ''
    const password = (formData.get('password') as string) || ''
    const confirmPassword = (formData.get('confirmPassword') as string) || ''

    // Validaciones básicas
    if (!name || !email || !password || !confirmPassword) {
      toast.warn('Por favor, complete todos los campos.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    // Construimos el payload con la forma que el backend espera: RegisterRequest
    const payload = {
      name: name,
      lastName: '',
      username: email,
      password: password,
      // El backend espera TypeUser (ADMIN | CUSTOMER | STAFF). Usamos CUSTOMER por defecto.
      type: 'CUSTOMER' as any,
    }

    mutation.mutate(
      payload as any,
      {
        onSuccess: (data) => {
          if (data?.success) {
            toast.success(data.message || '¡Registro exitoso! Ahora puede iniciar sesión.')
            // Redirigir a la página de login después de un registro exitoso
            navigate('/login')
          } else {
            toast.error(data?.message ?? 'Ocurrió un error durante el registro.')
          }
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || err?.message || 'Error al conectar con el servidor.'
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
