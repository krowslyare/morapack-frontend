import styled from 'styled-components'
import { InputHTMLAttributes } from 'react'

const StyledInput = styled.input`
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #1E293B;
  font-size: 0.9rem;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #94A3B8;
    font-size: 0.875rem;
  }

  &:focus {
    border-color: #00C896;
    box-shadow: 0 0 0 3px rgba(0, 200, 150, 0.1);
  }
`

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input(props: InputProps) {
  return <StyledInput {...props} />
}

