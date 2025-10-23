import { useState } from 'react'
import styled from 'styled-components'
import type { FlightSimulationMode } from '../hooks/useFlightSimulation'

const SimulationUITray = styled.div`
  margin-bottom: 24px;
`

const TabContainer = styled.div`
  display: flex;
`

const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${p => p.$active ? '#14b8a6' : '#d1d5db'};
  border-bottom: ${p => p.$active ? '1px solid white' : '1px solid #d1d5db'};
  background: ${p => p.$active ? 'white' : '#f3f4f6'};
  color: ${p => p.$active ? '#0f766e' : '#6b7280'};
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  margin-right: -1px;
  position: relative;
  bottom: -1px;
  z-index: ${p => p.$active ? 2 : 1};
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
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  align-items: end;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`

const Label = styled.label`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`

const StyledSelect = styled.select`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`

const StyledInput = styled.input`
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
`

const DateTimeGroup = styled.div`
  display: flex;
  gap: 8px;
`

const SimulationButton = styled.button`
  background: #14b8a6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  margin-top: 24px;
`

interface SimulationControlsProps {
  mode: FlightSimulationMode;
  setMode: (mode: FlightSimulationMode) => void;
  // onStartSimulation: () => void; // Placeholder for future logic
}

export function SimulationControls({ mode, setMode }: SimulationControlsProps) {
  const [activeTab, setActiveTab] = useState('simulation')

  return (
    <SimulationUITray>
      <TabContainer>
        <Tab $active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')}>Simulación</Tab>
        <Tab $active={activeTab === 'params'} onClick={() => setActiveTab('params')}>Parámetros</Tab>
        <Tab $active={activeTab === 'results'} onClick={() => setActiveTab('results')}>Resultados</Tab>
      </TabContainer>
      
      {activeTab === 'simulation' && (
        <SimulationPanel>
          <PanelTitle>Controles de Simulación</PanelTitle>
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
              <Label>Algoritmo</Label>
              <StyledSelect defaultValue="alns">
                <option value="alns">ALNS</option>
                <option value="genetic">Genético</option>
                <option value="tabu">Búsqueda Tabú</option>
              </StyledSelect>
            </FormGroup>
            <FormGroup>
              <Label>Fecha/Hora de inicio</Label>
              <DateTimeGroup>
                <StyledInput type="text" defaultValue="01/01/2000" />
                <StyledInput type="text" defaultValue="12:12:12" />
              </DateTimeGroup>
            </FormGroup>
            <FormGroup>
               <SimulationButton>Iniciar simulación</SimulationButton>
            </FormGroup>
          </FormGrid>
        </SimulationPanel>
      )}
      {activeTab === 'params' && <SimulationPanel><PanelTitle>Parámetros del Algoritmo</PanelTitle></SimulationPanel>}
      {activeTab === 'results' && <SimulationPanel><PanelTitle>Resultados de Simulación</PanelTitle></SimulationPanel>}
    </SimulationUITray>
  )
}
