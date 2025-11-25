import { useState, useCallback, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane } from 'react-leaflet'
import L, { type LatLngTuple } from 'leaflet'
import { useAirports } from '../../hooks/api/useAirports'
import { simulationService, type CollapseSimulationResult, type CollapseSimulationProgress } from '../../api/simulationService'
import { toast } from 'react-toastify'
import { useSimulationStore } from '../../store/useSimulationStore'
import type { Continent } from '../../types/Continent'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'

// ====================== Animations ======================
const fly = keyframes`
  0% { left: -5%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 105%; opacity: 0; }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

// ====================== Styled Components (Mismo estilo que Weekly/Daily) ======================
const Wrapper = styled.div`
  padding: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

const Header = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const StatusBadge = styled.div<{ $status: 'idle' | 'running' | 'collapsed' | 'success' }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => {
    if (p.$status === 'running') return '#d1fae5'
    if (p.$status === 'collapsed') return '#fee2e2'
    if (p.$status === 'success') return '#dbeafe'
    return '#f3f4f6'
  }};
  color: ${(p) => {
    if (p.$status === 'running') return '#065f46'
    if (p.$status === 'collapsed') return '#991b1b'
    if (p.$status === 'success') return '#1e40af'
    return '#6b7280'
  }};
`

const ControlButton = styled.button<{ $variant?: 'play' | 'stop' | 'warning' }>`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${(p) => {
    if (p.$variant === 'play') return '#10b981'
    if (p.$variant === 'stop') return '#ef4444'
    if (p.$variant === 'warning') return '#f59e0b'
    return '#6b7280'
  }};
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`

const MapWrapper = styled.div`
  width: 100%;
  height: 70vh;
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`

const SimulationControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 260px;
`

const ControlsLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #111827;
  margin-bottom: 4px;
`

const ProgressBox = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%);
  border-radius: 8px;
  color: white;
  text-align: center;
`

const ProgressBoxDanger = styled(ProgressBox)`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
`

const ProgressValue = styled.div`
  font-size: 28px;
  font-weight: 900;
  font-family: 'Courier New', monospace;
`

const ProgressLabel = styled.div`
  font-size: 11px;
  opacity: 0.9;
  margin-top: 2px;
`

const StatsRow = styled.div`
  font-size: 12px;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const StatLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const StatValue = styled.strong<{ $danger?: boolean }>`
  color: ${p => p.$danger ? '#ef4444' : '#111827'};
`

// ====================== Loading Overlay ======================
const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 12px;
`

const LoadingContent = styled.div`
  text-align: center;
  max-width: 400px;
  padding: 32px;
`

const LoadingTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`

const LoadingSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
`

const AirplaneContainer = styled.div`
  position: relative;
  width: 280px;
  height: 80px;
  margin: 0 auto 24px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 8px;
`

const AnimatedPlane = styled.div<{ $delay: number; $top: number }>`
  position: absolute;
  top: ${p => p.$top}%;
  left: -5%;
  font-size: 24px;
  animation: ${fly} ${p => 2.5 + p.$delay * 0.3}s linear infinite;
  animation-delay: ${p => p.$delay}s;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 16px;
`

const ProgressFill = styled.div<{ $percent: number; $danger?: boolean }>`
  width: ${p => Math.min(p.$percent, 100)}%;
  height: 100%;
  background: ${p => p.$danger 
    ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' 
    : 'linear-gradient(90deg, #14b8a6 0%, #10b981 100%)'};
  border-radius: 999px;
  transition: width 0.3s ease;
`

const LoadingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`

const LoadingStat = styled.div`
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`

const LoadingStatValue = styled.div<{ $danger?: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.$danger ? '#ef4444' : '#111827'};
`

const LoadingStatLabel = styled.div`
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  margin-top: 2px;
`

