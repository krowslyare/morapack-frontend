import styled from 'styled-components'
import { ButtonHTMLAttributes, PropsWithChildren } from 'react'

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.06s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  box-shadow:
    0 6px 18px rgba(0, 200, 150, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.25);

  &:hover {
    opacity: 0.95;
  }
  &:active {
    transform: translateY(1px);
    box-shadow:
      0 4px 12px rgba(0, 200, 150, 0.35),
      0 2px 6px rgba(0, 0, 0, 0.25);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ children, ...props }: PropsWithChildren<ButtonProps>) {
  return <StyledButton {...props}>{children}</StyledButton>
}
