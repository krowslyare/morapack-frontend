import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../../store/useSimulationStore'
import { simulationService } from '../../api/simulationService'
import {
  uploadOrdersByDateRange,
  clearOrders,
  type ImportResultData,
} from '../../api'
import { toast } from 'react-toastify'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

const ModeToggle = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? '#14b8a6' : '#e5e7eb')};
  background: ${(p) => (p.$active ? '#d1fae5' : 'white')};
  color: ${(p) => (p.$active ? '#065f46' : '#4b5563')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #10b981;
  }
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
  border-radius: 16px;
  padding: 28px 32px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 480px;      /* antes 420px */
  width: 95%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #111827;
  font-weight: 700;
`

const CalendarShell = styled.div`
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: radial-gradient(circle at top left, #f0f9ff 0, #f9fafb 40%, #ffffff 100%);
  padding: 14px 14px 10px;
  margin-bottom: 16px;
`

const DatePickerContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 24px;
`

const DayButton = styled.button<{
  $isSelected?: boolean
  $isToday?: boolean
  $isOtherMonth?: boolean
}>`
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid
    ${(p) => {
    if (p.$isSelected) return '#14b8a6'
    if (p.$isToday) return '#38bdf8'
    if (p.$isOtherMonth) return 'transparent'
    return '#e5e7eb'
  }};
  background: ${(p) => {
    if (p.$isSelected) return 'linear-gradient(135deg, #14b8a6, #0ea5e9)'
    if (p.$isToday) return '#e0f2fe'
    if (p.$isOtherMonth) return 'transparent'
    return '#ffffff'
  }};
  color: ${(p) => {
    if (p.$isSelected) return '#ffffff'
    if (p.$isOtherMonth) return '#d1d5db'
    return '#111827'
  }};
  font-weight: ${(p) => (p.$isSelected || p.$isToday ? 700 : 500)};
  cursor: ${(p) => (p.$isOtherMonth ? 'default' : 'pointer')};
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s ease-out;

  &:hover {
    ${(p) =>
    !p.$isOtherMonth &&
    `
      border-color: #14b8a6;
      box-shadow: 0 0 0 1px rgba(20, 184, 166, 0.25);
      transform: translateY(-1px);
    `}
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.7);
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
`;

const MonthButton = styled.button`
  flex: 0 0 auto;
  min-width: 120px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #374151;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #f3f4f6;
    border-color: #14b8a6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MonthTitle = styled.div`
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  text-transform: capitalize;
`;

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

const ProgressSection = styled.div`
  margin-top: 8px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
`

const ProgressTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`

const ProgressSubtitle = styled.div`
  font-size: 12px;
  color: #6b7280;
`

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 16px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.12);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.45) 0,
      transparent 40%,
      transparent 60%,
      rgba(255, 255, 255, 0.45) 100%
    );
    background-size: 40px 40px;
    opacity: 0.4;
    pointer-events: none;
  }
`

const ProgressBarFill = styled.div<{ $percent: number; $isLoading?: boolean }>`
  height: 100%;
  border-radius: inherit;
  width: ${({ $percent }) => `${$percent}%`};
  background: linear-gradient(90deg, #22c55e, #14b8a6, #0ea5e9);
  transition: width 0.45s ease-out;
  position: relative;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05);

  ${({ $isLoading }) =>
    $isLoading &&
    `
    animation: progressShimmer 1.1s linear infinite;
  `}

  @keyframes progressShimmer {
    0% { filter: brightness(0.96); }
    50% { filter: brightness(1.1); }
    100% { filter: brightness(0.96); }
  }
`

const ProgressStatusChip = styled.div<{ $status: 'loading' | 'done' | 'idle' }>`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  ${({ $status }) => {
    if ($status === 'loading') {
      return `
        background: #fef9c3;
        color: #854d0e;
        border: 1px solid #facc15;
      `
    }
    if ($status === 'done') {
      return `
        background: #dcfce7;
        color: #166534;
        border: 1px solid #22c55e;
      `
    }
    return `
      background: #e5e7eb;
      color: #4b5563;
      border: 1px solid #d1d5db;
    `
  }}
`

const ProgressStatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
`

const ProgressStat = styled.div`
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

const ProgressValue = styled.span`
  font-weight: 600;
  color: #111827;
