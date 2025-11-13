// Este componente representa la página de inicio de sesión completa.
// Incluye placeholders dinámicos, toasts, y animaciones visuales mejoradas.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button, Card, Checkbox, Input } from '../../components/ui'
import { ShimmerButton } from '../../components/ui/shimmer-button'
import { useLoginForm } from './useLoginForm'
import * as S from './LoginPage.styles'

// ✅ Toastify para notificaciones
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function LoginPage() {
  const { isLoading, handleSubmit } = useLoginForm()

  // Valores por defecto para la cuenta mock solicitada
  const [email, setEmail] = useState('monosupremo@gmail.com')
  const [password, setPassword] = useState('monosupremo123')

  const handleEmailFocus = () => {
    if (email === 'monosupremo@gmail.com') setEmail('')
  }

  const handlePasswordFocus = () => {
    if (password === 'monosupremo123') setPassword('')
  }

  // Navegación para enlaces de registro
  const navigate = useNavigate()

  const handleJoin = () => {
    navigate('/register')
  }

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
          <S.Title>Iniciar Sesión</S.Title>
        <S.Subtitle>
          ¿Todavía no tiene una cuenta? <Link to="/register">Cree una ahora</Link>
        </S.Subtitle>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit}>
          <S.FormField>
            <S.Label htmlFor="email">Dirección de correo electrónico:</S.Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Introduce tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleEmailFocus}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handlePasswordFocus}
              required
              disabled={isLoading}
            />
            <div style={{ textAlign: 'right' }}>
              <S.HelpLink href="#">¿Ha olvidado su contraseña?</S.HelpLink>
            </div>
          </S.FormField>


          <S.ButtonGroup>
            <Button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                transition: 'all 0.3s ease',
                transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </S.ButtonGroup>
        </form>

        {/* Opciones de inicio de sesión alternativo removidas (no funcionales) */}

        {/* 🔹 Mensaje motivacional con botón shimmer */}
        <S.JoinSection>
          <p>¿Te gustaría formar parte de la experiencia?</p>
          <div className="flex justify-center mt-3">
            <ShimmerButton 
              onClick={handleJoin}
              background="#00C896"
              shimmerColor="#174708ff"
              shimmerDuration="1s"
            >
              <span className="font-semibold text-white">Únete</span>
            </ShimmerButton>
          </div>
        </S.JoinSection>
      </Card>
          </motion.div>

          {/* ✅ Contenedor global de toasts */}
          <ToastContainer
            position="top-center"
            autoClose={2500}
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
