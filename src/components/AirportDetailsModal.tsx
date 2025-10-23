import styled from 'styled-components'
import type { SimAirport } from '../hooks/useFlightSimulation'
import type { AirportState } from '../types/AirportState'

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
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

const Content = styled.div`
  padding: 24px;
`

const Section = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
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

const Value = styled.input`
  font-size: 15px;
  color: #111827;
  font-weight: 500;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;

  &:focus {
    outline: none;
    border-color: #14b8a6;
  }
`

const SelectValue = styled.select`
  font-size: 15px;
  color: #111827;
  font-weight: 500;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;

  &:focus {
    outline: none;
    border-color: #14b8a6;
  }
`

const Description = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  font-family: inherit;
  background: white;

  &:focus {
    outline: none;
    border-color: #14b8a6;
  }
`

const FlightsList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FlightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
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
  gap: 2px;
`

const FlightCode = styled.div`
  font-size: 15px;
  color: #111827;
  font-weight: 600;
`

const FlightRoute = styled.div`
  font-size: 12px;
  color: #6b7280;
`

const FlightActions = styled.div`
  display: flex;
  gap: 6px;
`

const SmallButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: #14b8a6;
    color: white;
    border-color: #14b8a6;
  }
`

const ListFooter = styled.div`
  text-align: right;
  margin-top: 8px;
`

const ViewAllLink = styled.button`
  background: none;
  border: none;
  color: #14b8a6;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;

  &:hover {
    color: #0d9488;
  }
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

interface ScheduledFlight {
  code: string
  route: string
  status: string
}

interface AirportDetailsModalProps {
  airport: SimAirport | null
  onClose: () => void
}

// Extended airport data with warehouse info (dummy data)
interface ExtendedAirportData {
  id: number
  codeIATA: string
  alias: string
  maxCapacity: number
  usedCapacity: number
  owner: string
  priority: string
  state: AirportState
  description: string
  scheduledFlights: ScheduledFlight[]
}

export function AirportDetailsModal({ airport, onClose }: AirportDetailsModalProps) {
  if (!airport) return null

  // Generate dummy data based on the airport
  const extendedData: ExtendedAirportData = {
    id: airport.id,
    codeIATA: getIATACode(airport.city),
    alias: airport.city,
    maxCapacity: 15000,
    usedCapacity: Math.floor((airport.capacityPercent / 100) * 15000),
    owner: 'MoraPack International',
    priority: airport.capacityPercent > 80 ? 'Alta' : airport.capacityPercent > 50 ? 'Media' : 'Baja',
    state: airport.capacityPercent > 90 ? 'Restricted' : 'Avaiable',
    description: `Hub de distribución internacional ubicado en ${airport.city}, ${airport.country}. ${getAirportDescription(airport.city)}`,
    scheduledFlights: generateScheduledFlights(airport.city)
  }

  const capacityPercentage = (extendedData.usedCapacity / extendedData.maxCapacity) * 100

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Detalles del Aeropuerto</Title>
          <CloseButton onClick={onClose}>
            ✕
          </CloseButton>
        </Header>

        <Content>
          <Section>
            <InfoGrid>
              <InfoField>
                <Label>ID</Label>
                <Value value={`AE${extendedData.id}`} readOnly />
              </InfoField>
              <InfoField>
                <Label>Capacidad ocupada</Label>
                <Value value={`${extendedData.usedCapacity} / ${extendedData.maxCapacity}`} readOnly />
              </InfoField>
            </InfoGrid>
          </Section>

          <Section>
            <InfoGrid>
              <InfoField>
                <Label>Propietario</Label>
                <Value value={extendedData.owner} readOnly />
              </InfoField>
              <InfoField>
                <Label>Prioridad</Label>
                <SelectValue value={extendedData.priority}>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </SelectValue>
              </InfoField>
            </InfoGrid>
          </Section>

          <Section>
            <InfoField>
              <Label>Estado</Label>
              <SelectValue value={extendedData.state}>
                <option value="Avaiable">Disponible</option>
                <option value="Restricted">Restringido</option>
                <option value="Closed">Cerrado</option>
              </SelectValue>
            </InfoField>
          </Section>

          <Section>
            <Label>Descripción</Label>
            <Description value={extendedData.description} readOnly />
          </Section>

          <Section>
            <Label>Vuelos Programados</Label>
            <FlightsList>
              {extendedData.scheduledFlights.map((flight, idx) => (
                <FlightItem key={idx}>
                  <FlightInfo>
                    <FlightCode>{flight.code}</FlightCode>
                    <FlightRoute>{flight.route}</FlightRoute>
                  </FlightInfo>
                  <FlightActions>
                    <SmallButton>Detalles</SmallButton>
                    <SmallButton>📍</SmallButton>
                  </FlightActions>
                </FlightItem>
              ))}
            </FlightsList>
            <ListFooter>
              <ViewAllLink onClick={() => alert('Ver lista completa - Funcionalidad pendiente')}>
                Ver Lista
              </ViewAllLink>
            </ListFooter>
          </Section>

          <Section>
            <InfoGrid>
              <InfoField>
                <Label>Ciudad</Label>
                <Value value={airport.city} readOnly />
              </InfoField>
              <InfoField>
                <Label>País</Label>
                <Value value={airport.country} readOnly />
              </InfoField>
              <InfoField>
                <Label>Código IATA</Label>
                <Value value={extendedData.codeIATA} readOnly />
              </InfoField>
              <InfoField>
                <Label>Capacidad %</Label>
                <Value 
                  value={`${capacityPercentage.toFixed(1)}%`} 
                  readOnly 
                  style={{ 
                    color: capacityPercentage > 90 ? '#dc2626' : capacityPercentage > 70 ? '#f59e0b' : '#059669',
                    fontWeight: 600
                  }}
                />
              </InfoField>
            </InfoGrid>
          </Section>
        </Content>

        <Footer>
          <Button onClick={onClose}>
            Volver
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  )
}

