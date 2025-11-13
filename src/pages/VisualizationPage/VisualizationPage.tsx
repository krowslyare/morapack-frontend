import styled from 'styled-components'
import 'leaflet/dist/leaflet.css'
import { FlightMonitor } from '../../components/FlightMonitor'
import { useDataStore } from '../../store/useDataStore'
import { useNavigate } from 'react-router-dom'
import { useFlights } from '../../hooks/api/useFlights'
import { mapFlightsToSimulationResults } from '../../utils/flightMapper'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
`

const BackButton = styled.button`
  padding: 10px 20px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4b5563;
    transform: translateY(-2px);
  }
`

const MapPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
`

const InfoBanner = styled.div<{ $variant: 'success' | 'info' | 'warning' }>`
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;

  ${(p) =>
    p.$variant === 'success' &&
    `
      background: #d1fae5;
      border: 2px solid #6ee7b7;
      color: #065f46;
    `}

  ${(p) =>
    p.$variant === 'info' &&
    `
      background: #dbeafe;
      border: 2px solid #93c5fd;
      color: #1e3a8a;
    `}
`

const ControlsRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`

type SimulationType = 'day-to-day' | 'weekly' | 'collapse'

interface VisualizationPageProps {
  simulationType?: SimulationType
}

export function VisualizationPage({
  simulationType: initialSimulationType = 'weekly',
}: VisualizationPageProps) {
  const simulationType = initialSimulationType
  const navigate = useNavigate()

  const { airports } = useDataStore()
  const { data: flights, isLoading } = useFlights()

  let mappedResults = null

  if (!isLoading && flights && airports?.length) {
    mappedResults = mapFlightsToSimulationResults(flights, airports)
  }

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Visualización de Rutas</Title>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Mapa interactivo de rutas de vuelo generadas desde la base de datos
          </p>
        </div>

        <ControlsRow>
          <BackButton onClick={() => navigate('/planificacion')}>
            Volver a Planificación
          </BackButton>
        </ControlsRow>
      </Header>

      <MapPanel>
        {isLoading && (
          <InfoBanner $variant="info">
            Cargando vuelos desde la base de datos...
          </InfoBanner>
        )}

        {!isLoading && flights && (
          <InfoBanner $variant="success">
            <strong>Vuelos cargados desde la base de datos</strong>
            {' · '}
            {flights.length} vuelos encontrados
            {' · '}
            {mappedResults?.productRoutes?.length ?? 0} rutas generadas
          </InfoBanner>
        )}

        {!isLoading && (!flights || flights.length === 0) && (
          <InfoBanner $variant="info">
            No se encontraron vuelos en la base de datos.
          </InfoBanner>
        )}

        <FlightMonitor
          simulationResults={mappedResults}
          simulationType={simulationType}
        />
      </MapPanel>
    </Wrapper>
  )
}
