import styled from 'styled-components'
import { PropsWithChildren } from 'react'

const StyledCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: none;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
`

export function Card({ children }: PropsWithChildren) {
  return <StyledCard>{children}</StyledCard>
}

