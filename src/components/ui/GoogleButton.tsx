import styled from 'styled-components'
import { ButtonHTMLAttributes } from 'react'

const StyledGoogleButton = styled.button`
  width: 100%;
  padding: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;

  &:hover {
    background: #f8fafc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009.003 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.33z"
      fill="#FBBC05"
    />
    <path
      d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0A8.997 8.997 0 00.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.039-3.71z"
      fill="#EA4335"
    />
  </svg>
)

export type GoogleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function GoogleButton(props: GoogleButtonProps) {
  return (
    <StyledGoogleButton type="button" {...props}>
      <GoogleIcon />
      Continuar con Google
    </StyledGoogleButton>
  )
}