`

interface OrdersImportState {
  loading: boolean
  result: ImportResultData | null
}

export function PlanificacionPage() {
  const navigate = useNavigate()
  const {
    simulationStartDate,
    setSimulationStartDate,
    hasValidConfig,
    clearSimulationConfig,
    simulationMode,
    setSimulationMode,
    isDailyMode,
  } = useSimulationStore()

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

  const totalOrders = ordersState.result?.statistics?.ordersLoaded ?? 0;
  const totalProducts = ordersState.result?.statistics?.ordersFiltered ?? 0;
  const loadedItems = totalOrders + totalProducts;

  const [showResetModal, setShowResetModal] = useState(false)
  // Ajusta este valor según tu realidad de negocio:
  // cuántos registros (pedidos + productos) consideras como "base llena" por semana.
  const [displayPercent, setDisplayPercent] = useState(0)

  const MAX_ITEMS_PER_WEEK = 5000
  const capacityTarget = weeks * MAX_ITEMS_PER_WEEK

  const realPercent =
    capacityTarget > 0 ? Math.round((loadedItems / capacityTarget) * 100) : 0
  const clampedRealPercent = Math.max(0, Math.min(100, realPercent))

  useEffect(() => {
    // Mientras está cargando, animamos poco a poco hasta un máximo (ej. 90%)
    if (ordersState.loading) {
      const maxWhileLoading =
        clampedRealPercent > 0
          ? Math.min(90, clampedRealPercent)
          : 90 // si aún no hay datos, avanza hasta 90%

      const interval = setInterval(() => {
        setDisplayPercent(prev => {
          if (prev >= maxWhileLoading) {
            return prev
          }
          return prev + 2 // velocidad de avance (2% cada tick)
        })
      }, 150) // frecuencia de actualización (ms)

      return () => clearInterval(interval)
    }

    // Cuando termina (éxito o error), fijamos el porcentaje real
    setDisplayPercent(clampedRealPercent)
  }, [ordersState.loading, clampedRealPercent])

  const rawPercent =
    capacityTarget > 0 ? Math.round((loadedItems / capacityTarget) * 100) : 0
  const fillPercent = Math.max(0, Math.min(100, rawPercent))

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
      // ahora la selección depende de pickerDate (lo que vas tocando)
      const isSelected = day === pickerDate.getDate()

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
      setSimulationMode(simulationMode)

      if (isDailyMode()) {
        setOrdersState({ loading: false, result: null })
        toast.success('Fecha configurada para simulación diaria. Dirigiéndote a la vista en tiempo real.')
        navigate('/simulacion/diaria')
        return
      }

      // ✅ 2) Calcular rango de fechas en UTC (igual que Python)
      const startDate = new Date(Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        0, 0, 0, 0
      ))


      const endDate = new Date(
        startDate.getTime() + (weeks * 7 - 1) * 24 * 60 * 60 * 1000
      )

      // poner fin de día en UTC
      endDate.setUTCHours(23, 59, 59, 0)

      const formatISO = (date: Date) => {
        const y = date.getUTCFullYear()
        const m = String(date.getUTCMonth() + 1).padStart(2, '0')
        const d = String(date.getUTCDate()).padStart(2, '0')
        const h = String(date.getUTCHours()).padStart(2, '0')
        const min = String(date.getUTCMinutes()).padStart(2, '0')
        const s = String(date.getUTCSeconds()).padStart(2, '0')
        return `${y}-${m}-${d}T${h}:${min}:${s}`
      }

      const startStr = formatISO(startDate)  // "2025-01-02T00:00:00"
      const endStr = formatISO(endDate)      // "2025-01-09T00:00:00"

      console.group('📦 Cargando órdenes')
      console.log('Start:', startStr)
      console.log('End:', endStr)
      console.log('Weeks:', weeks)

      // 3) Llamar backend para cargar pedidos en ese rango
      const result = await uploadOrdersByDateRange(startStr, endStr)
      console.log('Resultado de la API:', result);
      setOrdersState({ loading: false, result })

      console.log('✅ Result:', result)
      console.groupEnd()

      const expectedItems =
        (result.orders ?? 0) + (result.products ?? 0)

      if (result.success) {
        toast.success(
          `Fecha configurada y pedidos cargados (${result.statistics?.ordersLoaded ?? 0} pedidos, ${result.statistics?.ordersFiltered ?? 0
          } productos)`
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

  const doResetData = () => {
    try {
      setIsLoadingReset(true)

      // solo limpio UI/local state
      setSelectedDateTime('')                // input de fecha/hora
      setWeeks(1)                            // combo semanas
      setOrdersState({ loading: false, result: null }) // quita mensaje y progreso real
      setError(null)                         // errores
      setDisplayPercent(0)                   // barra de progreso a 0
      // OJO: NO llamamos clearOrders ni clearSimulationConfig

      toast.info('Se limpió la configuración de la pantalla (la base de datos no se modificó)')
    } finally {
      setIsLoadingReset(false)
      setShowResetModal(false)
    }
  }

  const handleGoToSimulation = () => {
    if (!hasValidConfig()) {
      toast.error('Debes configurar una fecha primero')
      return
    }
    navigate('/simulacion/diaria')
  }

  const handleGoToWeeklySimulation = () => {
    if (!hasValidConfig()) {
      toast.error('Debes configurar una fecha primero')
      return
    }
    navigate('/simulacion/semanal')
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
            Configura la fecha inicial y prepara los datos para la simulación semanal o diaria.
          </Subtitle>
          <ModeToggle>
            <ModeButton
              type="button"
              $active={simulationMode === 'weekly'}
              onClick={() => setSimulationMode('weekly')}
            >
              Planificación Semanal
            </ModeButton>
            <ModeButton
              type="button"
              $active={simulationMode === 'daily'}
              onClick={() => setSimulationMode('daily')}
            >
              Simulación Diaria
            </ModeButton>
          </ModeToggle>
        </div>

        {error && (
          <InfoBox $variant="error">
            <strong>Error:</strong> {error}
          </InfoBox>
        )}

        {simulationMode === 'weekly' && (ordersState.loading || ordersState.result) && (
          <ProgressSection>
            <ProgressHeader>
              <div>
                <ProgressTitle>Llenado de datos en la base</ProgressTitle>
                <ProgressSubtitle>
                  Objetivo estimado: {capacityTarget.toLocaleString('es-PE')} registros
                  (pedidos + productos)
                </ProgressSubtitle>
              </div>

              <ProgressStatusChip
                $status={
                  ordersState.loading
                    ? 'loading'
                    : ordersState.result
                      ? 'done'
                      : 'idle'
                }
              >
                {ordersState.loading && <>● Cargando…</>}
                {!ordersState.loading && ordersState.result && <>✓ Completado</>}
                {!ordersState.loading && !ordersState.result && <>– En espera</>}
              </ProgressStatusChip>
            </ProgressHeader>

            <ProgressBarContainer>
              <ProgressBarFill
                $percent={displayPercent}
                $isLoading={ordersState.loading}
              />
            </ProgressBarContainer>

            <ProgressStatsRow>
              <ProgressStat>
                Pedidos: <ProgressValue>{totalOrders}</ProgressValue>
              </ProgressStat>
              <ProgressStat>
                Productos: <ProgressValue>{totalProducts}</ProgressValue>
              </ProgressStat>
              <ProgressStat>
                Registros totales:{' '}
                <ProgressValue>{loadedItems.toLocaleString('es-PE')}</ProgressValue>
              </ProgressStat>
              <ProgressStat>
                Avance:{' '}
                <ProgressValue>{fillPercent}%</ProgressValue>
              </ProgressStat>
            </ProgressStatsRow>
          </ProgressSection>
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

          {simulationMode === 'weekly' && (
            <>
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
                5. Ve a &quot;Simulación Diaria&quot; o &quot;Simulación Semanal&quot; para iniciar la simulación
              </InfoBox>
            </>
          )}

          {simulationMode === 'daily' && (
            <InfoBox $variant="info">
              <strong>⚡ Modo diario:</strong>
              <br />
              1. Selecciona la fecha y hora inicial de la operación.
              <br />
              2. Presiona &quot;Confirmar&quot;; iremos directo a la Simulación Diaria.
              <br />
              3. Las ordenes se asignarán en ventanas cortas (5-30 min) y se recalcularán cuando se
              registren nuevos pedidos.
            </InfoBox>
          )}
        </FormSection>



        <ButtonGroup>
          <Button
            onClick={handleConfirmDate}
            disabled={!selectedDateTime || isLoadingReset || isLoadingConfig}
            $isLoading={isLoadingConfig}
          >
            {isLoadingConfig && <LoadingSpinner />}
            {isLoadingConfig ? 'Configurando y cargando...' : 'Confirmar'}
          </Button>

          <Button
            $variant="secondary"
            onClick={() => setShowResetModal(true)}
            disabled={isLoadingConfig}
          >
            Resetear datos
          </Button>

          <Button
            $variant="success"
            onClick={handleGoToSimulation}
            disabled={!hasValidConfig() || isLoadingConfig || isLoadingReset}
          >
            Sim.Diaria →
          </Button>

          <Button
            $variant="success"
            onClick={handleGoToWeeklySimulation}
            disabled={!hasValidConfig() || isLoadingConfig || isLoadingReset}
          >
            Sim.Semanal →
          </Button>
        </ButtonGroup>



        {!hasValidConfig() && (
          <InfoBox $variant="warning">
            <strong>⚠️ No hay configuración:</strong> Debes configurar una fecha antes de iniciar la
            simulación.
          </InfoBox>
        )}
      </ContentPanel>

      <ModalOverlay $isOpen={showResetModal} onClick={() => setShowResetModal(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalTitle>Resetear planificación</ModalTitle>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 20 }}>
            Esto solo limpiará los campos de la pantalla y el progreso visual,
            pero no borrará los pedidos ni la configuración guardada en la base de datos.
          </p>
          <ModalButtonGroup>
            <ModalButton $variant="secondary" onClick={() => setShowResetModal(false)}>
              Cancelar
            </ModalButton>
            <ModalButton onClick={doResetData} disabled={isLoadingReset}>
              {isLoadingReset ? 'Reseteando…' : 'Sí, resetear'}
            </ModalButton>
          </ModalButtonGroup>
        </ModalContent>
      </ModalOverlay>

      <ModalOverlay $isOpen={showDatePicker} onClick={() => setShowDatePicker(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>Selecciona una fecha y hora</ModalTitle>

          <CalendarShell>
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
          </CalendarShell>


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
