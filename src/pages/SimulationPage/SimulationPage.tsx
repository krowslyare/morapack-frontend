import { useState, useRef } from 'react'
import styled from 'styled-components'
import { useExecuteALNS } from '../../hooks/api'
import { useDataStore } from '../../store/useDataStore'
import { useNavigate } from 'react-router-dom'
import type { FlightSimulationMode } from '../../hooks/useFlightSimulation'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
`

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 32px;
  font-weight: 700;
`

const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
`

const Tab = styled.button<{ $active?: boolean }>`
  padding: 12px 24px;
  border: none;
  background: ${(p) => (p.$active ? '#14b8a6' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : '#6b7280')};
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  font-size: 15px;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? '#0d9488' : '#f3f4f6')};
  }
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-size: 14px;
  color: #374151;
  font-weight: 600;
`

const StyledSelect = styled.select`
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }
`

const StyledInput = styled.input`
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`

const SimulationButton = styled.button<{
  $isLoading?: boolean
  $variant?: 'primary' | 'secondary'
}>`
  background: ${(p) =>
    p.$isLoading ? '#f59e0b' : p.$variant === 'secondary' ? '#6b7280' : '#14b8a6'};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 16px 32px;
  cursor: ${(p) => (p.$isLoading ? 'wait' : 'pointer')};
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-content: center;

  ${(p) =>
    p.$isLoading &&
    `
    animation: pulse 2s ease-in-out infinite;

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `}

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$isLoading ? '#f59e0b' : p.$variant === 'secondary' ? '#4b5563' : '#0d9488'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const ProgressBarContainer = styled.div`
  width: 100%;
  margin-top: 24px;
`

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(p) => p.$progress}%;
  background: linear-gradient(90deg, #14b8a6, #0d9488);
  transition: width 0.5s ease;
  border-radius: 6px;
`

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`

const InfoBox = styled.div<{ $variant: 'success' | 'error' | 'warning' | 'info' }>`
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;

  ${(p) =>
    p.$variant === 'success' &&
    `
    background: #d1fae5;
    border: 2px solid #6ee7b7;
    color: #065f46;
  `}

  ${(p) =>
    p.$variant === 'error' &&
    `
    background: #fee2e2;
    border: 2px solid #fca5a5;
    color: #991b1b;
  `}

  ${(p) =>
    p.$variant === 'warning' &&
    `
    background: #fef3c7;
    border: 2px solid #fcd34d;
    color: #92400e;
  `}

  ${(p) =>
    p.$variant === 'info' &&
    `
    background: #e0e7ff;
    border: 2px solid #c7d2fe;
    color: #3730a3;
  `}
`

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 24px 0;
`

const MetricCard = styled.div`
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: #14b8a6;
  }
`

const MetricLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
`

const MetricValue = styled.div`
  font-size: 32px;
  color: #111827;
  font-weight: 900;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
`

