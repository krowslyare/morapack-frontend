// Este componente representa la página de inicio de sesión completa.
// Incluye placeholders dinámicos, toasts, y botones alternativos (Google / Correo).

import { useState } from 'react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button, Card, Checkbox, Input } from '../../components/ui'
import { useLoginForm } from './useLoginForm'
import * as S from './LoginPage.styles'

// ✅ Toastify para notificaciones
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ✅ Iconos simples (si usas lucide-react o react-icons, puedes mejorar esto)
import { FaGoogle, FaEnvelope } from 'react-icons/fa'

export function LoginPage() {
  const { isLoading, handleSubmit } = useLoginForm()

  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('123456')

  const handleEmailFocus = () => {
    if (email === 'admin@example.com') setEmail('')
  }

  const handlePasswordFocus = () => {
    if (password === '123456') setPassword('')
  }

  // ✅ Interacción de botones alternativos (por ahora solo logean en consola)
  const handleGoogleLogin = () => {
    console.log('Intentando iniciar sesión con Google...')
  }

  const handleEmailLogin = () => {
    console.log('Intentando iniciar sesión con Correo...')
  }

  const handleJoin = () => {
    console.log('Redirigiendo al registro...')
  }

  return (
    <AuthLayout illustration="/logo_login.png" illustrationAlt="Ilustración de login">
      <Card>
        {/* Encabezado */}
        <S.Title>Iniciar Sesión</S.Title>
        <S.Subtitle>
          ¿Todavía no tiene una cuenta? <a href="#">Cree una ahora</a>
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

          <S.CheckboxWrapper>
            <Checkbox name="remember" label="Recordarme" disabled={isLoading} />
          </S.CheckboxWrapper>

          <S.ButtonGroup>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </S.ButtonGroup>
        </form>

        {/* 🔹 Alternativas de inicio de sesión */}
        <S.AltLoginContainer>
          <S.AltButton onClick={handleGoogleLogin} bg="#f4f4f4" hover="#e5e5e5">
            <FaGoogle color="#DB4437" /> Iniciar con Google
          </S.AltButton>

          <S.AltButton onClick={handleEmailLogin} bg="#f9fafb" hover="#e2e8f0">
            <FaEnvelope color="#00c896" /> Iniciar con Correo
          </S.AltButton>
        </S.AltLoginContainer>

        {/* 🔹 Mensaje motivacional con botón */}
        <S.JoinSection>
          <p>¿Te gustaría formar parte de la experiencia?</p>
          <S.JoinButton onClick={handleJoin}>Únete</S.JoinButton>
        </S.JoinSection>
      </Card>

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
