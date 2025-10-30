import styled from 'styled-components'
import { InputHTMLAttributes } from 'react'

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
`

const StyledCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #00c896;
`

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <CheckboxWrapper>
      <StyledCheckbox type="checkbox" {...props} />
      {label}
    </CheckboxWrapper>
  )
}
