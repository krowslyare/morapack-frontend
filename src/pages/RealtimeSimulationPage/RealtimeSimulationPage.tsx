import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../store/useDataStore'
import { useExecuteALNS } from '../../hooks/api'
import { FlightMonitor } from '../../components/FlightMonitor'

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

const Info = styled.div`
  background: #dbeafe;
  border: 2px solid #93c5fd;
  color: #1e3a8a;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 10px;
`

export function RealtimeSimulationPage() {
  const { setSimulationResults } = useDataStore()
  const executeALNS = useExecuteALNS()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Ejecuta automáticamente al cargar
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const runSimulation = async () => {
      if (isRunning) return
      setIsRunning(true)
      setError(null)

      try {
        console.log('[Realtime] Ejecutando ALNS automático...')
        const result = await executeALNS.mutateAsync()
        setSimulationResults(result)
        console.log('[Realtime] Simulación actualizada:', result)
      } catch (err: any) {
        console.error('[Realtime] Error:', err)
        setError(err.message || 'Error al ejecutar la simulación')
      } finally {
        setIsRunning(false)
      }
    }

    // Ejecutar al inicio
    runSimulation()

    // Repetir cada 5 minutos (ajustable)
    intervalId = setInterval(runSimulation, 5 * 60 * 1000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const { simulationResults } = useDataStore() // 👈 agrega esta línea

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Simulación en Tiempo Real</Title>
          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
            Actualiza automáticamente las rutas optimizadas cada pocos minutos
          </p>
        </div>
        <button
          onClick={() => navigate('/planificacion')}
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </Header>

      {error && (
        <Info style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}>
          ⚠️ {error}
        </Info>
      )}

      <Info>
        🔄 Estado: {isRunning ? 'Ejecutando algoritmo...' : 'Última actualización completada, esperando la siguiente'}
      </Info>

      {/* ✅ ahora sí pasas los resultados al monitor */}
      <FlightMonitor simulationType="day-to-day" simulationResults={simulationResults} />
    </Wrapper>
  )
}