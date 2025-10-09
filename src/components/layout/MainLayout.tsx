import { PropsWithChildren } from 'react'
import styled from 'styled-components'

const Shell = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
`

const Sidebar = styled.aside`
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1rem;
`

const Content = styled.main`
  padding: 1rem 1.25rem;
`

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <Shell>
      <Sidebar>Sidebar</Sidebar>
      <Content>{children}</Content>
    </Shell>
  )
}