export function SimulationPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config')
  const [mode, setMode] = useState<FlightSimulationMode>('weekly')
  const [progress, setProgress] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Use ref to prevent interval memory leaks
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const navigate = useNavigate()
  const { hasData, datasetVersion, setSimulationResults } = useDataStore()
  const executeALNS = useExecuteALNS()
  const { data: algorithmResults, isPending, error } = executeALNS

  const handleExecuteAlgorithm = async () => {
    setValidationError(null)

    if (!hasData()) {
      setValidationError(
        'No hay datos disponibles. Por favor, carga los datos desde la página "Datos".',
      )
      return
    }

    console.log('[ALNS] Iniciando algoritmo...')
    console.log('Modo de simulación:', mode)
    console.log('Dataset:', datasetVersion)
    console.log('Hora de inicio:', new Date().toLocaleTimeString())

    // Clear any existing interval to prevent leaks
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    // Simulate progress
    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          return 95
        }
        return prev + 5
      })
    }, 300)

    try {
      const result = await executeALNS.mutateAsync()
      setProgress(100)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      // Save results to store for visualization page
      setSimulationResults(result)

      console.log('[ALNS] Algoritmo completado exitosamente')
      console.log('Resultados guardados:', {
        totalProducts: result.totalProducts,
        assignedProducts: result.totalProducts! - (result.unassignedOrders || 0),
        productRoutes: result.productRoutes?.length || 0,
      })

      setActiveTab('results')
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setProgress(0)
      console.error('[ALNS] Error:', err)
    }
  }

  const handleViewVisualization = () => {
    // Navigate to the appropriate simulation route based on selected mode
    const routeMap: Record<FlightSimulationMode, string> = {
      realtime: '/simulacion/tiempo-real',
      weekly: '/simulacion/semanal',
      collapse: '/simulacion/colapso',
    }
    navigate(routeMap[mode] || '/simulacion/semanal')
  }

  return (
    <Wrapper>
      <ContentPanel>
        <div>
          <Title>Simulación de Algoritmo ALNS</Title>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '15px' }}>
            Configura y ejecuta el algoritmo de optimización ALNS (Adaptive Large Neighborhood
            Search)
          </p>
        </div>

        <TabContainer>
          <Tab $active={activeTab === 'config'} onClick={() => setActiveTab('config')}>
            Configuración
          </Tab>
          <Tab $active={activeTab === 'results'} onClick={() => setActiveTab('results')}>
            Resultados
          </Tab>
        </TabContainer>

        {/* CONFIGURATION TAB */}
        {activeTab === 'config' && (
          <>
            <FormGrid>
              <FormGroup>
                <Label>Tipo de Simulación</Label>
                <StyledSelect
                  value={mode}
                  onChange={(e) => setMode(e.target.value as FlightSimulationMode)}
                >
                  <option value="realtime">Diaria (Tiempo Real)</option>
                  <option value="weekly">Semanal (Recomendado)</option>
                  <option value="collapse">Colapso (Estrés)</option>
                </StyledSelect>
              </FormGroup>

              <FormGroup>
                <Label>Algoritmo</Label>
                <StyledInput
                  type="text"
                  value="ALNS - Adaptive Large Neighborhood Search"
                  readOnly
                  style={{ background: '#f9fafb', fontWeight: 600 }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Dataset</Label>
                <StyledInput
                  type="text"
                  value={datasetVersion || 'No hay dataset cargado'}
                  readOnly
                  style={{ background: hasData() ? '#d1fae5' : '#fee2e2' }}
                />
              </FormGroup>
            </FormGrid>

            {validationError && (
              <InfoBox $variant="error">
                <strong>Error:</strong> {validationError}
              </InfoBox>
            )}

            {hasData() && (
              <InfoBox $variant="success">
                <strong>Sistema listo:</strong> Dataset "{datasetVersion}" cargado correctamente
              </InfoBox>
            )}

            <InfoBox $variant="info">
              <strong>ℹ️ Sobre ALNS:</strong> El algoritmo ALNS utiliza parámetros adaptativos
              optimizados automáticamente. El tiempo de ejecución esperado para simulación semanal
              es de 30-90 minutos según la especificación del proyecto.
            </InfoBox>

            <div>
              <SimulationButton
                onClick={handleExecuteAlgorithm}
                disabled={isPending || !hasData()}
                $isLoading={isPending}
              >
                {isPending ? (
                  <>
                    <LoadingSpinner />
                    Ejecutando ALNS...
                  </>
                ) : (
                  <>Ejecutar Algoritmo ALNS</>
                )}
              </SimulationButton>

              {isPending && (
                <>
                  <InfoBox $variant="warning" style={{ marginTop: '20px' }}>
                    <strong>⏳ Procesando...</strong> El algoritmo ALNS está optimizando las rutas
                    de entrega.
                    <br />
                    <span style={{ fontSize: '13px' }}>
                      Esto puede tomar varios minutos dependiendo del tamaño del dataset.
                    </span>
                  </InfoBox>
                  <ProgressBarContainer>
                    <ProgressBarTrack>
                      <ProgressBarFill $progress={progress} />
                    </ProgressBarTrack>
                    <ProgressText>
                      <span>{Math.round(progress)}% completado</span>
                      <span>{progress < 100 ? 'Procesando...' : 'Finalizando...'}</span>
                    </ProgressText>
                  </ProgressBarContainer>
                </>
              )}
            </div>
          </>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <>
            {!algorithmResults && !error && (
              <InfoBox $variant="info">
                <strong>ℹ️ Sin resultados:</strong> No hay resultados disponibles. Ejecuta el
                algoritmo desde la pestaña "Configuración".
              </InfoBox>
            )}

            {error && (
              <InfoBox $variant="error">
                <strong>Error de ejecución:</strong>{' '}
                {error.message || 'Ocurrió un error al ejecutar el algoritmo'}
              </InfoBox>
            )}

            {algorithmResults && (
              <>
                <InfoBox $variant="success">
                  <strong>{algorithmResults.message || 'Algoritmo completado exitosamente'}</strong>
                </InfoBox>

                <ResultsGrid>
                  <MetricCard>
                    <MetricLabel>Órdenes Asignadas</MetricLabel>
                    <MetricValue>{algorithmResults.assignedOrders || 0}</MetricValue>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#059669',
                        marginTop: '8px',
                        fontWeight: 600,
                      }}
                    >
                      ✓{' '}
                      {algorithmResults.totalOrders
                        ? (
                            (algorithmResults.assignedOrders! / algorithmResults.totalOrders) *
                            100
                          ).toFixed(1)
                        : 0}
                      % de cumplimiento
                    </div>
                  </MetricCard>

                  <MetricCard>
                    <MetricLabel>Órdenes Sin Asignar</MetricLabel>
                    <MetricValue
                      style={{
                        color: algorithmResults.unassignedOrders! > 0 ? '#dc2626' : '#059669',
                      }}
                    >
                      {algorithmResults.unassignedOrders || 0}
                    </MetricValue>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Total procesadas: {algorithmResults.totalOrders || 0}
                    </div>
                  </MetricCard>

                  <MetricCard>
                    <MetricLabel>Tiempo de Ejecución</MetricLabel>
                    <MetricValue style={{ fontSize: '28px' }}>
                      {algorithmResults.executionTimeSeconds
                        ? `${(algorithmResults.executionTimeSeconds / 60).toFixed(1)}m`
                        : 'N/A'}
                    </MetricValue>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '8px',
                        fontWeight: 600,
                      }}
                    >
                      {algorithmResults.executionTimeSeconds
                        ? `${algorithmResults.executionTimeSeconds}s`
                        : ''}
                    </div>
                  </MetricCard>

                  <MetricCard>
                    <MetricLabel>Rutas Generadas</MetricLabel>
                    <MetricValue>{algorithmResults.productRoutes?.length || 0}</MetricValue>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Rutas optimizadas
                    </div>
                  </MetricCard>
                </ResultsGrid>

                <ButtonGroup>
                  <SimulationButton onClick={handleViewVisualization}>
                    Ver Visualización en Mapa
                  </SimulationButton>
                  <SimulationButton $variant="secondary" onClick={() => setActiveTab('config')}>
                    Volver a Configuración
                  </SimulationButton>
                </ButtonGroup>
              </>
            )}
          </>
        )}
      </ContentPanel>
    </Wrapper>
  )
}
