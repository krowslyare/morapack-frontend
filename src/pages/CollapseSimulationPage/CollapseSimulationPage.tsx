import { useState, useCallback, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane } from 'react-leaflet'
import L, { type LatLngTuple } from 'leaflet'
import { useAirports } from '../../hooks/api/useAirports'
import { simulationService, type CollapseSimulationResult } from '../../api/simulationService'
import { toast } from 'react-toastify'
import { useSimulationStore } from '../../store/useSimulationStore'
import type { Continent } from '../../types/Continent'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'

// ====================== Animations ======================
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
`

const LoadingTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
`

const LoadingSubtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 28px;
  line-height: 1.4;
`

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 20px;
`

const ProgressFill = styled.div<{ $percent: number; $danger?: boolean }>`
  width: ${p => Math.min(p.$percent, 100)}%;
  height: 100%;
  background: ${p => p.$danger ? '#f59e0b' : '#14b8a6'};
  border-radius: 2px;
  transition: width 0.5s ease;
`

const LoadingStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
`

const LoadingStat = styled.div`
  text-align: center;
`

const LoadingStatValue = styled.div<{ $danger?: boolean }>`
  font-size: 24px;
  font-weight: 600;
  color: ${p => p.$danger ? '#ef4444' : '#111827'};
  font-family: 'SF Mono', 'Consolas', monospace;
`

const LoadingStatLabel = styled.div`
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
`

const ElapsedTimer = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
  margin-bottom: 4px;

  span {
    font-family: 'SF Mono', 'Consolas', monospace;
    color: #111827;
    font-weight: 600;
  }
`

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  margin-bottom: 24px;
`

const PulseDot = styled.div`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`

const LoadingPhase = styled.div`
  font-size: 13px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 20px;
`

const ProgressInfo = styled.div`
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  margin-bottom: 6px;
`

const FooterNote = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
`

