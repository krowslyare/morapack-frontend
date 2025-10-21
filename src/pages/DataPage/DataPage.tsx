import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
`

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  min-height: 600px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const Title = styled.h2`
  margin: 0 0 16px 0;
  color: #111827;
  font-size: 24px;
`

const PlaceholderText = styled.p`
  color: #9ca3af;
  font-size: 16px;
`

export function DataPage() {
  return (
    <Wrapper>
      <ContentPanel>
        <Title>Datos</Title>
        <PlaceholderText>Contenido de la página</PlaceholderText>
      </ContentPanel>
    </Wrapper>
  )
}

