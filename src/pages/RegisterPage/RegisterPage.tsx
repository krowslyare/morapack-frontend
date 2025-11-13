import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button, Card, Input } from '../../components/ui'
import { ShimmerButton } from '../../components/ui/shimmer-button'
import { useRegisterForm } from './useRegisterForm'
import * as S from './RegisterPage.styles'

// Toastify para notificaciones
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function RegisterPage() {
  const { isLoading, handleSubmit } = useRegisterForm()

  return (
    <AuthLayout>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
        <Card>
          {/* Encabezado */}
          <S.Title>Crear una Cuenta</S.Title>
        <S.Subtitle>
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </S.Subtitle>

        {/* Formulario de registro */}
        <form onSubmit={handleSubmit}>
          <S.FormField>
            <S.Label htmlFor="name">Nombre de usuario:</S.Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Introduce tu nombre de usuario"
              required
              disabled={isLoading}
            />
          </S.FormField>

          <S.FormField>
            <S.Label htmlFor="email">Dirección de correo electrónico:</S.Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Introduce tu correo electrónico"
              required
              disabled={isLoading}
            />
          </S.FormField>

          <S.FormField>
            <S.Label htmlFor="password">Contraseña:</S.Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </S.FormField>

          <S.FormField>
            <S.Label htmlFor="confirmPassword">Confirmar Contraseña:</S.Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </S.FormField>

          <S.ButtonGroup>
            <div className="flex justify-center mt-3">
              <ShimmerButton 
                type="submit" 
                disabled={isLoading}
                background="#00C896"
                shimmerColor="#ffffff"
                shimmerDuration="2.5s"
              >
                <span className="font-semibold text-white">
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </span>
              </ShimmerButton>
            </div>
          </S.ButtonGroup>
        </form>
      </Card>
          </motion.div>

          {/* Contenedor global de toasts */}
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
    </AuthLayout>
  )
}
