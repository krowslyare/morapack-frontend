import React, { useState } from 'react'
import styled from 'styled-components'
import type { SimAirport } from '../hooks/useFlightSimulation'
import { AirportState } from '../types/AirportState'
import { useFlightsByOrigin } from '../hooks/api/useFlights'
import { useWarehouseByAirport } from '../hooks/api/useWarehouses'
import { FlightsListModal } from './FlightsListModal'
import { FlightPackagesModal } from './FlightPackagesModal'


// IMPORTA EL TIPO
import type { FlightInstance } from '../api/simulationService'

interface AirportDetailsModalProps {
  airport: SimAirport | null
  onClose: () => void
  readOnly?: boolean

  // 👇 igual que en FlightDrawer
  flightInstances: FlightInstance[]
  instanceHasProducts: Record<string, number>
}



const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
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
  padding: 0;
  width: 92%;
  max-width: 620px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(148, 163, 184, 0.2);
  position: relative;
`

const Header = styled.div`
  padding: 22px 26px 10px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const HeaderTitleBlock = styled.div`
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
  color: #6b7280;
  font-size: 18px;
  transition: background 0.15s, color 0.15s, transform 0.1s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
    transform: translateY(-1px);
  }
`

const Content = styled.div`
  padding: 18px 26px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const InfoField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Label = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

const Value = styled.div`
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  padding: 9px 11px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
`

const TextAreaValue = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 9px 11px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  font-family: inherit;
  outline: none;
`