const CancelButton = styled.button`
  margin-top: 20px;
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
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
  const [result, setResult] = useState<CollapseSimulationResult | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
  
  // Config form
  const [configStartDate, setConfigStartDate] = useState(
    simulationStartDate 
      ? simulationStartDate.toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  )

  // Loading state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseRef = useRef<NodeJS.Timeout | null>(null)

  // Loading phases messages
  const loadingPhases = [
    'Inicializando parámetros del algoritmo...',
    'Cargando datos de órdenes y productos...',
    'Procesando rutas de vuelos disponibles...',
    'Ejecutando asignación del día actual...',
    'Calculando capacidad de almacenes...',
    'Verificando restricciones de entrega...',
    'Optimizando distribución de carga...',
    'Analizando saturación del sistema...',
    'Avanzando al siguiente día...',
    'Recalculando estado del sistema...',
  ]

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      setElapsedSeconds(0)
      setCurrentPhase(0)
      
      // Elapsed time counter
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
      
      // Phase message rotator
      phaseRef.current = setInterval(() => {
        setCurrentPhase(prev => (prev + 1) % loadingPhases.length)
      }, 3000)
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (phaseRef.current) clearInterval(phaseRef.current)
      }
    }
  }, [isRunning])

  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Estimate progress (fake but informative)
  const getEstimatedProgress = () => {
    // Asumimos que una simulación típica tarda ~2-5 minutos
    // Mostramos un progreso que avanza lento pero constante
    const baseProgress = Math.min(elapsedSeconds / 180 * 70, 70) // Máximo 70% en 3 min
    const fluctuation = Math.sin(elapsedSeconds * 0.1) * 3 // Pequeña fluctuación
    return Math.min(Math.max(baseProgress + fluctuation, 5), 85) // Entre 5% y 85%
  }

  // Abort controller
  const abortControllerRef = useRef<AbortController | null>(null)

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
    if (!configStartDate || !hasValidConfig() || !simulationStartDate) {
      toast.error('Debes configurar la simulación antes de iniciar')
      return
    }

    setShowConfigModal(false)
    setIsRunning(true)
    setResult(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      toast.info('Iniciando simulación de colapso...')

      const simResult = await simulationService.runCollapseScenario(
        {
          simulationStartTime: new Date(configStartDate).toISOString(),
          useDatabase: true,
        },
        { signal: controller.signal }
      )

      setResult(simResult)
      setShowResultModal(true)

      if (simResult.hasCollapsed) {
        toast.warning(`Sistema colapsó en el día ${simResult.collapseDay}`)
      } else {
        toast.success('Simulación completada sin colapso')
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        toast.info('Simulación cancelada')
      } else {
        console.error('Error en simulación:', error)
        toast.error('Error durante la simulación')
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }, [configStartDate, hasValidConfig, simulationStartDate])

  // Stop simulation
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Reset
  const handleReset = useCallback(() => {
    setShowResultModal(false)
    setResult(null)
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
    if (status === 'collapsed') return 'Colapsado'
    if (status === 'success') return 'Completado'
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
                      <ResultCardValue>{result.totalOrdersProcessed}</ResultCardValue>
                      <ResultCardLabel>Órdenes procesadas</ResultCardLabel>
                    </ResultCard>
                    <ResultCard>
                      <ResultCardValue>{result.assignedProducts}</ResultCardValue>
                      <ResultCardLabel>Productos asignados</ResultCardLabel>
                    </ResultCard>
                    <ResultCard $highlight={(result.unassignedProducts || 0) > 0}>
                      <ResultCardValue $danger={(result.unassignedProducts || 0) > 0}>
                        {result.unassignedProducts}
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
                        {result.unassignedPercentage?.toFixed(1) ?? '0.0'}%
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
              <SpinnerContainer>
                <Spinner />
              </SpinnerContainer>

              <LoadingTitle>Ejecutando Simulación de Colapso</LoadingTitle>
              <LoadingSubtitle>
                El sistema está evaluando día a día hasta detectar el punto de saturación
              </LoadingSubtitle>

              <StatusMessage>
                <PulseDot />
                <span>En proceso</span>
              </StatusMessage>

              <LoadingPhase>{loadingPhases[currentPhase]}</LoadingPhase>

              <ProgressInfo>{getEstimatedProgress().toFixed(0)}%</ProgressInfo>
              <ProgressBar>
                <ProgressFill 
                  $percent={getEstimatedProgress()} 
                  $danger={elapsedSeconds > 180}
                />
              </ProgressBar>

              <LoadingStats>
                <LoadingStat>
                  <LoadingStatValue>{formatElapsedTime(elapsedSeconds)}</LoadingStatValue>
                  <LoadingStatLabel>Tiempo</LoadingStatLabel>
                </LoadingStat>
                <LoadingStat>
                  <LoadingStatValue>~{Math.floor(elapsedSeconds / 8) + 1}</LoadingStatValue>
                  <LoadingStatLabel>Día</LoadingStatLabel>
                </LoadingStat>
                <LoadingStat>
                  <LoadingStatValue>{(elapsedSeconds * 12).toLocaleString()}</LoadingStatValue>
                  <LoadingStatLabel>Órdenes</LoadingStatLabel>
                </LoadingStat>
              </LoadingStats>

              <FooterNote>
                Esta operación puede tomar varios minutos según el volumen de datos
              </FooterNote>

              <CancelButton onClick={handleStop}>
                Cancelar
              </CancelButton>
            </LoadingContent>
          </LoadingOverlay>
        )}

        {/* Controls Panel */}
        {!isRunning && result && (
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
                <StatValue>{result?.assignedProducts || 0}</StatValue>
              </StatLine>
              <StatLine>
                <span>Sin asignar:</span>
                <StatValue $danger={(result?.unassignedProducts || 0) > 0}>
                  {result?.unassignedProducts || 0}
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
