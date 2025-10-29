import styled from 'styled-components'
import 'leaflet/dist/leaflet.css'
import { FlightMonitor } from '../../components/FlightMonitor'
import { useDataStore } from '../../store/useDataStore'
import { useNavigate } from 'react-router-dom'

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

  ${(p) =>
    p.$variant === 'warning' &&
    `
    background: #fef3c7;
    border: 2px solid #fcd34d;
    color: #92400e;
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
  const { simulationResults, clearSimulationResults } = useDataStore()
  const navigate = useNavigate()
  
  const handleClearResults = () => {
    clearSimulationResults()
    console.log('[VisualizationPage] Simulation results cleared')
  }

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Visualización de Rutas</Title>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Mapa interactivo de rutas de vuelo y optimización
          </p>
        </div>
        <ControlsRow>
          <BackButton onClick={() => navigate('/planificacion')}>Volver a Planificación</BackButton>
          {simulationResults && (
            <BackButton 
              onClick={handleClearResults}
              style={{ background: '#dc2626' }}
            >
              Limpiar Resultados
            </BackButton>
          )}
        </ControlsRow>
      </Header>

      <MapPanel>
        {simulationResults && (
          <>
            <InfoBanner $variant="success">
              <strong>Mostrando resultados de optimización ALNS</strong>
              {' · '}
              {simulationResults.assignedOrders || 0} rutas optimizadas
              {' · '}
              {simulationResults.productRoutes?.length || 0} vuelos planificados
            </InfoBanner>
            <InfoBanner $variant="warning">
              <strong>⚠️ Nota:</strong> Estos son resultados de una ejecución anterior del algoritmo ALNS.
              Si la base de datos ha cambiado (se eliminaron o agregaron vuelos/aeropuertos), 
              estos resultados pueden no ser válidos. Ejecuta el algoritmo nuevamente desde la página de 
              Planificación o usa el botón "Limpiar Resultados" para removerlos.
            </InfoBanner>
          </>
        )}

        {!simulationResults && (
          <InfoBanner $variant="info">
            <strong>ℹ️ Sin resultados de simulación</strong>
            {' · '}
            Ejecuta el algoritmo ALNS desde la página de Planificación para ver rutas optimizadas.
            {' · '}
            <strong>Importante:</strong> Debes cargar datos (aeropuertos, vuelos y pedidos) desde la página "Datos" antes de ejecutar el algoritmo.
          </InfoBanner>
        )}

        <FlightMonitor simulationResults={simulationResults} simulationType={simulationType} />
      </MapPanel>
    </Wrapper>
  )
}
