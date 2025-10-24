// Este archivo define los estilos de la página de login usando styled-components.
// Cada constante exportada representa un elemento HTML con estilos aplicados.

import styled from 'styled-components'

// Título principal del formulario
export const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
`

// Subtítulo con enlace para registrarse
export const Subtitle = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  color: #64748b;

  a {
    color: #00c896;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`

// Contenedor de cada campo del formulario (email, contraseña, etc.)
export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
`

// Etiqueta (texto que describe un campo)
export const Label = styled.label`
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
`

// Enlace de ayuda ("¿Olvidaste tu contraseña?")
export const HelpLink = styled.a`
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #00c896;
  text-decoration: none;
  text-align: right;

  &:hover {
    text-decoration: underline;
  }
`

// Contenedor para el checkbox "Recordarme"
export const CheckboxWrapper = styled.div`
  margin-bottom: 1.25rem;
`

// Agrupa los botones principales (Iniciar sesión y Google)
export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`
// Contenedor para las opciones de inicio de sesión alternativo
export const AltLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
`

// Botón alternativo (ejemplo: Google o Correo)
export const AltButton = styled.button<{ bg?: string; hover?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: ${(props) => props.bg || '#f1f5f9'};
  color: #1e293b;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: ${(props) => props.hover || '#e2e8f0'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }
`

// Sección inferior con mensaje motivacional y botón de registro
export const JoinSection = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #475569;
`

export const JoinButton = styled.button`
  margin-top: 0.75rem;
  background-color: #00c896;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #00b084;
  }
`