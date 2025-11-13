import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useLogout'
import { usePermissions } from '../../hooks/usePermissions'
import type { RouteKey } from '../../config/permissions'

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

const BrandLink = styled(NavLink)<{ $collapsed: boolean }>`
  text-decoration: none;
  padding: 0 20px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
  cursor: pointer;

  div {
    color: white;
    font-weight: 800;
    font-size: ${({ $collapsed }) => ($collapsed ? '14px' : '18px')};
    white-space: ${({ $collapsed }) => ($collapsed ? 'normal' : 'nowrap')};
    text-align: ${({ $collapsed }) => ($collapsed ? 'center' : 'left')};
    line-height: 1.3;
    transition: all 0.3s ease;
  }

  &:hover div {
    opacity: 0.8;
  }
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

const UserSectionButton = styled.button<{ $collapsed: boolean }>`
  padding: 16px 20px;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s ease;
  position: relative;
  width: 100%;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

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
    text-align: left;
  }
`

const UserPopup = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  left: 20px;
  right: 20px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 0;
  margin-bottom: 8px;
  z-index: 1000;
`

const UserSectionContainer = styled.div`
  position: relative;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`

const PopupButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  .material-symbols-outlined {
    font-size: 20px;
    color: #1eb79a;
  }

  &:hover {
    background: rgba(30, 183, 154, 0.08);
    color: #1eb79a;
  }
`

const Content = styled.main`
  background: #e8ecef;
  min-height: 100vh;
`

// Definir ítems del sidebar con sus rutas y permisos
const SIDEBAR_ITEMS: Array<{
  route: RouteKey
  path: string
  icon: string
  label: string
}> = [
  { route: 'envios', path: '/envios', icon: 'box', label: 'Envíos' },
  { route: 'planificacion', path: '/planificacion', icon: 'psychology', label: 'Planificación' },
  { route: 'simulacion-tiempo-real', path: '/simulacion/tiempo-real', icon: 'schedule', label: 'Tiempo Real' },
  { route: 'simulacion-semanal', path: '/simulacion/semanal', icon: 'calendar_month', label: 'Simulación Semanal' },
  { route: 'simulacion-colapso', path: '/simulacion/colapso', icon: 'warning', label: 'Simulación Colapso' },
  { route: 'datos', path: '/datos', icon: 'database', label: 'Datos' },
  { route: 'reportes', path: '/reportes', icon: 'description', label: 'Reportes' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const userSectionRef = useRef<HTMLDivElement>(null)
  const session = useAuthStore((s) => s.session)
  const logoutMutation = useLogout()
  const { hasRouteAccess } = usePermissions()
  
  // Obtener el nombre del usuario de la sesión con múltiples fallbacks
  const userName = session?.userName || session?.name || session?.email || 'Usuario'
  
  // Filtrar ítems del sidebar según permisos del usuario
  const visibleItems = SIDEBAR_ITEMS.filter((item) => hasRouteAccess(item.route))

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logoutMutation.mutate()
    }
  }

  // Cerrar popup cuando el sidebar se colapsa
  const handleSidebarMouseLeave = () => {
    setCollapsed(true)
    setShowUserPopup(false)
  }

  // Cerrar popup cuando hace click fuera
  useEffect(() => {
    if (!showUserPopup) return

    const handleClickOutside = (event: MouseEvent) => {
      if (userSectionRef.current && !userSectionRef.current.contains(event.target as Node)) {
        setShowUserPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserPopup])

  return (
    <Shell $collapsed={collapsed}>
      <SidebarContainer
        $collapsed={collapsed}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <BrandLink to="/" $collapsed={collapsed}>
          <div>{collapsed ? 'MP' : 'MoraPack'}</div>
        </BrandLink>

        <Nav>
          {visibleItems.map((item) => (
            <NavItem key={item.route} to={item.path} $collapsed={collapsed}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavItem>
          ))}
        </Nav>

        <UserSectionContainer ref={userSectionRef}>
          <UserSectionButton
            $collapsed={collapsed}
            onClick={() => setShowUserPopup(!showUserPopup)}
          >
            <div className="user-info">
              <span className="material-symbols-outlined">account_circle</span>
              <span>{userName}</span>
            </div>
          </UserSectionButton>
          <AnimatePresence>
            {showUserPopup && (
              <UserPopup
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <PopupButton
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLogout()
                  }}
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Cerrar sesión</span>
                </PopupButton>
              </UserPopup>
            )}
          </AnimatePresence>
        </UserSectionContainer>
      </SidebarContainer>

      <Content>
        <Outlet />
      </Content>
    </Shell>
  )
}
