import styled from 'styled-components'
import { PropsWithChildren } from 'react'

const BrandBar = styled.header`
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  color: #00c896;
  font-weight: 700;
  font-size: 1.25rem;
`

const Container = styled.div`
  min-height: calc(100vh - 72px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 2rem;
  background: #e1e7ea;
`

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 640px 520px;
  gap: 80px;
  align-items: center;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    justify-items: center;
  }
`

const Illustration = styled.img`
  width: 100%;
  max-width: 640px;
  height: auto;
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.25));
`

type AuthLayoutProps = PropsWithChildren<{
  illustration?: string
  illustrationAlt?: string
}>

export function AuthLayout({ children, illustration, illustrationAlt }: AuthLayoutProps) {
  return (
    <>
      <BrandBar>MoraPack</BrandBar>
      <Container>
        <Inner>
          {illustration && (
            <Illustration src={illustration} alt={illustrationAlt || 'Illustration'} />
          )}
          {children}
        </Inner>
      </Container>
    </>
  )
}
