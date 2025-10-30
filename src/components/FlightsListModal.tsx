import styled from 'styled-components'
import type { FlightSchema } from '../types'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  color: #6b7280;
  font-size: 20px;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 600;
`

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b7280;
`

const Content = styled.div`
  padding: 24px;
`

const FlightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FlightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`

const FlightInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`

const FlightCode = styled.div`
  font-size: 16px;
  color: #111827;
  font-weight: 600;
`

const FlightRoute = styled.div`
  font-size: 13px;
  color: #6b7280;
`

const FlightDetails = styled.div`
  font-size: 12px;
  color: #9ca3af;
`

const FlightStatus = styled.span<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$status) {
      case 'PROGRAMADO':
        return '#dbeafe'
      case 'EN_VUELO':
        return '#d1fae5'
      case 'COMPLETADO':
        return '#e5e7eb'
      case 'CANCELADO':
        return '#fee2e2'
      default:
        return '#f3f4f6'
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'PROGRAMADO':
        return '#1e40af'
      case 'EN_VUELO':
        return '#047857'
      case 'COMPLETADO':
        return '#374151'
      case 'CANCELADO':
        return '#b91c1c'
      default:
        return '#6b7280'
    }
  }};
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
`

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
`

const Button = styled.button`
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #14b8a6;
  color: white;

  &:hover {
    background: #0d9488;
  }
`

interface FlightsListModalProps {
  airportName: string
  flights: FlightSchema[]
  onClose: () => void
}

export function FlightsListModal({ airportName, flights, onClose }: FlightsListModalProps) {
  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Vuelos Programados</Title>
          <Subtitle>
            {airportName} • {flights.length} vuelo{flights.length !== 1 ? 's' : ''}
          </Subtitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content>
          {flights.length === 0 ? (
            <EmptyState>No hay vuelos programados para este aeropuerto</EmptyState>
          ) : (
            <FlightsList>
              {flights.map((flight) => (
                <FlightItem key={flight.id}>
                  <FlightInfo>
                    <FlightCode>{flight.code || `Vuelo #${flight.id}`}</FlightCode>
                    <FlightRoute>
                      {flight.originAirportCode} → {flight.destinationAirportCode}
                    </FlightRoute>
                    <FlightDetails>
                      Capacidad: {flight.usedCapacity || 0}/{flight.maxCapacity} • Tiempo de
                      transporte: {flight.transportTimeDays}d • Frecuencia: {flight.dailyFrequency}x/día
                    </FlightDetails>
                  </FlightInfo>
                  <FlightStatus $status={flight.status || 'PROGRAMADO'}>
                    {flight.status || 'PROGRAMADO'}
                  </FlightStatus>
                </FlightItem>
              ))}
            </FlightsList>
          )}
        </Content>

        <Footer>
          <Button onClick={onClose}>Cerrar</Button>
        </Footer>
      </Modal>
    </Overlay>
  )
}
