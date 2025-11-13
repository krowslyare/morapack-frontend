import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { BackgroundPaths } from '../ui/background-paths'

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
  position: relative;
  z-index: 20;
  overflow: hidden;

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

const Container = styled.div`
  min-height: calc(100vh - 72px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 2rem;
  background: transparent;
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

const IllustrationWrapper = styled.div`
  width: 100%;
  max-width: 640px;
  
  @media (max-width: 1100px) {
    display: none;
  }
`

const Illustration = styled(motion.img)`
  width: 100%;
  height: auto;
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.25));
`

export function AuthLayoutWrapper() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: '#e1e7ea' }}>
      {/* Animated background paths - persiste entre rutas de auth */}
      <div className="absolute inset-0 z-0">
        <BackgroundPaths />
      </div>
      
      {/* Main content overlay */}
      <div className="relative z-10">
        <BrandBar>MoraPack</BrandBar>
        <Container>
          <Inner>
            {/* Imagen animada que persiste entre rutas */}
            <IllustrationWrapper>
              <Illustration 
                src="/logo_login.png" 
                alt="Ilustración de MoraPack"
                animate={{
                  y: [0, -15, 0],
                  rotate: [-1, 1, -1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </IllustrationWrapper>
            
            {/* Contenido de las páginas (login/register) */}
            <div>
              <Outlet />
            </div>
          </Inner>
        </Container>
      </div>
    </div>
  )
}
