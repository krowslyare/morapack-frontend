import styled from 'styled-components'
import type { SimFlight, SimAirport } from '../hooks/useFlightSimulation'
import type { ActiveFlight } from '../hooks/useTemporalSimulation'

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
  z-index: 10000;
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
  max-width: 500px;
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

const Content = styled.div`
  padding: 24px;
`

const Section = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.h3`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

const InfoField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Label = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`

const Value = styled.div`
  font-size: 16px;
  color: #111827;
  font-weight: 600;
`

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: ${(p) => {
    if (p.$status.toLowerCase().includes('sobrecargado')) return '#fee2e2'
    if (p.$status.toLowerCase().includes('lleno')) return '#fef3c7'
    return '#d1fae5'
  }};
  color: ${(p) => {
    if (p.$status.toLowerCase().includes('sobrecargado')) return '#991b1b'
    if (p.$status.toLowerCase().includes('lleno')) return '#92400e'
    return '#065f46'
  }};
`

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 8px;
`

const ProgressFill = styled.div<{ $percentage: number; $isOvercapacity: boolean }>`
  width: ${(p) => Math.min(100, p.$percentage)}%;
  height: 100%;
  background: ${(p) =>
    p.$isOvercapacity ? '#ef4444' : p.$percentage >= 90 ? '#f59e0b' : '#14b8a6'};
  transition: width 0.3s;
`

const CapacityInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
`

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #14b8a6;
`

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${(p) => (p.$variant === 'primary' ? '#14b8a6' : 'white')};
  color: ${(p) => (p.$variant === 'primary' ? 'white' : '#374151')};
  border: 1px solid ${(p) => (p.$variant === 'primary' ? '#14b8a6' : '#d1d5db')};

  &:hover {
    background: ${(p) => (p.$variant === 'primary' ? '#0d9488' : '#f3f4f6')};
  }
`

interface FlightDetailsModalProps {
  flight: SimFlight | ActiveFlight | null
  origin: SimAirport | null
  destination: SimAirport | null
  onClose: () => void
}

export function FlightDetailsModal({
  flight,
  origin,
  destination,
  onClose,
}: FlightDetailsModalProps) {
  if (!flight || !origin || !destination) return null

  // Handle both SimFlight and ActiveFlight types
  const maxCapacity = 'maxCapacity' in flight ? flight.maxCapacity : 1000
  const usedCapacity = 'usedCapacity' in flight ? flight.usedCapacity : 0
  
  const flightId = 'id' in flight ? flight.id : `FL-${flight.flightId}`
  const flightCode = 'code' in flight ? flight.code : flight.flightCode
  const flightStatus = 'status' in flight ? flight.status : 'EN_VUELO'
  const transportTimeDays = 'transportTimeDays' in flight ? flight.transportTimeDays : 1
  const description = 'description' in flight ? flight.description : undefined

  const capacityPercentage = maxCapacity > 0 ? (usedCapacity / maxCapacity) * 100 : 0
  const isOvercapacity = usedCapacity > maxCapacity

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Detalles del Avión</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content>
          <Section>
            <InfoGrid>
              <InfoField>
                <Label>ID</Label>
                <Value>{flightId}</Value>
              </InfoField>
              <InfoField>
                <Label>Número</Label>
                <Value>{flightCode}</Value>
              </InfoField>
            </InfoGrid>
          </Section>

          <Section>
            <SectionTitle>Capacidad Ocupada (Kg)</SectionTitle>
            <InfoGrid>
              <InfoField>
                <Label>Capacidad Máxima</Label>
                <Value>{maxCapacity} Kg</Value>
              </InfoField>
              <InfoField>
                <Label>Capacidad Usada</Label>
                <Value>{usedCapacity} Kg</Value>
              </InfoField>
            </InfoGrid>
            <ProgressBar>
              <ProgressFill $percentage={capacityPercentage} $isOvercapacity={isOvercapacity} />
            </ProgressBar>
            <CapacityInfo>
              <span>{capacityPercentage.toFixed(1)}% utilizado</span>
              {isOvercapacity && (
                <span style={{ color: '#dc2626', fontWeight: 600 }}>¡Sobrecarga!</span>
              )}
            </CapacityInfo>
          </Section>

          <Section>
            <SectionTitle>Estado</SectionTitle>
            <StatusBadge $status={flightStatus}>{flightStatus}</StatusBadge>
          </Section>

          <Section>
            <InfoGrid>
              <InfoField>
                <Label>Origen</Label>
                <Value>{origin.city}</Value>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{origin.country}</span>
              </InfoField>
              <InfoField>
                <Label>Destino</Label>
                <Value>{destination.city}</Value>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{destination.country}</span>
              </InfoField>
            </InfoGrid>
          </Section>

          <Section>
            <InfoField>
              <Label>Tiempo de Transporte</Label>
              <Value>
                {transportTimeDays} {transportTimeDays === 1 ? 'día' : 'días'}
              </Value>
            </InfoField>
          </Section>

          {description && (
            <Section>
              <SectionTitle>Descripción</SectionTitle>
              <Description>{description}</Description>
            </Section>
          )}
        </Content>

        <Footer>
          <Button $variant="secondary" onClick={onClose}>
            No cancelables
          </Button>
          <Button $variant="primary" onClick={onClose}>
            Volver
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  )
}
