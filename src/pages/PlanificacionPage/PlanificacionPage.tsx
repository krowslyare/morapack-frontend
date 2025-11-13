import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../../store/useSimulationStore'
import { simulationService } from '../../api/simulationService'
import { uploadOrdersByDateRange, type ImportResultData } from '../../api'
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

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  background: white;
  color: #111827;
  transition: all 0.2s;
  font-family: inherit;
  max-width: 200px;

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

const Button = styled.button<{
  $variant?: 'primary' | 'danger' | 'secondary' | 'success'
  $isLoading?: boolean
}>`
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

interface OrdersImportState {
  loading: boolean
  result: ImportResultData | null
}

export function PlanificacionPage() {
  const navigate = useNavigate()
  const { simulationStartDate, setSimulationStartDate, hasValidConfig, clearSimulationConfig } =
    useSimulationStore()

  const [selectedDateTime, setSelectedDateTime] = useState<string>('')
  const [weeks, setWeeks] = useState<number>(1)
  const [isLoadingReset, setIsLoadingReset] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ordersState, setOrdersState] = useState<OrdersImportState>({
    loading: false,
    result: null,
  })

  const formatToYYYYMMDD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }

  const handleConfirmDate = async () => {
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

    try {
      setIsLoadingConfig(true)
      setOrdersState({ loading: true, result: null })

      // 1) Guardar fecha en el store para la simulación
      setSimulationStartDate(parsedDate)

      // 2) Calcular rango de fechas para pedidos (start → start + semanas*7 - 1 días)
      const startDate = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
      )
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + weeks * 7 - 1)

      const startStr = formatToYYYYMMDD(startDate)
      const endStr = formatToYYYYMMDD(endDate)

      // 3) Llamar backend para cargar pedidos en ese rango
      const result = await uploadOrdersByDateRange(startStr, endStr)
      setOrdersState({ loading: false, result })

      if (result.success) {
        toast.success(
          `Fecha configurada y pedidos cargados (${result.orders ?? 0} pedidos, ${
            result.products ?? 0
          } productos)`,
        )
      } else {
        toast.error(result.message || 'Error al cargar pedidos')
      }
    } catch (err: any) {
      console.error('Error al configurar fecha/cargar pedidos:', err)
      setError(err.message || 'Error al configurar la planificación')
      setOrdersState((prev) => ({
        ...prev,
        loading: false,
      }))
      toast.error('Error al configurar la planificación')
    } finally {
      setIsLoadingConfig(false)
    }
  }

  // Limpia solo la configuración/local (no BD)
  const handleResetData = () => {
    clearSimulationConfig()          // borra config global de simulación
    setSelectedDateTime('')          // limpia input
    setWeeks(1)                      // vuelve a 1 semana
    setOrdersState({ loading: false, result: null }) // quita mensaje de carga
    setError(null)                   // limpia errores
    toast.info('Datos de planificación limpiados')
  }

  const handleGoToSimulation = () => {
    if (!hasValidConfig()) {
      toast.error('Debes configurar una fecha primero')
      return
    }
    navigate('/simulacion/diaria')
  }

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
            Configura la fecha inicial y el rango de semanas que se usará para cargar los pedidos
          </Subtitle>
        </div>

        {error && (
          <InfoBox $variant="error">
            <strong>Error:</strong> {error}
          </InfoBox>
        )}

        {hasValidConfig() && (
          <CurrentConfigBox>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f766e',
                marginBottom: '4px',
              }}
            >
              ✓ Configuración Actual
            </div>
            <ConfigItem>
              <ConfigLabel>Fecha de Inicio:</ConfigLabel>
              <ConfigValue>{formatDate(simulationStartDate)}</ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Semanas de Datos:</ConfigLabel>
              <ConfigValue>{weeks} semana(s)</ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Estado:</ConfigLabel>
              <ConfigValue>Configurado y listo</ConfigValue>
            </ConfigItem>
          </CurrentConfigBox>
        )}

        <FormSection>
          <FormGroup>
            <Label htmlFor="simulation-date">Fecha y Hora de Inicio de la Simulación</Label>
            <DateTimeInput
              id="simulation-date"
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
              disabled={isLoadingReset || isLoadingConfig}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Esta será la hora cero (T0) de tu simulación diaria y la fecha desde la cual se
              cargarán los pedidos.
            </span>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="weeks-select">Semanas</Label>
            <Select
              id="weeks-select"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              disabled={isLoadingReset || isLoadingConfig}
            >
              <option value={1}>1 semana</option>
              <option value={2}>2 semanas</option>
            </Select>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Se cargarán pedidos desde la fecha de inicio hasta la fecha de inicio + (semanas × 7
              días - 1).
            </span>
          </FormGroup>

          <InfoBox $variant="info">
            <strong>ℹ️ Instrucciones:</strong>
            <br />
            1. Selecciona la fecha y hora inicial para tu simulación
            <br />
            2. Elige cuántas semanas de datos quieres cargar (1 o 2)
            <br />
            3. Haz clic en &quot;Confirmar Fecha&quot; para guardar la configuración y cargar los
            pedidos en ese rango
            <br />
            4. Si lo necesitas, usa &quot;Resetear datos&quot; para dejar la pantalla en blanco
            nuevamente
            <br />
            5. Ve a &quot;Simulación Diaria&quot; para iniciar la simulación
          </InfoBox>
        </FormSection>

        <ButtonGroup>
          <Button
            onClick={handleConfirmDate}
            disabled={!selectedDateTime || isLoadingReset || isLoadingConfig}
            $isLoading={isLoadingConfig}
          >
            {isLoadingConfig ? 'Configurando y cargando...' : 'Confirmar Fecha'}
          </Button>

          <Button
            $variant="secondary"
            onClick={handleResetData}
            disabled={isLoadingConfig}
          >
            Resetear datos
          </Button>

          <Button
            $variant="success"
            onClick={handleGoToSimulation}
            disabled={!hasValidConfig() || isLoadingConfig || isLoadingReset}
          >
            Ir a Simulación Diaria →
          </Button>
        </ButtonGroup>

        {ordersState.result && (
          <InfoBox $variant={ordersState.result.success ? 'success' : 'error'}>
            <strong>{ordersState.result.success ? '✓ Carga de pedidos:' : '✗ Error en la carga:'}</strong>{' '}
            {ordersState.result.message}{' '}
            {ordersState.result.orders !== undefined &&
              `(${ordersState.result.orders} pedidos)`}{' '}
            {ordersState.result.products !== undefined &&
              `(${ordersState.result.products} productos)`}
          </InfoBox>
        )}

        {!hasValidConfig() && (
          <InfoBox $variant="warning">
            <strong>⚠️ No hay configuración:</strong> Debes configurar una fecha antes de iniciar la
            simulación.
          </InfoBox>
        )}
      </ContentPanel>
    </Wrapper>
  )
}
