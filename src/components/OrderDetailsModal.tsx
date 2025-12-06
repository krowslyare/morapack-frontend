// src/components/OrderDetailsModal.tsx
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import type { OrderSchema, FlightSchema } from '../types'
import { simulationService } from '../api/simulationService'
import { flightsService } from '../api/flightsService'

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

// Tipo para vuelo con datos extendidos
interface FlightWithInstance {
  instanceId: string
  flightId: number
  flight: FlightSchema | null
  departureTime: string
  arrivalTime: string
}

interface OrderDetailsModalProps {
  order: OrderSchema
  onClose: () => void
}

// Parsear el instanceId para extraer el flightId y los tiempos
// Formato: FL-{flightId}-DAY-{day}-{HHMM}
function parseInstanceId(instanceId: string, baseDate: Date): { flightId: number; departureTime: Date } | null {
  const match = instanceId.match(/^FL-(\d+)-DAY-(\d+)-(\d{4})$/)
  if (!match) return null
  
  const flightId = parseInt(match[1], 10)
  const day = parseInt(match[2], 10)
  const timeStr = match[3]
  const hours = parseInt(timeStr.substring(0, 2), 10)
  const minutes = parseInt(timeStr.substring(2, 4), 10)
  
  const departureTime = new Date(baseDate)
  departureTime.setDate(departureTime.getDate() + day)
  departureTime.setHours(hours, minutes, 0, 0)
  
  return { flightId, departureTime }
}

export function OrderDetailsModal({
  order,
  onClose,
}: OrderDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [assignedFlights, setAssignedFlights] = useState<FlightWithInstance[]>([])

  // Cargar datos de vuelos cuando se abre el modal
  useEffect(() => {
    const loadFlightData = async () => {
      if (!order.id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        // 1. Obtener productos de la orden para saber qué vuelos tiene asignados
        const products = await simulationService.getProductsByOrderId(order.id)
        
        // 2. Extraer instanceIds únicos
        const instanceIds = new Set<string>()
        products.forEach(product => {
          if (product.assignedFlightInstance) {
            instanceIds.add(product.assignedFlightInstance)
          }
        })
        
        if (instanceIds.size === 0) {
          setAssignedFlights([])
          setLoading(false)
          return
        }
        
        // 3. Para cada instanceId, extraer el flightId y cargar datos del vuelo
        const baseDate = new Date() // Usamos fecha actual como base
        baseDate.setHours(0, 0, 0, 0)
        const flightPromises: Promise<FlightWithInstance>[] = []
        
        instanceIds.forEach(instanceId => {
          const parsed = parseInstanceId(instanceId, baseDate)
          if (parsed) {
            const promise = flightsService.getById(parsed.flightId)
              .then(flight => {
                // Calcular arrival time basado en transportTimeDays del vuelo
                const arrivalTime = new Date(parsed.departureTime)
                if (flight.transportTimeDays) {
                  arrivalTime.setTime(arrivalTime.getTime() + flight.transportTimeDays * 24 * 60 * 60 * 1000)
                } else if (flight.arrivalTime && flight.departureTime) {
                  // Si tiene horarios fijos, calcular duración
                  const depTime = flight.departureTime as unknown as string
                  const arrTime = flight.arrivalTime as unknown as string
                  if (depTime && arrTime && depTime.includes(':') && arrTime.includes(':')) {
                    const [depH, depM] = depTime.split(':').map(Number)
                    const [arrH, arrM] = arrTime.split(':').map(Number)
                    let durationMinutes = (arrH * 60 + arrM) - (depH * 60 + depM)
                    if (durationMinutes < 0) durationMinutes += 24 * 60 // Si llega al día siguiente
                    arrivalTime.setTime(parsed.departureTime.getTime() + durationMinutes * 60 * 1000)
                  }
                }
                
                return {
                  instanceId,
                  flightId: parsed.flightId,
                  flight,
                  departureTime: parsed.departureTime.toISOString(),
                  arrivalTime: arrivalTime.toISOString(),
                }
              })
              .catch(() => ({
                instanceId,
                flightId: parsed.flightId,
                flight: null,
                departureTime: parsed.departureTime.toISOString(),
                arrivalTime: parsed.departureTime.toISOString(),
              }))
            
            flightPromises.push(promise)
          }
        })
        
        const flights = await Promise.all(flightPromises)
        
        // Ordenar por tiempo de salida
        flights.sort((a, b) => 
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        )
        
        setAssignedFlights(flights)
      } catch (error) {
        console.error('Error loading flight data for order:', order.id, error)
        setAssignedFlights([])
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
              {assignedFlights.length > 1 && (
                <span style={{ fontWeight: 400, fontSize: 12, color: '#6b7280' }}>
                  ({assignedFlights.length} escalas)
                </span>
              )}
            </SectionTitle>
            
            {loading ? (
              <LoadingText>Cargando información de vuelos...</LoadingText>
            ) : assignedFlights.length === 0 ? (
              <NoFlights>
                No hay vuelos asignados a este pedido aún.
                {order.status === 'PENDING' && ' El algoritmo asignará vuelos cuando se ejecute.'}
              </NoFlights>
            ) : (
              assignedFlights.map((flightData, index) => (
                <FlightCard key={flightData.instanceId}>
                  <FlightHeader>
                    <FlightCode>
                      {index + 1}. {flightData.flight?.code || `FL-${flightData.flightId}`}
                    </FlightCode>
                    <StatusBadge $status={flightData.flight?.status || 'SCHEDULED'}>
                      {flightData.flight?.status || 'SCHEDULED'}
                    </StatusBadge>
                  </FlightHeader>
                  
                  {flightData.flight && (
                    <FlightRoute>
                      <FlightCity>{flightData.flight.originAirportCode}</FlightCity>
                      <FlightArrow>→</FlightArrow>
                      <FlightCity>{flightData.flight.destinationAirportCode}</FlightCity>
                    </FlightRoute>
                  )}

                  <FlightTimes>
                    <FlightTime>
                      <TimeLabel>Despegue</TimeLabel>
                      <TimeValue>{formatDateTime(flightData.departureTime)}</TimeValue>
                    </FlightTime>
                    <FlightTime>
                      <TimeLabel>Llegada</TimeLabel>
                      <TimeValue>{formatDateTime(flightData.arrivalTime)}</TimeValue>
                    </FlightTime>
                  </FlightTimes>
                </FlightCard>
              ))
            )}
          </Section>
        </Content>
      </Modal>
    </Overlay>
  )
}
