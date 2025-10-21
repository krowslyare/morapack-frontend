import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import styled from 'styled-components'

const Shell = styled.div<{ $collapsed: boolean }>`
  display: grid;
  grid-template-columns: ${({ $collapsed }) => ($collapsed ? '80px' : '240px')} 1fr;
  min-height: 100vh;
  transition: grid-template-columns 0.3s ease;
`

const SidebarContainer = styled.aside<{ $collapsed: boolean }>`
  background: #1eb79a;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  position: relative;
  transition: width 0.3s ease;
`

const Brand = styled.div<{ $collapsed: boolean }>`
  color: white;
  font-weight: 800;
  font-size: ${({ $collapsed }) => ($collapsed ? '14px' : '18px')};
  padding: 0 20px;
  margin-bottom: 32px;
  white-space: ${({ $collapsed }) => ($collapsed ? 'normal' : 'nowrap')};
  text-align: ${({ $collapsed }) => ($collapsed ? 'center' : 'left')};
  line-height: 1.3;
  transition: all 0.3s ease;
`

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px;
`

const NavItem = styled(NavLink)<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: white;
    color: #1eb79a;
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  span {
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
    white-space: nowrap;
    opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
    transition: opacity 0.2s ease;
  }
`

const UserSection = styled.div<{ $collapsed: boolean }>`
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  span {
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
    font-weight: 600;
    white-space: nowrap;
    opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
    transition: opacity 0.2s ease;
  }
`

const Content = styled.main`
  background: #e8ecef;
  min-height: 100vh;
`

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconMonitor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

function IconDatabase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  )
}

function IconReport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="5" />
      <path d="M3 21c0-4 4-7 9-7s9 3 9 7" />
    </svg>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <Shell $collapsed={collapsed}>
      <SidebarContainer
        $collapsed={collapsed}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <Brand $collapsed={collapsed}>{collapsed ? 'LCL' : 'Los Chanchos Locos'}</Brand>
        
        <Nav>
          <NavItem to="/envios" $collapsed={collapsed}>
            <IconBox />
            <span>Envíos</span>
          </NavItem>
          <NavItem to="/monitoreo" $collapsed={collapsed}>
            <IconMonitor />
            <span>Monitoreo</span>
          </NavItem>
          <NavItem to="/datos" $collapsed={collapsed}>
            <IconDatabase />
            <span>Datos</span>
          </NavItem>
          <NavItem to="/reportes" $collapsed={collapsed}>
            <IconReport />
            <span>Reportes</span>
          </NavItem>
        </Nav>

        <UserSection $collapsed={collapsed}>
          <IconUser />
          <span>El Mono</span>
        </UserSection>
      </SidebarContainer>

      <Content>
        <Outlet />
      </Content>
    </Shell>
  )
}

