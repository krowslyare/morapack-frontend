import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
`

const Content = styled(motion.div)`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`

const Title = styled.h1`
  font-size: 72px;
  font-weight: 800;
  margin: 0;
  line-height: 1;
`

const Description = styled.p`
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
  max-width: 400px;
`

const Button = styled.button`
  padding: 12px 32px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Container>
      <Content
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>404</Title>
        <Description>
          La página que buscas no existe o fue movida a otro lugar.
        </Description>
        <Button onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </Content>
    </Container>
  )
}
