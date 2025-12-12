// src/components/OrderDetailsModal.tsx
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import type { OrderSchema } from '../types'
import { simulationService } from '../api/simulationService'

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
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
`

const Modal = styled.div`
  background: #ffffff;
  border-radius: 18px;
  width: min(600px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  padding: 18px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 18px 18px 0 0;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
`

const Subtitle = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
`

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  transition: background 0.15s, transform 0.1s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`

const Content = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${({ $status }) => {
    switch ($status) {
      case 'DELIVERED': return '#d1fae5'
      case 'IN_TRANSIT': return '#dbeafe'
      case 'PENDING': return '#fef3c7'
      case 'ASSIGNED': return '#e0e7ff'
      case 'ARRIVED': return '#cffafe'
      default: return '#f3f4f6'
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'DELIVERED': return '#065f46'
      case 'IN_TRANSIT': return '#1e40af'
      case 'PENDING': return '#92400e'
      case 'ASSIGNED': return '#3730a3'
      case 'ARRIVED': return '#0e7490'
      default: return '#374151'
    }
  }};
`

const FlightCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FlightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const FlightCode = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
`

const FlightRoute = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
`

const FlightCity = styled.span`
  font-weight: 600;
  color: #334155;
`

const FlightArrow = styled.span`
  color: #14b8a6;
  font-weight: 600;
`

const FlightTimes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const FlightTime = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const TimeLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
`

const TimeValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
`

const NoFlights = styled.div`
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px dashed #e5e7eb;
`

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
`

// Tipo para vuelo (leg) de la ruta
interface FlightLeg {
  flightId: number
  flightCode: string
  originAirportCode: string
  destinationAirportCode: string
  sequenceOrder: number
  departureTime?: string
  arrivalTime?: string
}

interface OrderDetailsModalProps {
  order: OrderSchema
  onClose: () => void
}

export function OrderDetailsModal({
  order,
  onClose,
}: OrderDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [flightLegs, setFlightLegs] = useState<FlightLeg[]>([])

  // Cargar datos de vuelos cuando se abre el modal
  useEffect(() => {
    const loadFlightData = async () => {
      if (!order.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Usar el nuevo endpoint que obtiene todos los vuelos de la ruta
        const response = await simulationService.getOrderFlightLegs(order.id)

        if (response.success && response.flightLegs.length > 0) {
          setFlightLegs(response.flightLegs)
        } else {
          setFlightLegs([])
        }
      } catch (error) {
        console.error('Error loading flight data for order:', order.id, error)
        setFlightLegs([])
      } finally {
        setLoading(false)
      }
    }

    loadFlightData()
  }, [order.id])

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-PE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <TitleBlock>
            <Title>Pedido: {order.name}</Title>
            <Subtitle>ID: {order.id}</Subtitle>
          </TitleBlock>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        <Content>
          {/* Información general */}
          <Section>
            <SectionTitle>Información General</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Estado</InfoLabel>
                <StatusBadge $status={order.status}>{order.status}</StatusBadge>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Origen</InfoLabel>
                <InfoValue>{order.originCityName}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Destino</InfoLabel>
                <InfoValue>{order.destinationCityName}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Fecha de Entrega</InfoLabel>
                <InfoValue>{formatDate(order.deliveryDate)}</InfoValue>
              </InfoItem>
              {order.customerSchema?.name && (
                <InfoItem>
                  <InfoLabel>Cliente</InfoLabel>
                  <InfoValue>{order.customerSchema.name}</InfoValue>
                </InfoItem>
              )}
              {order.priority && (
                <InfoItem>
                  <InfoLabel>Prioridad</InfoLabel>
                  <InfoValue>{order.priority}</InfoValue>
                </InfoItem>
              )}
            </InfoGrid>
          </Section>

          {/* Vuelos asignados */}
          <Section>
            <SectionTitle>
              Vuelo(s) Asignado(s)
              {flightLegs.length > 1 && (
                <span style={{ fontWeight: 400, fontSize: 12, color: '#6b7280' }}>
                  ({flightLegs.length} escalas)
                </span>
              )}
            </SectionTitle>

            {loading ? (
              <LoadingText>Cargando información de vuelos...</LoadingText>
            ) : flightLegs.length === 0 ? (
              <NoFlights>
                No hay vuelos asignados a este pedido aún.
                {order.status === 'PENDING' && ' El algoritmo asignará vuelos cuando se ejecute.'}
              </NoFlights>
            ) : (
              flightLegs.map((leg, index) => (
                <FlightCard key={`${leg.flightId}-${leg.sequenceOrder}`}>
                  <FlightHeader>
                    <FlightCode>
                      {index + 1}. {leg.flightCode}
                    </FlightCode>
                    <StatusBadge $status="ACTIVE">
                      ACTIVE
                    </StatusBadge>
                  </FlightHeader>

                  <FlightRoute>
                    <FlightCity>{leg.originAirportCode}</FlightCity>
                    <FlightArrow>→</FlightArrow>
                    <FlightCity>{leg.destinationAirportCode}</FlightCity>
                  </FlightRoute>

                  {(leg.departureTime || leg.arrivalTime) && (
                    <FlightTimes>
                      <FlightTime>
                        <TimeLabel>Despegue</TimeLabel>
                        <TimeValue>{leg.departureTime || '—'}</TimeValue>
                      </FlightTime>
                      <FlightTime>
                        <TimeLabel>Llegada</TimeLabel>
                        <TimeValue>{leg.arrivalTime || '—'}</TimeValue>
                      </FlightTime>
                    </FlightTimes>
                  )}
                </FlightCard>
              ))
            )}
          </Section>
        </Content>
      </Modal>
    </Overlay>
  )
}
