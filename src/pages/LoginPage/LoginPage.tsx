import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button, Card, Checkbox, GoogleButton, Input } from '../../components/ui'
import { useLoginForm } from './useLoginForm'
import * as S from './LoginPage.styles'

export function LoginPage() {
  const { isLoading, handleSubmit } = useLoginForm()

  return (
    <AuthLayout illustration="/logo_login.png" illustrationAlt="Ilustración de login">
      <Card>
        <S.Title>Iniciar Sesión</S.Title>
        <S.Subtitle>
          ¿Todavía no tiene una cuenta? <a href="#">Cree una ahora</a>
        </S.Subtitle>

        <form onSubmit={handleSubmit}>
          <S.FormField>
            <S.Label htmlFor="email">Dirección de correo electrónico:</S.Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Introduce la dirección de correo electrónico"
              required
              disabled={isLoading}
            />
          </S.FormField>

          <S.FormField>
            <S.Label htmlFor="password">Contraseña</S.Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
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
            <GoogleButton disabled={isLoading} />
          </S.ButtonGroup>
        </form>
      </Card>
    </AuthLayout>
  )
}

