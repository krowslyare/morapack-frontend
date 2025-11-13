import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useLogout'

const HeaderContainer = styled.header`
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: visible;
  z-index: 100;

  /* Barra animada en la parte inferior */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    
    /* Gradiente que se moverá */
    background: linear-gradient(
      90deg, 
      #00C896,
      #00a078,
      #00C896
    );
    
    /* Animación */
    background-size: 200% 100%;
    animation: moveGradient 3s linear infinite;
  }

  @keyframes moveGradient {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`

const Brand = styled.div`
  color: #00c896;
  font-weight: 700;
  font-size: 1.25rem;
`

const UserSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
`

const AvatarButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #00c896;
  background: transparent;
  color: #00c896;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 200, 150, 0.1);
    transform: scale(1.05);
  }

  .material-symbols-outlined {
    font-size: 28px;
  }
`

const UserPopup = styled(motion.div)`
  position: fixed;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 260px;
  padding: 16px;
  z-index: 9999;
`

const UserInfo = styled.div`
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
`

const UserName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  margin-bottom: 4px;
`

const UserEmail = styled.div`
  font-size: 14px;
  color: #666;
`

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #e74c3c;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(231, 76, 60, 0.1);
    border-color: #e74c3c;
  }

  .material-symbols-outlined {
    font-size: 20px;
  }
`

export function MainHeader() {
  const [showPopup, setShowPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 })
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const session = useAuthStore((s) => s.session)
  const logoutMutation = useLogout()

  const userName = session?.userName || 'Usuario'
  const userLastName = session?.userLastName || ''
  const fullName = `${userName} ${userLastName}`.trim()
  const userEmail = session?.email || 'usuario@morapack.com'

  // Calcular posición del popup basado en el botón
  const updatePopupPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      })
    }
  }

  // Cerrar popup al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false)
      }
    }

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      updatePopupPosition()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopup])

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logoutMutation.mutate()
    }
  }

  return (
    <HeaderContainer>
      <Brand>MoraPack</Brand>

      <UserSection>
        <AvatarButton
          ref={buttonRef}
          onClick={() => setShowPopup(!showPopup)}
          onMouseEnter={() => {
            setShowPopup(true)
            updatePopupPosition()
          }}
          onMouseLeave={() => {
            // Pequeño delay para permitir mover el mouse al popup
            setTimeout(() => {
              if (!popupRef.current?.matches(':hover')) {
                setShowPopup(false)
              }
            }, 200)
          }}
        >
          <span className="material-symbols-outlined">account_circle</span>
        </AvatarButton>

        <AnimatePresence>
          {showPopup && (
            <UserPopup
              ref={popupRef}
              style={{
                top: popupPosition.top,
                right: popupPosition.right,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UserInfo>
                <UserName>{fullName}</UserName>
                <UserEmail>{userEmail}</UserEmail>
              </UserInfo>

              <LogoutButton onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
                <span>Cerrar sesión</span>
              </LogoutButton>
            </UserPopup>
          )}
        </AnimatePresence>
      </UserSection>
    </HeaderContainer>
  )
}
