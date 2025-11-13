import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../../store/useSimulationStore'
import { simulationService } from '../../api/simulationService'
import { toast } from 'react-toastify'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 32px;
  font-weight: 700;
`

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 15px;
`

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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

const DateTimeInput = styled.input`
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: all 0.2s;
  font-family: inherit;

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

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
`

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' | 'success'; $isLoading?: boolean }>`
  background: ${(p) => {
    if (p.$isLoading) return '#f59e0b'
    if (p.$variant === 'danger') return '#dc2626'
    if (p.$variant === 'secondary') return '#6b7280'
    if (p.$variant === 'success') return '#10b981'
    return '#14b8a6'
  }};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 28px;
  cursor: ${(p) => (p.$isLoading || p.disabled ? 'not-allowed' : 'pointer')};
  font-weight: 700;
  font-size: 15px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
  }

  &:disabled {
    background: #9ca3af;
    transform: none;
  }
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

const CurrentConfigBox = styled.div`
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border: 2px solid #5eead4;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ConfigItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #115e59;
`

const ConfigLabel = styled.span`
  font-weight: 600;
  min-width: 180px;
`

const ConfigValue = styled.span`
  font-weight: 700;
  color: #0f766e;
  font-family: 'Courier New', monospace;
`

export function PlanificacionPage() {
  const navigate = useNavigate()
  const { simulationStartDate, setSimulationStartDate, hasValidConfig, clearSimulationConfig } = useSimulationStore()

  // Local state for form
  const [selectedDateTime, setSelectedDateTime] = useState<string>('')
  const [isLoadingReset, setIsLoadingReset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmDate = () => {
    setError(null)

    if (!selectedDateTime) {
      setError('Por favor selecciona una fecha y hora')
      return
    }

    const parsedDate = new Date(selectedDateTime)
    if (isNaN(parsedDate.getTime())) {
      setError('Fecha inválida')
      return
    }

    setSimulationStartDate(parsedDate)
    toast.success('Fecha de simulación configurada correctamente')
  }

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas resetear la base de datos de órdenes? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    setIsLoadingReset(true)
    setError(null)

    try {
      // Try to reset or clear simulation state
      clearSimulationConfig()

      // Try to call reset endpoint
      try {
        await simulationService.resetDatabase()
        toast.success('Base de datos reseteada correctamente')
      } catch (err) {
        // If no reset endpoint, just clear the config
        console.warn('Reset endpoint not available, only clearing local config')
        toast.info('Configuración local limpiada. Nota: No hay endpoint de reset en el backend.')
      }

      setSelectedDateTime('')
    } catch (err: any) {
      console.error('Error resetting database:', err)
      setError(err.message || 'Error al resetear la base de datos')
      toast.error('Error al resetear la base de datos')
    } finally {
      setIsLoadingReset(false)
    }
  }

  const handleGoToSimulation = () => {
    if (!hasValidConfig()) {
      toast.error('Debes configurar una fecha primero')
      return
    }
    navigate('/simulacion/diaria')
  }

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'No configurada'
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  return (
    <Wrapper>
      <ContentPanel>
        <div>
          <Title>Planificación de Simulación</Title>
          <Subtitle>
            Configura la fecha y hora inicial de la simulación diaria
          </Subtitle>
        </div>

        {error && (
          <InfoBox $variant="error">
            <strong>Error:</strong> {error}
          </InfoBox>
        )}

        {hasValidConfig() && (
          <CurrentConfigBox>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f766e', marginBottom: '4px' }}>
              ✓ Configuración Actual
            </div>
            <ConfigItem>
              <ConfigLabel>Fecha de Inicio:</ConfigLabel>
              <ConfigValue>{formatDate(simulationStartDate)}</ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Estado:</ConfigLabel>
              <ConfigValue>Configurado y listo</ConfigValue>
            </ConfigItem>
          </CurrentConfigBox>
        )}

        <FormSection>
          <FormGroup>
            <Label htmlFor="simulation-date">
              Fecha y Hora de Inicio de la Simulación
            </Label>
            <DateTimeInput
              id="simulation-date"
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
              disabled={isLoadingReset}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Esta será la hora cero (T0) de tu simulación diaria
            </span>
          </FormGroup>

          <InfoBox $variant="info">
            <strong>ℹ️ Instrucciones:</strong>
            <br />
            1. Selecciona la fecha y hora inicial para tu simulación
            <br />
            2. Haz clic en "Confirmar Fecha" para guardar la configuración
            <br />
            3. Opcionalmente, puedes resetear la base de datos de órdenes
            <br />
            4. Ve a "Simulación Diaria" para iniciar la simulación
          </InfoBox>
        </FormSection>

        <ButtonGroup>
          <Button onClick={handleConfirmDate} disabled={!selectedDateTime || isLoadingReset}>
            Confirmar Fecha
          </Button>

          <Button $variant="danger" onClick={handleResetDatabase} $isLoading={isLoadingReset} disabled={isLoadingReset}>
            {isLoadingReset ? 'Reseteando...' : 'Resetear Base de Datos'}
          </Button>

          <Button $variant="success" onClick={handleGoToSimulation} disabled={!hasValidConfig()}>
            Ir a Simulación Diaria →
          </Button>
        </ButtonGroup>

        {!hasValidConfig() && (
          <InfoBox $variant="warning">
            <strong>⚠️ No hay configuración:</strong> Debes configurar una fecha antes de iniciar la simulación.
          </InfoBox>
        )}
      </ContentPanel>
    </Wrapper>
  )
}
