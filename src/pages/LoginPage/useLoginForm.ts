// Este hook maneja la lógica del formulario de login:
// - Controla el estado de carga (isLoading)
// - Captura los datos del formulario al enviarlo
// - Simula un proceso de autenticación (login)
// - Muestra mensajes toast en lugar de alertas nativas

import { type FormEvent, useState } from 'react'
import { toast } from 'react-toastify' // ✅ Importar react-toastify

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false) // Estado del botón o proceso de login

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Evita que el formulario recargue la página
    setIsLoading(true) // Activa el estado de "cargando"

    try {
      // Extraer los datos del formulario
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const remember = formData.get('remember') === 'on'

      console.log('Intento de inicio de sesión:', { email, password, remember })

      // Validar campos vacíos
      if (!email || !password) {
        toast.warn('Por favor, complete todos los campos.')
        return
      }

      // 💡 Simulación de llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simula retardo

      // 🧩 Simulamos validación de usuario:
      const fakeUser = {
        email: 'admin@example.com',
        password: '123456',
      }

      // Verificamos si las credenciales coinciden con el usuario simulado
      const isAuthenticated = email === fakeUser.email && password === fakeUser.password

      if (!isAuthenticated) {
        // ❌ Error de credenciales
        toast.error('Usuario y/o contraseña son incorrectos')
        return
      }

      // ✅ Inicio de sesión exitoso
      toast.success(`Bienvenido, ${email}!`)

      // Redirección simulada (opcional)
      // window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error durante el login:', error)
      toast.error('Ocurrió un error inesperado al iniciar sesión.')
    } finally {
      setIsLoading(false) // Desactiva el estado de carga
    }
  }

  return {
    isLoading,
    handleSubmit,
  }
}
