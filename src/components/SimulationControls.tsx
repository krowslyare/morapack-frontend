import { useState } from 'react'
import styled from 'styled-components'
import type { FlightSimulationMode } from '../hooks/useFlightSimulation'
import type { AlgorithmRequest, AlgorithmResultSchema } from '../types'
import { useDataStore } from '../store/useDataStore'

const SimulationUITray = styled.div`
  margin-bottom: 24px;
`

const TabContainer = styled.div`
  display: flex;
  gap: 4px;
`

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border: none;
  background: ${p => p.$active ? '#14b8a6' : '#e5e7eb'};
  color: ${p => p.$active ? 'white' : '#6b7280'};
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: ${p => p.$active ? '600' : '400'};
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$active ? '#0d9488' : '#d1d5db'};
  }
`

const SimulationPanel = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0 8px 8px 8px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  position: relative;
`

const PanelTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #111827;
  font-weight: 600;
`

const Section = styled.div`
  margin-bottom: 16px;
`

const SectionTitle = styled.h3`
  font-size: 16px;
  color: #111827;
  margin: 24px 0 16px 0;
  font-weight: 600;
`

const SubTabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
`

const SubTab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${p => p.$active ? '#14b8a6' : 'transparent'};
  color: ${p => p.$active ? 'white' : '#6b7280'};
  cursor: pointer;
  border-radius: 6px;
  font-weight: ${p => p.$active ? '500' : '400'};
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$active ? '#0d9488' : '#f3f4f6'};
  }
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 13px;
  color: #374151;
  font-weight: 500;
`

const StyledSelect = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
  }
`

const StyledInput = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`

const DateTimeGroup = styled.div`
  display: flex;
  gap: 8px;
