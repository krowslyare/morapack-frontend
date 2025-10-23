import { useState } from 'react'
import styled from 'styled-components'
import 'leaflet/dist/leaflet.css'
import { FlightMonitor } from '../../components/FlightMonitor'
import { SimulationControls } from '../../components/SimulationControls'
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
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 24px;
`

export function MonitoringPage() {
  const [mode, setMode] = useState<FlightSimulationMode>('realtime')

  return (
    <Wrapper>
      <ContentPanel>
        <div>
          <Title>Monitoreo y Simulación</Title>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
            Visualización en tiempo real de operaciones y controles para iniciar una simulación.
          </p>
        </div>
        
        <FlightMonitor mode={mode} />
        <SimulationControls mode={mode} setMode={setMode} />

      </ContentPanel>
    </Wrapper>
  )
}



