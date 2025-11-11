import React, { useState } from 'react'
import styled from 'styled-components'
import type { SimAirport } from '../hooks/useFlightSimulation'
import { AirportState } from '../types/AirportState' 
import { useFlightsByOrigin } from '../hooks/api/useFlights'
import { FlightsListModal } from './FlightsListModal'
import { FlightPackagesModal } from './FlightPackagesModal'


const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; animation: fadeIn .2s ease-in;
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
`

const Modal = styled.div`
  background: #fff; border-radius: 16px; padding: 0;
  width: 90%; max-width: 550px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
  position: relative; animation: slideUp .3s ease-out;
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
`

const Header = styled.div` padding: 24px; border-bottom: 1px solid #e5e7eb; position: relative; `
const CloseButton = styled.button`
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%;
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  transition: background .2s; color: #6b7280; font-size: 20px;
  &:hover{background:#f3f4f6;color:#111827}
`
const Title = styled.h2` margin: 0; font-size: 22px; color: #111827; font-weight: 600; `
const Content = styled.div` padding: 24px; `
const Section = styled.div` margin-bottom: 20px; &:last-child{margin-bottom:0} `
const InfoGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 16px; `
const InfoField = styled.div` display: flex; flex-direction: column; gap: 4px; `
const Label = styled.div` font-size: 13px; color:#6b7280; font-weight: 500; `

const Value = styled.input`
  font-size: 15px; color:#111827; font-weight: 500;
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white;
  &:focus{outline:none; border-color:#14b8a6}
  &[readonly]{background:#f9fafb; cursor: default}
`

const SelectValue = styled.select`
  font-size: 15px; color:#111827; font-weight: 500;
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white;
  &:focus{outline:none; border-color:#14b8a6}
  &:disabled{
    background:#f9fafb; color:#111827; cursor: default;
    pointer-events: none; border-color:#e5e7eb;
  }
`

const Description = styled.textarea`
  width:100%; min-height:80px; padding:12px; border:1px solid #d1d5db; border-radius:6px;
  font-size:14px; color:#374151; resize:vertical; font-family:inherit; background:white;
  &:focus{outline:none; border-color:#14b8a6}
  &[readonly]{background:#f9fafb; cursor: default}
`

const FlightsList = styled.div` margin-top:12px; display:flex; flex-direction:column; gap:8px; `
const FlightItem = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; transition:.2s;
  &:hover{background:#f3f4f6; border-color:#d1d5db}
`
const FlightInfo = styled.div` display:flex; flex-direction:column; gap:2px; `
const FlightCode = styled.div` font-size:15px; color:#111827; font-weight:600; `
const FlightRoute = styled.div` font-size:12px; color:#6b7280; `
const FlightActions = styled.div` display:flex; gap:6px; `
const SmallButton = styled.button`
  padding:6px 12px; border:1px solid #d1d5db; background:white; border-radius:6px;
  font-size:12px; color:#374151; cursor:pointer; transition:.2s; font-weight:500;
  &:hover{background:#14b8a6; color:white; border-color:#14b8a6}
`
const ListFooter = styled.div` text-align:right; margin-top:8px; `
const ViewAllLink = styled.button`
  background:none; border:none; color:#14b8a6; font-size:13px; cursor:pointer; text-decoration:underline; font-weight:500;
  &:hover{color:#0d9488}
`
const Footer = styled.div` padding:16px 24px; border-top:1px solid #e5e7eb; display:flex; justify-content:center; `
const Button = styled.button`
  padding:12px 32px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; transition:.2s; border:none;
  background:#14b8a6; color:white; &:hover{background:#0d9488}
`

interface AirportDetailsModalProps {
  airport: SimAirport | null
  onClose: () => void
  readOnly?: boolean
}

export function AirportDetailsModal({ airport, onClose, readOnly = false }: AirportDetailsModalProps) {
  const [showFlightsList, setShowFlightsList] = useState(false)

  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code?: string } | null>(null)

  const { data: flights = [], isLoading: flightsLoading } =
    useFlightsByOrigin(airport?.id || 0, !!airport?.id)

  if (!airport) return null

  const airportWithData = airport as any
  const maxCapacity = airportWithData.maxCapacity || 1000
  const usedCapacity = airportWithData.currentUsedCapacity || 0

  const availableCapacity = maxCapacity - usedCapacity
  const availablePercentage = maxCapacity > 0 ? (availableCapacity / maxCapacity) * 100 : 100

  const priority = availablePercentage < 20 ? 'Alta' : availablePercentage < 50 ? 'Media' : 'Baja'
  const state: AirportState =
  availablePercentage < 1
    ? AirportState.Closed
    : availablePercentage < 10
    ? AirportState.Restricted
    : AirportState.Available

  const displayedFlights = flights.slice(0, 3)

  return (
    <>
      <Overlay onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>Detalles del Aeropuerto</Title>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>

          <Content>
            <Section>
              <InfoGrid>
                <InfoField>
                  <Label>ID</Label>
                  <Value value={`AE${airport.id}`} readOnly />
                </InfoField>
                <InfoField>
                  <Label>Capacidad ocupada</Label>
                  <Value value={`${usedCapacity} / ${maxCapacity}`} readOnly />
                </InfoField>
              </InfoGrid>
            </Section>

            <Section>
              <InfoGrid>
                <InfoField>
                  <Label>Propietario</Label>
                  <Value value="MoraPack International" readOnly />
                </InfoField>
                <InfoField>
                  <Label>Prioridad</Label>
                  <SelectValue value={priority} disabled={readOnly}>
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
                <SelectValue value={state} disabled={readOnly}>
                  <option value="Available">Disponible</option>
                  <option value="Restricted">Restringido</option>
                  <option value="Closed">Cerrado</option>
                </SelectValue>
              </InfoField>
            </Section>

            <Section>
              <Label>Descripción</Label>
              <Description
                value={`Hub de distribución internacional ubicado en ${airport.city}, ${airport.country}. Capacidad de almacenamiento: ${maxCapacity} paquetes.`}
                readOnly
              />
            </Section>

            <Section>
              <Label>
                Vuelos Programados {flightsLoading && '(Cargando...)'}
                {!flightsLoading && `(${flights.length})`}
              </Label>
              {!flightsLoading && flights.length > 0 ? (
                <>
                 <FlightsList>
                  {displayedFlights.map((flight) => (
                    <FlightItem key={flight.id}>
                      <FlightInfo>
                        <FlightCode>{flight.code || `Vuelo #${flight.id}`}</FlightCode>
                        <FlightRoute>
                          {flight.originAirportCode} → {flight.destinationAirportCode}
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
                  ))}
                </FlightsList>
                  {flights.length > 3 && (
                    <ListFooter>
                      <ViewAllLink onClick={() => setShowFlightsList(true)}>
                        Ver Lista Completa ({flights.length} vuelos)
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
                          No hay vuelos programados
                        </FlightRoute>
                      </FlightInfo>
                    </FlightItem>
                  </FlightsList>
                )
              )}
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
                  <Value value={airportWithData.codeIATA || 'N/A'} readOnly />
                </InfoField>
                <InfoField>
                  <Label>Capacidad Disponible</Label>
                  <Value
                    value={`${availablePercentage.toFixed(1)}%`}
                    readOnly
                    style={{
                      color:
                        availablePercentage < 10 ? '#dc2626' :
                        availablePercentage < 30 ? '#f59e0b' : '#059669',
                      fontWeight: 600,
                    }}
                  />
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
