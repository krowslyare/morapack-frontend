import styled from 'styled-components'
import type { FlightSchema } from '../types'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`

const Modal = styled.div`
  background: #ffffff;
  border-radius: 18px;
  width: min(820px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  padding: 18px 24px 14px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  color: #0f172a;
  font-weight: 700;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, transform 0.1s;
  color: #6b7280;
  font-size: 18px;

  &:hover {
    background: #f3f4f6;
    color: #111827;
    transform: translateY(-1px);
  }
`

const Content = styled.div`
  padding: 16px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
`

const SummaryChip = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`

const SummaryStrong = styled.span`
  color: #111827;
  font-weight: 600;
`

const FlightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
`

const FlightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-1px);
  }
`

const FlightInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

const FlightCode = styled.div`
  font-size: 15px;
  color: #111827;
  font-weight: 600;
`

const FlightRoute = styled.div`
  font-size: 13px;
  color: #4b5563;
`

const FlightDetails = styled.div`
  font-size: 12px;
  color: #9ca3af;
`

const FlightStatus = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
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
  font-size: 14px;
`

const Footer = styled.div`
  padding: 14px 24px 18px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
`

const Button = styled.button`
  padding: 10px 26px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #14b8a6;
  color: white;
  transition: background 0.15s, transform 0.1s, box-shadow 0.1s;

  &:hover {
    background: #0d9488;
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(13, 148, 136, 0.35);
  }
`

interface FlightsListModalProps {
  airportName: string
  flights: FlightSchema[]
  onClose: () => void
}

export function FlightsListModal({ airportName, flights, onClose }: FlightsListModalProps) {
  const scheduledCount = flights.length
  const activeCount = flights.filter((f) => f.status === 'EN_VUELO').length

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleBlock>
            <Title>Vuelos programados</Title>
            <Subtitle>
              {airportName} • {scheduledCount} vuelo{scheduledCount !== 1 ? 's' : ''}
            </Subtitle>
          </TitleBlock>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content>
          <SummaryRow>
            <SummaryChip>
              Total: <SummaryStrong>{scheduledCount}</SummaryStrong>
            </SummaryChip>
            <SummaryChip>
              En vuelo: <SummaryStrong>{activeCount}</SummaryStrong>
            </SummaryChip>
          </SummaryRow>

          {flights.length === 0 ? (
            <EmptyState>No hay vuelos programados para este aeropuerto.</EmptyState>
          ) : (
            <FlightsList>
              {flights.map((flight) => (
                <FlightItem key={flight.id}>
                  <FlightInfo>
                    <FlightCode>{flight.code || `Vuelo #${flight.id}`}</FlightCode>
                    <FlightRoute>
                      {flight.originAirportCode} → {flight.destinationAirportCode}
                      {flight.assignedProducts !== undefined && (
                        <span style={{ 
                          marginLeft: '8px',
                          padding: '2px 6px',
                          background: flight.assignedProducts > 0 ? '#d1fae5' : '#f3f4f6',
                          color: flight.assignedProducts > 0 ? '#065f46' : '#6b7280',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {flight.assignedProducts} {flight.assignedProducts === 1 ? 'producto' : 'productos'}
                        </span>
                      )}
                    </FlightRoute>
                    <FlightDetails>
                      Capacidad: {flight.usedCapacity || 0}/{flight.maxCapacity} • Tiempo de
                      transporte: {flight.transportTimeDays}d • Frecuencia:{' '}
                      {flight.dailyFrequency}x/día
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