const Chip = styled.span<{ $variant?: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  ${({ $variant }) => {
    switch ($variant) {
      case 'danger':
        return `
          background: #fee2e2;
          color: #b91c1c;
        `
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
        `
      case 'success':
        return `
          background: #d1fae5;
          color: #065f46;
        `
      default:
        return `
          background: #e0f2fe;
          color: #075985;
        `
    }
  }}
`

const CapacityBar = styled.div`
  margin-top: 4px;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
`

const CapacityFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
  background: linear-gradient(90deg, #fb923c, #ef4444);
  border-radius: 999px;
`

const FlightsList = styled.div`
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FlightItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 11px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  border-left: 3px solid #14b8a6;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-1px);
  }
`

const FlightInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FlightCode = styled.div`
  font-size: 14px;
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
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;

  &:hover {
    background: #14b8a6;
    border-color: #14b8a6;
    color: #ffffff;
    transform: translateY(-0.5px);
  }
`

const ListFooter = styled.div`
  text-align: right;
  margin-top: 6px;
`

const ViewAllLink = styled.button`
  background: none;
  border: none;
  color: #14b8a6;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;

  &:hover {
    color: #0d9488;
  }
`

const Footer = styled.div`
  padding: 14px 26px 18px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
`

const Button = styled.button`
  padding: 10px 28px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #14b8a6;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;

  &:hover {
    background: #0f766e;
    transform: translateY(-1px);
    box-shadow: 0 12px 25px rgba(16, 185, 129, 0.45);
  }
`


export function AirportDetailsModal({
  airport,
  onClose,
  readOnly = false,
  flightInstances,
  instanceHasProducts,
}: AirportDetailsModalProps) {
  const [showFlightsList, setShowFlightsList] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code?: string } | null>(null)

  const { data: flights = [], isLoading: flightsLoading } = useFlightsByOrigin(
    airport?.id || 0,
    !!airport?.id,
  )

  // Fetch warehouse data for real-time capacity updates
  const { data: warehouses } = useWarehouseByAirport(
    airport?.id || 0,
    {
      enabled: !!airport?.id,
      refetchInterval: 1000 // Update every second
    }
  )

  // Use the first warehouse found (assuming one per airport) or fallback to airport prop data
  const warehouse = warehouses?.[0]

  if (!airport) return null

  const airportWithData = airport as any

  // Prioritize warehouse data from API, fallback to airport prop
  const maxCapacity = warehouse?.maxCapacity ?? airportWithData.maxCapacity ?? 1000
  const usedCapacity = warehouse?.usedCapacity ?? airportWithData.currentUsedCapacity ?? 0

  const availableCapacity = maxCapacity - usedCapacity
  const availablePercentage = maxCapacity > 0 ? (availableCapacity / maxCapacity) * 100 : 100
  const usedPercent = maxCapacity > 0 ? (usedCapacity / maxCapacity) * 100 : 0

  const priority = availablePercentage < 20 ? 'Alta' : availablePercentage < 50 ? 'Media' : 'Baja'
  const state: AirportState =
    availablePercentage < 1
      ? AirportState.Closed
      : availablePercentage < 10
      ? AirportState.Restricted
      : AirportState.Available

  const displayedFlights = flights.slice(0, 3)

  const getStateLabel = () => {
    if (state === AirportState.Closed) return 'Cerrado'
    if (state === AirportState.Restricted) return 'Restringido'
    return 'Disponible'
  }

  const stateVariant: 'success' | 'warning' | 'danger' =
    state === AirportState.Closed
      ? 'danger'
      : state === AirportState.Restricted
      ? 'warning'
      : 'success'

  const priorityVariant: 'success' | 'warning' | 'danger' =
    priority === 'Alta' ? 'danger' : priority === 'Media' ? 'warning' : 'success'

  // 🔢 misma lógica que en FlightDrawer, pero por id de vuelo base
  const getProductsForFlight = (flightId?: number) => {
    if (!flightId) return 0

    return flightInstances
      .filter((fi) => fi.flightId === flightId)
      .reduce((sum, fi) => sum + (instanceHasProducts[fi.instanceId] ?? 0), 0)
  }

  return (
    <>
      <Overlay onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <Header>
            <HeaderTitleBlock>
              <Title>Detalles del Aeropuerto</Title>
              <Subtitle>
                {airport.city}, {airport.country} · ID AE{airport.id}
              </Subtitle>
            </HeaderTitleBlock>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>

          <Content>
            {/* Resumen y capacidad */}
            <Section>
              <SectionTitle>Resumen</SectionTitle>
              <InfoGrid>
                <InfoField>
                  <Label>Capacidad ocupada</Label>
                  <Value>
                    {usedCapacity} / {maxCapacity} paquetes
                    <CapacityBar>
                      <CapacityFill $percent={usedPercent} />
                    </CapacityBar>
                  </Value>
                </InfoField>
                <InfoField>
                  <Label>Capacidad disponible</Label>
                  <Value>
                    {availablePercentage.toFixed(1)}%
                  </Value>
                </InfoField>
              </InfoGrid>
            </Section>

            {/* Estado y prioridad */}
            <Section>
              <SectionTitle>Condición operacional</SectionTitle>
              <InfoGrid>
                <InfoField>
                  <Label>Estado</Label>
                  <Value>
                    <Chip $variant={stateVariant}>{getStateLabel()}</Chip>
                  </Value>
                </InfoField>
                <InfoField>
                  <Label>Prioridad</Label>
                  <Value>
                    <Chip $variant={priorityVariant}>{priority}</Chip>
                  </Value>
                </InfoField>
              </InfoGrid>
            </Section>

            {/* Descripción */}
            <Section>
              <SectionTitle>Descripción</SectionTitle>
              <TextAreaValue
                readOnly={readOnly}
                value={`Hub de distribución internacional ubicado en ${airport.city}, ${airport.country}. Capacidad de almacenamiento: ${maxCapacity} paquetes.`}
              />
            </Section>

            {/* Vuelos programados */}
            <Section>
              <SectionTitle>
                Vuelos programados{' '}
                {flightsLoading ? '(Cargando...)' : `(${flights.length})`}
              </SectionTitle>

              {!flightsLoading && flights.length > 0 ? (
                <>
                  <FlightsList>
                    {displayedFlights.map((flight) => {
                      const productsOnFlight = getProductsForFlight(flight.id)

                      return (
                        <FlightItem key={flight.id}>
                          <FlightInfo>
                            <FlightCode>{flight.code || `Vuelo #${flight.id}`}</FlightCode>
                            <FlightRoute>
                              {flight.originAirportCode} → {flight.destinationAirportCode}
                              {productsOnFlight > 0 && (
                                <span
                                  style={{
                                    marginLeft: '8px',
                                    padding: '2px 6px',
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                  }}
                                >
                                  {productsOnFlight}{' '}
                                  {productsOnFlight === 1 ? 'producto' : 'productos'}
                                </span>
                              )}
                            </FlightRoute>
                          </FlightInfo>
                          <FlightActions>
                            <SmallButton
                              onClick={() =>
                                setSelectedFlight({ id: flight.id ?? 0, code: flight.code ?? '' })
                              }
                            >
                              Ver
                            </SmallButton>
                          </FlightActions>
                        </FlightItem>
                      )
                    })}
                  </FlightsList>

                  {flights.length > 3 && (
                    <ListFooter>
                      <ViewAllLink onClick={() => setShowFlightsList(true)}>
                        Ver lista completa ({flights.length} vuelos)
                      </ViewAllLink>
                    </ListFooter>
                  )}
                </>
              ) : (
                !flightsLoading && (
                  <FlightsList>
                    <FlightItem>
                      <FlightInfo>
                        <FlightRoute style={{ textAlign: 'center', color: '#9ca3af' }}>
                          No hay vuelos programados para este aeropuerto.
                        </FlightRoute>
                      </FlightInfo>
                    </FlightItem>
                  </FlightsList>
                )
              )}
            </Section>

            {/* Ubicación */}
            <Section>
              <SectionTitle>Ubicación</SectionTitle>
              <InfoGrid>
                <InfoField>
                  <Label>Ciudad</Label>
                  <Value>{airport.city}</Value>
                </InfoField>
                <InfoField>
                  <Label>País</Label>
                  <Value>{airport.city}</Value>
                </InfoField>
                <InfoField>
                  <Label>Código IATA</Label>
                  <Value>{airportWithData.codeIATA || 'N/A'}</Value>
                </InfoField>
                <InfoField>
                  <Label>Continente</Label>
                  <Value>{airport.continent}</Value>
                </InfoField>
              </InfoGrid>
            </Section>
          </Content>

          <Footer>
            <Button onClick={onClose}>Volver</Button>
          </Footer>
        </Modal>
      </Overlay>

      {showFlightsList && (
        <FlightsListModal
          airportName={airport.city}
          flights={flights}
          onClose={() => setShowFlightsList(false)}
          flightInstances={flightInstances}
          instanceHasProducts={instanceHasProducts}
        />
      )}

      {selectedFlight && (
        <FlightPackagesModal
          flightId={selectedFlight.id}
          flightCode={selectedFlight.code}
          onClose={() => setSelectedFlight(null)}
        />
      )}
    </>
  )
}
