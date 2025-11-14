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

const DatePickerButton = styled.button`
  background: #14b8a6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  margin-top: 2px;
  white-space: nowrap;

  &:hover {
    background: #0d9488;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${(p) => (p.$isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 90%;
`

const ModalTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #111827;
  font-weight: 700;
`

const DatePickerContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 24px;
`

const DayButton = styled.button<{ $isSelected?: boolean; $isToday?: boolean; $isOtherMonth?: boolean }>`
  aspect-ratio: 1;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: ${(p) => {
    if (p.$isSelected) return '#14b8a6';
    if (p.$isToday) return '#e0f2fe';
    if (p.$isOtherMonth) return '#f9fafb';
    return 'white';
  }};
  color: ${(p) => {
    if (p.$isSelected) return 'white';
    if (p.$isOtherMonth) return '#d1d5db';
    return '#111827';
  }};
  font-weight: ${(p) => (p.$isToday ? 700 : 500)};
  cursor: ${(p) => (p.$isOtherMonth ? 'not-allowed' : 'pointer')};
  font-size: 13px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #14b8a6;
    background: ${(p) => (p.$isOtherMonth ? '#f9fafb' : '#f0fdfa')};
  }

  &:disabled {
    cursor: not-allowed;
  }
`

const TimeInputContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
`

const TimeInput = styled.input`
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }
`

const MonthNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const MonthButton = styled.button`
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`

const MonthTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  text-align: center;
`

const WeekdayLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
  text-align: center;
`

const WeekdayLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
`

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`

const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  background: ${(p) => (p.$variant === 'secondary' ? '#f3f4f6' : '#14b8a6')};
  color: ${(p) => (p.$variant === 'secondary' ? '#111827' : 'white')};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
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

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
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
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerDate, setPickerDate] = useState<Date>(new Date())
  const [pickerHour, setPickerHour] = useState<string>('00')
  const [pickerMinute, setPickerMinute] = useState<string>('00')

  const formatToYYYYMMDD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePickerDateSelect = (day: number) => {
    const newDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day)
    setPickerDate(newDate)
  }

  const handlePickerConfirm = () => {
    const hour = String(parseInt(pickerHour) || 0).padStart(2, '0')
    const minute = String(parseInt(pickerMinute) || 0).padStart(2, '0')
    const dateStr = pickerDate.toISOString().split('T')[0]
    const datetimeStr = `${dateStr}T${hour}:${minute}`
    setSelectedDateTime(datetimeStr)
    setShowDatePicker(false)
  }

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + offset, 1)
    setPickerDate(newDate)
  }

  const renderDatePickerDays = () => {
    const daysInMonth = getDaysInMonth(pickerDate)
    const firstDay = getFirstDayOfMonth(pickerDate)
    const days = []

    // Empty cells for days from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <DayButton key={`empty-${i}`} disabled $isOtherMonth>
          -
        </DayButton>,
      )
    }

    // Days of the current month
    const today = new Date()
    const isCurrentMonth =
      pickerDate.getMonth() === today.getMonth() &&
      pickerDate.getFullYear() === today.getFullYear()

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate()
      const isSelected =
        pickerDate.getFullYear() === new Date(selectedDateTime || Date.now()).getFullYear() &&
        pickerDate.getMonth() === new Date(selectedDateTime || Date.now()).getMonth() &&
        day === new Date(selectedDateTime || Date.now()).getDate()

      days.push(
        <DayButton
          key={day}
          $isToday={isToday}
          $isSelected={isSelected}
          onClick={() => handlePickerDateSelect(day)}
        >
          {day}
        </DayButton>,
      )
    }

    return days
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <DateTimeInput
                  id="simulation-date"
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  disabled={isLoadingReset || isLoadingConfig}
                />
              </div>
              <DatePickerButton
                onClick={() => {
                  if (selectedDateTime) {
                    setPickerDate(new Date(selectedDateTime))
                    const parsedDate = new Date(selectedDateTime)
                    setPickerHour(String(parsedDate.getHours()).padStart(2, '0'))
                    setPickerMinute(String(parsedDate.getMinutes()).padStart(2, '0'))
                  }
                  setShowDatePicker(true)
                }}
                disabled={isLoadingReset || isLoadingConfig}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  calendar_month
                </span>
                Seleccionar
              </DatePickerButton>
            </div>
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
            {isLoadingConfig && <LoadingSpinner />}
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

      <ModalOverlay $isOpen={showDatePicker} onClick={() => setShowDatePicker(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>Selecciona una fecha y hora</ModalTitle>

          <MonthNavigation>
            <MonthButton onClick={() => handleMonthChange(-1)}>← Mes anterior</MonthButton>
            <MonthTitle>
              {pickerDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </MonthTitle>
            <MonthButton onClick={() => handleMonthChange(1)}>Mes siguiente →</MonthButton>
          </MonthNavigation>

          <WeekdayLabels>
            <WeekdayLabel>Do</WeekdayLabel>
            <WeekdayLabel>Lu</WeekdayLabel>
            <WeekdayLabel>Ma</WeekdayLabel>
            <WeekdayLabel>Mi</WeekdayLabel>
            <WeekdayLabel>Ju</WeekdayLabel>
            <WeekdayLabel>Vi</WeekdayLabel>
            <WeekdayLabel>Sa</WeekdayLabel>
          </WeekdayLabels>

          <DatePickerContainer>{renderDatePickerDays()}</DatePickerContainer>

          <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6b7280' }}>
            Fecha seleccionada:{' '}
            <strong style={{ color: '#111827' }}>
              {pickerDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </strong>
          </div>

          <Label style={{ marginBottom: '8px' }}>Hora y Minuto</Label>
          <TimeInputContainer>
            <TimeInput
              type="number"
              min="0"
              max="23"
              value={pickerHour}
              onChange={(e) =>
                setPickerHour(
                  String(Math.min(23, Math.max(0, parseInt(e.target.value) || 0))).padStart(
                    2,
                    '0',
                  ),
                )
              }
              placeholder="HH"
            />
            <TimeInput
              type="number"
              min="0"
              max="59"
              value={pickerMinute}
              onChange={(e) =>
                setPickerMinute(
                  String(Math.min(59, Math.max(0, parseInt(e.target.value) || 0))).padStart(
                    2,
                    '0',
                  ),
                )
              }
              placeholder="MM"
            />
          </TimeInputContainer>

          <ModalButtonGroup>
            <ModalButton $variant="secondary" onClick={() => setShowDatePicker(false)}>
              Cancelar
            </ModalButton>
            <ModalButton onClick={handlePickerConfirm}>Confirmar</ModalButton>
          </ModalButtonGroup>
        </ModalContent>
      </ModalOverlay>
    </Wrapper>
  )
}
