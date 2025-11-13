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

  .material-symbols-outlined {
    font-size: 24px;
    flex-shrink: 0;
  }

  span:not(.material-symbols-outlined) {
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

  .material-symbols-outlined {
    font-size: 28px;
    flex-shrink: 0;
  }

  span:not(.material-symbols-outlined) {
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
            <span className="material-symbols-outlined">box</span>
            <span>Envíos</span>
          </NavItem>
          <NavItem to="/planificacion" $collapsed={collapsed}>
            <span className="material-symbols-outlined">settings</span>
            <span>Planificación</span>
          </NavItem>
          <NavItem to="/simulacion/diaria" $collapsed={collapsed}>
            <span className="material-symbols-outlined">play_circle</span>
            <span>Simulación Diaria</span>
          </NavItem>
          <NavItem to="/simulacion/tiempo-real" $collapsed={collapsed}>
            <span className="material-symbols-outlined">schedule</span>
            <span>Tiempo Real</span>
          </NavItem>
          <NavItem to="/simulacion/semanal" $collapsed={collapsed}>
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Simulación Semanal</span>
          </NavItem>
          <NavItem to="/simulacion/colapso" $collapsed={collapsed}>
            <span className="material-symbols-outlined">warning</span>
            <span>Simulación Colapso</span>
          </NavItem>
          <NavItem to="/datos" $collapsed={collapsed}>
            <span className="material-symbols-outlined">database</span>
            <span>Datos</span>
          </NavItem>
          <NavItem to="/reportes" $collapsed={collapsed}>
            <span className="material-symbols-outlined">description</span>
            <span>Reportes</span>
          </NavItem>
        </Nav>

        <UserSection $collapsed={collapsed}>
          <span className="material-symbols-outlined">account_circle</span>
          <span>El Mono</span>
        </UserSection>
      </SidebarContainer>

      <Content>
        <Outlet />
      </Content>
    </Shell>
  )
}