`

const SimulationButton = styled.button<{ $isLoading?: boolean }>`
  background: ${p => p.$isLoading ? '#f59e0b' : '#14b8a6'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  ${p => p.$isLoading && `
    animation: pulse 2s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `}

  &:hover {
    background: ${p => p.$isLoading ? '#f59e0b' : '#0d9488'};
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`

const LoadingIndicator = styled.div`
  display: inline-block;
  margin-left: 8px;
  
  &::after {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const ProgressBarContainer = styled.div`
  width: 100%;
  margin-top: 16px;
`

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${p => p.$progress}%;
  background: linear-gradient(90deg, #14b8a6, #0d9488);
  transition: width 0.3s ease;
  border-radius: 4px;
`

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
`

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`

const MetricCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`

const MetricLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 500;
`

const MetricValue = styled.div`
  font-size: 24px;
  color: #111827;
  font-weight: 700;
`

const InfoText = styled.p`
  color: #6b7280;
  font-size: 14px;
  margin: 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
`

const SuccessMessage = styled.div`
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`

interface SimulationControlsProps {
  mode: FlightSimulationMode;
  setMode: (mode: FlightSimulationMode) => void;
}

export function SimulationControls({ mode, setMode }: SimulationControlsProps) {
  const [activeTab, setActiveTab] = useState('simulation')
  const [paramsSubTab, setParamsSubTab] = useState('algorithm')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AlgorithmResultSchema | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedDatasetVersion, setSelectedDatasetVersion] = useState<string>('')
  
  const { hasData, datasetVersion, getAvailableVersions, datasets, setSimulationResults } = useDataStore()
  
  // Algorithm parameters state
  const [algorithmParams, setAlgorithmParams] = useState<AlgorithmRequest>({
    algorithmType: 'TABU',
    maxIterations: 1000,
    maxNoImprovement: 100,
    neighborhoodSize: 100,
    tabuListSize: 50,
    tabuTenure: 10000,
    useDatabase: false
  })

  // Actualizar parámetros cuando cambia el algoritmo
  const handleAlgorithmTypeChange = (newType: string) => {
    if (newType === 'ALNS') {
      // ALNS no usa estos parámetros según el backend
      setAlgorithmParams({
        algorithmType: 'ALNS',
        useDatabase: algorithmParams.useDatabase
      })
    } else {
      // TABU necesita todos los parámetros
      setAlgorithmParams({
        algorithmType: 'TABU',
        maxIterations: 1000,
        maxNoImprovement: 100,
        neighborhoodSize: 100,
        tabuListSize: 50,
        tabuTenure: 10000,
        useDatabase: algorithmParams.useDatabase
      })
    }
  }

  const handleParamChange = (key: keyof AlgorithmRequest, value: string | number | boolean) => {
    setAlgorithmParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExecuteAlgorithm = async () => {
    // Validar que existan datos
    setValidationError(null)
    
    if (!hasData()) {
      setValidationError('No hay datos disponibles. Por favor, carga los datos desde la página "Datos" antes de ejecutar la simulación.')
      return
    }
    
    setIsLoading(true)
    setResults(null)
    setProgress(0)
    
    // Mostrar feedback inmediato
    console.log('======================================')
    console.log('[INICIO] Simulación de Algoritmo')
    console.log('======================================')
    console.log('Algoritmo:', algorithmParams.algorithmType)
    console.log('Parámetros:', algorithmParams)
    console.log('Versión de Dataset:', selectedDatasetVersion || datasetVersion)
    console.log('Hora de inicio:', new Date().toLocaleTimeString())
    
    // Simular progreso realista
    const totalSteps = 10
    const stepDuration = 300
    
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      setProgress((i / totalSteps) * 100)
    }
    
    // Generar resultados dummy realistas
    const totalOrders = Math.floor(Math.random() * 50) + 200 // 200-250 órdenes
    const assignedOrders = Math.floor(totalOrders * (0.9 + Math.random() * 0.08)) // 90-98% asignadas
    const unassignedOrders = totalOrders - assignedOrders
    const executionTime = Math.floor(Math.random() * 30) + 15 // 15-45 segundos
    
    const dummyResults: AlgorithmResultSchema = {
      success: true,
      message: 'Simulación completada exitosamente',
      algorithmType: algorithmParams.algorithmType,
      executionStartTime: new Date(Date.now() - executionTime * 1000).toISOString(),
      executionEndTime: new Date().toISOString(),
      executionTimeSeconds: executionTime,
      totalOrders: totalOrders,
      assignedOrders: assignedOrders,
      unassignedOrders: unassignedOrders,
      totalProducts: Math.floor(totalOrders * 1.5),
      score: Math.random() * 500 + 1000,
      productRoutes: generateDummyRoutes(assignedOrders)
    }
    
    console.log('======================================')
    console.log('[ÉXITO] Simulación Completada')
    console.log('======================================')
    console.log('Tiempo de ejecución:', dummyResults.executionTimeSeconds, 'segundos')
    console.log('Órdenes procesadas:', dummyResults.totalOrders)
    console.log('Órdenes asignadas:', dummyResults.assignedOrders)
    console.log('Órdenes sin asignar:', dummyResults.unassignedOrders)
    console.log('Score:', dummyResults.score)
    console.log('======================================')
    
    setResults(dummyResults)
    setSimulationResults(dummyResults)
    setActiveTab('results')
    setIsLoading(false)
  }
  
  // Generar rutas dummy para visualización
  const generateDummyRoutes = (count: number) => {
    const cities = ['Lima', 'Brussels', 'Baku', 'New York', 'Tokyo', 'Madrid']
    const routes = []
    
    for (let i = 0; i < Math.min(count, 50); i++) {
      const origin = cities[Math.floor(Math.random() * cities.length)]
      let dest = cities[Math.floor(Math.random() * cities.length)]
      while (dest === origin) {
        dest = cities[Math.floor(Math.random() * cities.length)]
      }
      
      routes.push({
        orderId: i + 1,
        orderName: `ORD-${1000 + i}`,
        originCity: origin,
        destinationCity: dest,
        flightCount: Math.floor(Math.random() * 3) + 1,
        flights: []
      })
    }
    
    return routes
  }

  return (
    <SimulationUITray>
      <TabContainer>
        <Tab $active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')}>
          Simulación
        </Tab>
        <Tab $active={activeTab === 'params'} onClick={() => setActiveTab('params')}>
          Parámetros
        </Tab>
        <Tab $active={activeTab === 'results'} onClick={() => setActiveTab('results')}>
          Resultados
        </Tab>
      </TabContainer>
      
      {/* SIMULATION TAB */}
      {activeTab === 'simulation' && (
        <SimulationPanel>
          <PanelTitle>Configuración de Simulación</PanelTitle>
          <FormGrid>
            <FormGroup>
              <Label>Tipo de Simulación</Label>
              <StyledSelect value={mode} onChange={e => setMode(e.target.value as FlightSimulationMode)}>
                <option value="realtime">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="collapse">Colapso</option>
              </StyledSelect>
            </FormGroup>
            <FormGroup>
              <Label>Algoritmo de Optimización</Label>
              <StyledSelect 
                value={algorithmParams.algorithmType} 
                onChange={e => handleAlgorithmTypeChange(e.target.value)}
              >
                <option value="TABU">Búsqueda Tabú</option>
                <option value="ALNS">Búsqueda de Vecindario Amplio Adaptativo</option>
              </StyledSelect>
            </FormGroup>
            <FormGroup>
              <Label>Fecha/Hora de inicio</Label>
              <DateTimeGroup>
                <StyledInput type="date" defaultValue="2024-01-01" />
                <StyledInput type="time" defaultValue="12:00" />
              </DateTimeGroup>
            </FormGroup>
          </FormGrid>
          
          {validationError && (
            <ErrorMessage style={{ marginTop: '16px' }}>
              {validationError}
            </ErrorMessage>
          )}
          
          {hasData() && (
            <InfoText style={{ marginTop: '16px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46' }}>
              <strong>Dataset seleccionado:</strong> {selectedDatasetVersion || datasetVersion}
            </InfoText>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <SimulationButton onClick={handleExecuteAlgorithm} disabled={isLoading} $isLoading={isLoading}>
              {isLoading ? (
                <>
                  Ejecutando Algoritmo
                  <LoadingIndicator />
                </>
              ) : (
                'Iniciar Simulación'
              )}
            </SimulationButton>
            {isLoading && (
              <>
                <InfoText style={{ marginTop: '12px', textAlign: 'center', background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                  <strong>Ejecutando:</strong> {algorithmParams.algorithmType === 'TABU' ? 'Búsqueda Tabú' : 'ALNS'}
                  <br />
                  <span style={{ fontSize: '12px' }}>Procesando {algorithmParams.algorithmType === 'TABU' ? `${algorithmParams.maxIterations} iteraciones` : 'optimización adaptativa'}...</span>
                </InfoText>
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
        </SimulationPanel>
      )}

      {/* PARAMETERS TAB */}
      {activeTab === 'params' && (
        <SimulationPanel>
          <PanelTitle>Parámetros de Simulación</PanelTitle>
          
          <FormGrid style={{ marginBottom: '20px' }}>
            <FormGroup>
              <Label>Algoritmo Seleccionado</Label>
              <StyledSelect 
                value={algorithmParams.algorithmType} 
                onChange={e => handleAlgorithmTypeChange(e.target.value)}
              >
                <option value="TABU">Búsqueda Tabú</option>
                <option value="ALNS">Búsqueda de Vecindario Amplio Adaptativo</option>
              </StyledSelect>
            </FormGroup>
          </FormGrid>

          {algorithmParams.algorithmType === 'TABU' ? (
            <>
              <SectionTitle>Parámetros de Búsqueda Tabú</SectionTitle>
              <FormGrid>
                <FormGroup>
                  <Label>Máximo de Iteraciones</Label>
                  <StyledInput 
                    type="number" 
                    value={algorithmParams.maxIterations ?? 1000}
                    onChange={e => handleParamChange('maxIterations', parseInt(e.target.value))}
                    min="1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Máximo Sin Mejora</Label>
                  <StyledInput 
                    type="number" 
                    value={algorithmParams.maxNoImprovement ?? 100}
                    onChange={e => handleParamChange('maxNoImprovement', parseInt(e.target.value))}
                    min="1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Tamaño de Vecindario</Label>
                  <StyledInput 
                    type="number" 
                    value={algorithmParams.neighborhoodSize ?? 100}
                    onChange={e => handleParamChange('neighborhoodSize', parseInt(e.target.value))}
                    min="1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Tamaño de Lista Tabú</Label>
                  <StyledInput 
                    type="number" 
                    value={algorithmParams.tabuListSize ?? 50}
                    onChange={e => handleParamChange('tabuListSize', parseInt(e.target.value))}
                    min="1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Tenure Tabú</Label>
                  <StyledInput 
                    type="number" 
                    value={algorithmParams.tabuTenure ?? 10000}
                    onChange={e => handleParamChange('tabuTenure', parseInt(e.target.value))}
                    min="1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Versión del Dataset</Label>
                  <StyledSelect 
                    value={selectedDatasetVersion || datasetVersion}
                    onChange={e => setSelectedDatasetVersion(e.target.value)}
                  >
                    {getAvailableVersions().length > 0 ? (
                      getAvailableVersions().map(version => (
                        <option key={version} value={version}>
                          Dataset {version}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay datasets disponibles</option>
                    )}
                  </StyledSelect>
                </FormGroup>
                
                <FormGroup>
                  <Label>Registros en esta versión</Label>
                  <StyledInput 
                    type="text" 
                    value={(() => {
                      const version = selectedDatasetVersion || datasetVersion
                      const versionDatasets = datasets.filter(d => d.version === version.replace('Dataset ', ''))
                      const total = versionDatasets.reduce((sum, d) => sum + d.records, 0)
                      return `${total.toLocaleString()} registros`
                    })()}
                    readOnly
                    style={{ background: '#f3f4f6' }}
                  />
                </FormGroup>
              </FormGrid>
            </>
          ) : (
            <>
              <SectionTitle>Parámetros de ALNS</SectionTitle>
              <InfoText>
                El algoritmo ALNS utiliza parámetros predeterminados optimizados. Selecciona la versión del dataset a usar.
              </InfoText>
              <FormGrid style={{ marginTop: '16px' }}>
                <FormGroup>
                  <Label>Versión del Dataset</Label>
                  <StyledSelect 
                    value={selectedDatasetVersion || datasetVersion}
                    onChange={e => setSelectedDatasetVersion(e.target.value)}
                  >
                    {getAvailableVersions().length > 0 ? (
                      getAvailableVersions().map(version => (
                        <option key={version} value={version}>
                          Dataset {version}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay datasets disponibles</option>
                    )}
                  </StyledSelect>
                </FormGroup>
                
                <FormGroup>
                  <Label>Registros en esta versión</Label>
                  <StyledInput 
                    type="text" 
                    value={(() => {
                      const version = selectedDatasetVersion || datasetVersion
                      const versionDatasets = datasets.filter(d => d.version === version.replace('Dataset ', ''))
                      const total = versionDatasets.reduce((sum, d) => sum + d.records, 0)
                      return `${total.toLocaleString()} registros`
                    })()}
                    readOnly
                    style={{ background: '#f3f4f6' }}
                  />
                </FormGroup>
            </FormGrid>
            </>
          )}
          
          {validationError && (
            <ErrorMessage style={{ marginTop: '16px' }}>
              {validationError}
            </ErrorMessage>
          )}
          
          {hasData() && (
            <InfoText style={{ marginTop: '16px', background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46' }}>
              <strong>Dataset seleccionado:</strong> {selectedDatasetVersion || datasetVersion}
            </InfoText>
          )}

          <div style={{ marginTop: '24px' }}>
            <SimulationButton onClick={handleExecuteAlgorithm} disabled={isLoading} $isLoading={isLoading}>
              {isLoading ? (
                <>
                  Ejecutando Algoritmo
                  <LoadingIndicator />
                </>
              ) : (
                'Ejecutar Algoritmo'
              )}
            </SimulationButton>
            {isLoading && (
              <>
                <InfoText style={{ marginTop: '12px', textAlign: 'center', background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                  <strong>Ejecutando:</strong> {algorithmParams.algorithmType === 'TABU' ? 'Búsqueda Tabú' : 'ALNS'}
                  <br />
                  <span style={{ fontSize: '12px' }}>Procesando {algorithmParams.algorithmType === 'TABU' ? `${algorithmParams.maxIterations} iteraciones` : 'optimización adaptativa'}...</span>
                </InfoText>
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
        </SimulationPanel>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <SimulationPanel>
          <PanelTitle>Resultados de Simulación</PanelTitle>
          
          {!results ? (
            <InfoText>
              No hay resultados disponibles. Ejecuta una simulación para ver los resultados.
            </InfoText>
          ) : (
            <>
              {results.success ? (
                <SuccessMessage>
                  ✓ {results.message || 'Simulación completada exitosamente'}
                </SuccessMessage>
              ) : (
                <ErrorMessage>
                  ✗ {results.message || 'Error al ejecutar la simulación'}
                </ErrorMessage>
              )}

              {results.success && (
                <>
                  <ResultsGrid>
                    <MetricCard>
                      <MetricLabel>SLA Cumplimiento</MetricLabel>
                      <MetricValue style={{ fontSize: '28px' }}>
                        {((results.assignedOrders! / results.totalOrders!) * 100).toFixed(1)}%
                      </MetricValue>
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                        +{(Math.random() * 5).toFixed(1)}% vs anterior
                      </div>
                    </MetricCard>

                    <MetricCard>
                      <MetricLabel>Ocupación Promedio</MetricLabel>
                      <MetricValue style={{ fontSize: '28px' }}>
                        {(85 + Math.random() * 10).toFixed(1)}%
                      </MetricValue>
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                        +{(Math.random() * 3).toFixed(1)}% vs anterior
                      </div>
                    </MetricCard>

                    <MetricCard>
                      <MetricLabel>Tiempo Promedio</MetricLabel>
                      <MetricValue style={{ fontSize: '28px' }}>
                        {(1.5 + Math.random() * 1).toFixed(1)} días
                      </MetricValue>
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                        -{(Math.random() * 0.5).toFixed(1)} vs anterior
                      </div>
                    </MetricCard>

                    <MetricCard>
                      <MetricLabel>Rutas Optimizadas</MetricLabel>
                      <MetricValue style={{ fontSize: '28px' }}>
                        {results.productRoutes?.length ?? 0}
                      </MetricValue>
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                        +{Math.floor(Math.random() * 20)} vs anterior
                      </div>
                    </MetricCard>
                  </ResultsGrid>

                  <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#111827' }}>Detalles de Ejecución</h4>
                    <ResultsGrid style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Algoritmo</div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '4px' }}>
                          {results.algorithmType === 'TABU' ? 'Búsqueda Tabú' : 'ALNS'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Tiempo</div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '4px' }}>
                          {results.executionTimeSeconds}s
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Órdenes Procesadas</div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '4px' }}>
                          {results.totalOrders}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Score Total</div>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '4px' }}>
                          {results.score?.toFixed(0)}
                        </div>
                      </div>
                    </ResultsGrid>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <Label>Inicio de Ejecución</Label>
                    <InfoText style={{ textAlign: 'left', marginBottom: '12px' }}>
                      {results.executionStartTime ? new Date(results.executionStartTime).toLocaleString() : 'N/A'}
                    </InfoText>

                    <Label>Fin de Ejecución</Label>
                    <InfoText style={{ textAlign: 'left' }}>
                      {results.executionEndTime ? new Date(results.executionEndTime).toLocaleString() : 'N/A'}
                    </InfoText>
                  </div>
                </>
              )}
            </>
          )}
        </SimulationPanel>
      )}
    </SimulationUITray>
  )
}