// ====================== Modal Styles ======================
const ModalOverlay = styled.div<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 420px;
  width: calc(100% - 32px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`

const ModalTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`

const ModalSubtitle = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`

const FormGroup = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background-color: #ffffff;
  color-scheme: light;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }
`

const InfoBox = styled.div`
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 13px;
  color: #166534;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`

const ModalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  border: ${p => p.$primary ? 'none' : '1px solid #d1d5db'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${p => p.$primary ? '#14b8a6' : 'white'};
  color: ${p => p.$primary ? 'white' : '#374151'};
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$primary ? '#0d9488' : '#f9fafb'};
  }
`

// ====================== Result Modal ======================
const ResultModal = styled.div`
  background: white;
  padding: 0;
  border-radius: 16px;
  max-width: 520px;
  width: calc(100% - 32px);
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`

const ResultHeader = styled.div<{ $collapsed: boolean }>`
  text-align: center;
  padding: 28px 24px;
  background: ${p => p.$collapsed 
    ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'};
  border-bottom: 1px solid ${p => p.$collapsed ? '#fecaca' : '#bbf7d0'};
`

const ResultIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`

const ResultTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`

const ResultSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #6b7280;
`

const ResultBody = styled.div`
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
`

const ResultSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`

const ResultSectionTitle = styled.h4`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const ResultCard = styled.div<{ $highlight?: boolean }>`
  padding: 14px;
  background: ${p => p.$highlight ? '#fef2f2' : '#f9fafb'};
  border: 1px solid ${p => p.$highlight ? '#fecaca' : '#e5e7eb'};
  border-radius: 10px;
  text-align: center;
`

const ResultCardValue = styled.div<{ $danger?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${p => p.$danger ? '#dc2626' : '#111827'};
`

const ResultCardLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
`

const ReasonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
`

const ResultFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
`

// ====================== Helpers ======================
function mapAirportToSimAirport(a: any): SimAirport {
  return {
    id: a.id,
    city: a.cityName ?? a.city ?? '',
    country: a.countryName ?? a.country ?? '',
    continent: (a.continent as Continent) ?? 'America',
    latitude: Number(a.latitude ?? 0),
    longitude: Number(a.longitude ?? 0),
    capacityPercent: Number(a.capacityPercent ?? 0),
  }
}

function formatCollapseReason(reason: string): string {
  switch (reason) {
    case 'UNASSIGNED_ORDERS':
      return 'Órdenes sin asignar'
    case 'WAREHOUSE_SATURATED':
      return 'Almacén saturado'
    case 'NO_FLIGHTS':
      return 'Sin vuelos disponibles'
    default:
      return 'Desconocido'
  }
}

// ====================== Component ======================
export function CollapseSimulationPage() {
  const navigate = useNavigate()
  const { simulationStartDate, hasValidConfig } = useSimulationStore()

  // State
  const [showConfigModal, setShowConfigModal] = useState(true)
  const [showResultModal, setShowResultModal] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<CollapseSimulationProgress | null>(null)
  const [result, setResult] = useState<CollapseSimulationResult | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
  
  // Config form
  const [configStartDate, setConfigStartDate] = useState(
    simulationStartDate 
      ? simulationStartDate.toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  )

  // Cancel ref
  const cancelRef = useRef(false)

  // Load airports
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []

  const MAIN_HUB_CODES = ['SPIM', 'EBCI', 'UBBB']
  const mainWarehouses = airports.filter(
    (airport: any) => airport.codeIATA && MAIN_HUB_CODES.includes(airport.codeIATA.toUpperCase())
  )

  // Map bounds
  const bounds = airports.length > 0
    ? L.latLngBounds(
        airports.map((a: any) => [parseFloat(a.latitude), parseFloat(a.longitude)] as LatLngTuple)
      )
    : L.latLngBounds([[-60, -180], [70, 180]])

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution = '&copy; OpenStreetMap & CARTO'

  // Start simulation
  const handleStart = useCallback(async () => {
    if (!configStartDate) {
      toast.error('Debes seleccionar una fecha de inicio')
      return
    }

    setShowConfigModal(false)
    setIsRunning(true)
    setProgress(null)
    setResult(null)
    cancelRef.current = false

    try {
      toast.info('Iniciando simulación de colapso...')

      const simResult = await simulationService.executeCollapseSimulation(
        {
          simulationStartTime: new Date(configStartDate).toISOString(),
          useDatabase: true,
        },
        (prog) => {
          if (!cancelRef.current) {
            setProgress(prog)
          }
        }
      )

      if (!cancelRef.current) {
        setResult(simResult)
        setIsRunning(false)
        setShowResultModal(true)

        if (simResult.hasCollapsed) {
          toast.warning(`Sistema colapsó en el día ${simResult.collapseDay}`)
        } else {
          toast.success('Simulación completada sin colapso')
        }
      }
    } catch (error) {
      console.error('Error en simulación:', error)
      toast.error('Error durante la simulación')
      setIsRunning(false)
    }
  }, [configStartDate])

  // Stop simulation
  const handleStop = useCallback(() => {
    cancelRef.current = true
    setIsRunning(false)
    toast.info('Simulación detenida')
  }, [])

  // Reset
  const handleReset = useCallback(() => {
    setShowResultModal(false)
    setResult(null)
    setProgress(null)
    setShowConfigModal(true)
  }, [])

  // Get status
  const getStatus = (): 'idle' | 'running' | 'collapsed' | 'success' => {
    if (isRunning) return 'running'
    if (result?.hasCollapsed) return 'collapsed'
    if (result && !result.hasCollapsed) return 'success'
    return 'idle'
  }

  const getStatusText = () => {
    const status = getStatus()
    if (status === 'running') return '● Ejecutando'
    if (status === 'collapsed') return '⚠ Colapsado'
    if (status === 'success') return '✓ Completado'
    return '○ Detenido'
  }

  return (
    <Wrapper>
      {/* Config Modal */}
      <ModalOverlay $show={showConfigModal && !isRunning}>
        <ModalContent>
          <ModalTitle>Configurar Simulación de Colapso</ModalTitle>
          <ModalSubtitle>
            La simulación ejecutará el algoritmo día a día hasta que el sistema colapse 
            (cuando hay órdenes sin asignar o almacenes saturados).
          </ModalSubtitle>

          <FormGroup>
            <Label>Fecha de inicio de simulación</Label>
            <Input
              type="datetime-local"
              value={configStartDate}
              onChange={(e) => setConfigStartDate(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Aeropuertos principales (capacidad infinita)</Label>
            <InfoBox>
              SPIM (Lima) • EBCI (Bruselas) • UBBB (Bakú)
            </InfoBox>
          </FormGroup>

          <ButtonRow>
            <ModalButton onClick={() => navigate('/planificacion')}>
              Cancelar
            </ModalButton>
            <ModalButton $primary onClick={handleStart}>
              Iniciar Simulación
            </ModalButton>
          </ButtonRow>
        </ModalContent>
      </ModalOverlay>

      {/* Result Modal */}
      <ModalOverlay $show={showResultModal}>
        <ResultModal>
          {result && (
            <>
              <ResultHeader $collapsed={result.hasCollapsed}>
                <ResultIcon>
                  {result.hasCollapsed ? '!' : '✓'}
                </ResultIcon>
                <ResultTitle>
                  {result.hasCollapsed ? 'Sistema Colapsado' : 'Simulación Completada'}
                </ResultTitle>
                <ResultSubtitle>
                  {result.hasCollapsed 
                    ? `El sistema colapsó después de ${result.collapseDay} días de operación`
                    : `Se simularon ${result.totalDaysSimulated} días sin colapso`}
                </ResultSubtitle>
              </ResultHeader>

              <ResultBody>
                {result.hasCollapsed && (
                  <ResultSection>
                    <ResultSectionTitle>Razón del Colapso</ResultSectionTitle>
                    <ReasonBadge>
                      {formatCollapseReason(result.collapseReason)}
                    </ReasonBadge>
                  </ResultSection>
                )}

                <ResultSection>
                  <ResultSectionTitle>Estadísticas</ResultSectionTitle>
                  <ResultGrid>
                    <ResultCard>
                      <ResultCardValue>{result.totalDaysSimulated}</ResultCardValue>
                      <ResultCardLabel>Días simulados</ResultCardLabel>
                    </ResultCard>
                    <ResultCard>
                      <ResultCardValue>{result.statistics.totalOrdersProcessed}</ResultCardValue>
                      <ResultCardLabel>Órdenes procesadas</ResultCardLabel>
                    </ResultCard>
                    <ResultCard>
                      <ResultCardValue>{result.statistics.assignedProducts}</ResultCardValue>
                      <ResultCardLabel>Productos asignados</ResultCardLabel>
                    </ResultCard>
                    <ResultCard $highlight={result.statistics.unassignedProducts > 0}>
                      <ResultCardValue $danger={result.statistics.unassignedProducts > 0}>
                        {result.statistics.unassignedProducts}
                      </ResultCardValue>
                      <ResultCardLabel>Sin asignar</ResultCardLabel>
                    </ResultCard>
                  </ResultGrid>
                </ResultSection>

                <ResultSection>
                  <ResultSectionTitle>Rendimiento</ResultSectionTitle>
                  <ResultGrid>
                    <ResultCard>
                      <ResultCardValue>
                        {result.statistics.unassignedPercentage.toFixed(1)}%
                      </ResultCardValue>
                      <ResultCardLabel>% Sin asignar</ResultCardLabel>
                    </ResultCard>
                    <ResultCard>
                      <ResultCardValue>
                        {result.executionTimeSeconds.toFixed(1)}s
                      </ResultCardValue>
                      <ResultCardLabel>Tiempo ejecución</ResultCardLabel>
                    </ResultCard>
                  </ResultGrid>
                </ResultSection>
              </ResultBody>

              <ResultFooter>
                <ModalButton onClick={handleReset}>
                  Nueva Simulación
                </ModalButton>
                <ModalButton $primary onClick={() => navigate('/reportes')}>
                  Ver Reportes
                </ModalButton>
              </ResultFooter>
            </>
          )}
        </ResultModal>
      </ModalOverlay>

      <Header>
        <TitleBlock>
          <Title>Simulación de Colapso</Title>
          <Subtitle>
            Ejecuta el algoritmo hasta que el sistema colapse por falta de capacidad
          </Subtitle>
        </TitleBlock>

        <HeaderRight>
          <StatusBadge $status={getStatus()}>
            {getStatusText()}
          </StatusBadge>

          {isRunning ? (
            <ControlButton $variant="stop" onClick={handleStop}>
              Detener
            </ControlButton>
          ) : (
            <ControlButton $variant="play" onClick={() => setShowConfigModal(true)}>
              Configurar
            </ControlButton>
          )}
        </HeaderRight>
      </Header>

      <MapWrapper>
        {/* Loading Overlay */}
        {isRunning && (
          <LoadingOverlay>
            <LoadingContent>
              <LoadingTitle>
                {progress?.hasCollapsed 
                  ? '¡Sistema Colapsando!' 
                  : 'Simulando Operaciones...'}
              </LoadingTitle>
              <LoadingSubtitle>
                Ejecutando algoritmo día a día hasta detectar el punto de colapso
              </LoadingSubtitle>

              <AirplaneContainer>
                <AnimatedPlane $delay={0} $top={20}>▶</AnimatedPlane>
                <AnimatedPlane $delay={0.6} $top={50}>▶</AnimatedPlane>
                <AnimatedPlane $delay={1.2} $top={80}>▶</AnimatedPlane>
              </AirplaneContainer>

              <ProgressBar>
                <ProgressFill 
                  $percent={(progress?.currentDay || 0) * 3} 
                  $danger={progress?.hasCollapsed}
                />
              </ProgressBar>

              <LoadingStats>
                <LoadingStat>
                  <LoadingStatValue>{progress?.currentDay || 0}</LoadingStatValue>
                  <LoadingStatLabel>Día actual</LoadingStatLabel>
                </LoadingStat>
                <LoadingStat>
                  <LoadingStatValue>{progress?.assignedProducts || 0}</LoadingStatValue>
                  <LoadingStatLabel>Asignados</LoadingStatLabel>
                </LoadingStat>
                <LoadingStat>
                  <LoadingStatValue $danger={(progress?.unassignedProducts || 0) > 0}>
                    {progress?.unassignedProducts || 0}
                  </LoadingStatValue>
                  <LoadingStatLabel>Sin asignar</LoadingStatLabel>
                </LoadingStat>
              </LoadingStats>
            </LoadingContent>
          </LoadingOverlay>
        )}

        {/* Controls Panel */}
        {!isRunning && progress && (
          <SimulationControls>
            <div>
              <ControlsLabel>Último resultado</ControlsLabel>
              {result?.hasCollapsed ? (
                <ProgressBoxDanger>
                  <ProgressValue>Día {result.collapseDay}</ProgressValue>
                  <ProgressLabel>Punto de colapso</ProgressLabel>
                </ProgressBoxDanger>
              ) : (
                <ProgressBox>
                  <ProgressValue>{result?.totalDaysSimulated || 0}</ProgressValue>
                  <ProgressLabel>Días simulados</ProgressLabel>
                </ProgressBox>
              )}
            </div>

            <StatsRow>
              <StatLine>
                <span>Productos asignados:</span>
                <StatValue>{result?.statistics.assignedProducts || 0}</StatValue>
              </StatLine>
              <StatLine>
                <span>Sin asignar:</span>
                <StatValue $danger={(result?.statistics.unassignedProducts || 0) > 0}>
                  {result?.statistics.unassignedProducts || 0}
                </StatValue>
              </StatLine>
              <StatLine>
                <span>Tiempo ejecución:</span>
                <StatValue>{(result?.executionTimeSeconds || 0).toFixed(1)}s</StatValue>
              </StatLine>
            </StatsRow>
          </SimulationControls>
        )}

        <MapContainer
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          worldCopyJump={false}
          maxBounds={new L.LatLngBounds([[-90, -180], [90, 180]])}
          maxBoundsViscosity={1.0}
          minZoom={2}
          maxZoom={8}
        >
          <Pane name="airports" style={{ zIndex: 500 }} />
          <Pane name="main-hubs" style={{ zIndex: 600 }} />

          <TileLayer 
            attribution={tileAttribution} 
            url={tileUrl} 
            noWrap={true} 
          />

          {/* Main warehouses */}
          {mainWarehouses.map((airport: any) => {
            const center: LatLngTuple = [
              parseFloat(airport.latitude),
              parseFloat(airport.longitude),
            ]
            const hubFill = '#f6b53b'
            const hubStroke = '#ebc725'

            return (
              <CircleMarker
                key={`hub-${airport.id}`}
                center={center}
                radius={10}
                color={hubStroke}
                fillColor={hubFill}
                fillOpacity={0.95}
                weight={2.5}
                pane="main-hubs"
                eventHandlers={{
                  click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{airport.cityName}</strong>
                    <div style={{ fontSize: '11px', color: hubStroke, fontWeight: 700 }}>
                      Hub principal ({airport.codeIATA || airport.alias})
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}

          {/* Regular airports */}
          {airports.map((airport: any) => (
            <CircleMarker
              key={airport.id}
              center={[parseFloat(airport.latitude), parseFloat(airport.longitude)]}
              radius={6}
              color="#14b8a6"
              fillColor="#14b8a6"
              fillOpacity={0.8}
              weight={2}
              pane="airports"
              eventHandlers={{
                click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div>
                  <strong>{airport.cityName}</strong>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {airport.codeIATA || airport.alias}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </MapWrapper>

      {/* Airport Details Modal */}
      {selectedAirport && (
        <AirportDetailsModal
          airport={selectedAirport}
          onClose={() => setSelectedAirport(null)}
          readOnly
        />
      )}
    </Wrapper>
  )
}
