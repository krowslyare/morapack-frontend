import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import styled from 'styled-components'
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
  gap: 24px;
  max-width: 600px;
`

const Status = styled.div`
  font-size: 48px;
  font-weight: 800;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
`

const Message = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.6;
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
  margin-top: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`

export function ErrorBoundary() {
  const error = useRouteError()

  let status = 500
  let statusText = 'Error'
  let message = 'Algo salió mal. Por favor, intenta de nuevo más tarde.'

  if (isRouteErrorResponse(error)) {
    status = error.status
    statusText = error.statusText || 'Error'
    message = error.data?.message || `Error ${status}: ${statusText}`
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Container>
      <Content
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Status>{status}</Status>
        <Title>{statusText}</Title>
        <Message>{message}</Message>
        <Button onClick={() => window.location.href = '/'}>
          Volver al inicio
        </Button>
      </Content>
    </Container>
  )
}