// Helper functions for dummy data generation
function getIATACode(city: string): string {
  const codes: Record<string, string> = {
    'Lima': 'LIM',
    'Brussels': 'BRU',
    'Baku': 'GYD',
    'New York': 'JFK',
    'Tokyo': 'NRT',
    'Madrid': 'MAD'
  }
  return codes[city] || 'XXX'
}

function getAirportDescription(city: string): string {
  const descriptions: Record<string, string> = {
    'Lima': 'Centro de operaciones para Sudamérica con conexiones directas a principales ciudades del continente.',
    'Brussels': 'Hub europeo estratégico con alta capacidad de almacenamiento y distribución.',
    'Baku': 'Punto de conexión entre Europa y Asia, especializado en carga de alto volumen.',
    'New York': 'Principal aeropuerto de Norteamérica con infraestructura de última generación.',
    'Tokyo': 'Centro de operaciones para Asia-Pacífico con tecnología avanzada de logística.',
    'Madrid': 'Hub para Península Ibérica y conexión con África y Latinoamérica.'
  }
  return descriptions[city] || 'Aeropuerto internacional con servicios completos de carga.'
}

function generateScheduledFlights(city: string): ScheduledFlight[] {
  const flightsByCity: Record<string, ScheduledFlight[]> = {
    'Lima': [
      { code: 'LC-102', route: 'MIAMI | 19:40', status: 'Programado' },
      { code: 'LC-103', route: 'MADRID | 18:40', status: 'Programado' },
      { code: 'LC-105', route: 'TOKYO | 15:40', status: 'En vuelo' }
    ],
    'Brussels': [
      { code: 'LC-201', route: 'PARIS | 08:30', status: 'Programado' },
      { code: 'LC-202', route: 'LONDON | 10:15', status: 'Programado' },
      { code: 'LC-204', route: 'BERLIN | 14:20', status: 'En vuelo' }
    ],
    'Baku': [
      { code: 'LC-301', route: 'MOSCOW | 11:00', status: 'Programado' },
      { code: 'LC-303', route: 'DUBAI | 16:45', status: 'Programado' },
      { code: 'LC-305', route: 'ISTANBUL | 09:30', status: 'En vuelo' }
    ],
    'New York': [
      { code: 'LC-401', route: 'LA | 07:00', status: 'Programado' },
      { code: 'LC-402', route: 'CHICAGO | 09:30', status: 'Programado' },
      { code: 'LC-404', route: 'BOSTON | 12:15', status: 'En vuelo' }
    ],
    'Tokyo': [
      { code: 'LC-501', route: 'SEOUL | 13:20', status: 'Programado' },
      { code: 'LC-502', route: 'BEIJING | 15:40', status: 'Programado' },
      { code: 'LC-503', route: 'SHANGHAI | 17:00', status: 'En vuelo' }
    ],
    'Madrid': [
      { code: 'LC-601', route: 'BARCELONA | 08:00', status: 'Programado' },
      { code: 'LC-602', route: 'LISBON | 10:30', status: 'Programado' },
      { code: 'LC-603', route: 'ROME | 14:45', status: 'En vuelo' }
    ]
  }
  return flightsByCity[city] || [
    { code: 'LC-999', route: 'UNKNOWN | 00:00', status: 'Programado' }
  ]
}

