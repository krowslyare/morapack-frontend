import { useMemo, useState, type ChangeEvent } from 'react'
import styled from 'styled-components'
import { useTemporalSimulation, type TimeUnit } from '../../hooks/useTemporalSimulation'
import { useDataStore } from '../../store/useDataStore'
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

const StatusBadge = styled.span<{ $status: 'running' | 'paused' | 'finished' }>`
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: ${(p) =>
    p.$status === 'running'
      ? '#14b8a6'
      : p.$status === 'finished'
        ? '#f59e0b'
        : '#9ca3af'};
`

const Info = styled.div`
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  color: #0c4a6e;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
`

const ControlsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ControlsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s ease;
  background: ${(p) => (p.$variant === 'primary' ? '#0d9488' : '#e5e7eb')};
  color: ${(p) => (p.$variant === 'primary' ? 'white' : '#374151')};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-1px);
  }
`

const SpeedSelect = styled.select`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #111827;
  background: white;

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
  }
`

const SpeedHint = styled.span`
  font-size: 13px;
  color: #6b7280;
`

const RangeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RangeInput = styled.input`
  width: 100%;
  accent-color: #14b8a6;
`

const TimingRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #4b5563;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`

const MetricCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MetricLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
`

const MetricValue = styled.span`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
`

export function RealtimeSimulationPage() {
  const { simulationResults } = useDataStore()
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('seconds')
  const timeline = simulationResults?.timeline ?? null
  const hasTimeline = Boolean(timeline && timeline.events?.length)

  const speedLegend: Record<TimeUnit, string> = {
    seconds: '1x · 1 seg sim = 1 seg real',
    minutes: '60x · 1 min sim = 1 seg real',
    hours: '3600x · 1 h sim = 1 seg real',
    days: '86400x · 1 día sim = 1 seg real',
  }

  const {
    isPlaying,
    currentSimTime,
    currentSimDateTime,
    totalDurationSeconds,
    activeFlights,
    completedProductsCount,
    flightStats,
    play,
    pause,
    reset,
    seek,
    formatSimulationTime,
    progressPercent,
  } = useTemporalSimulation({
    timeline,
    timeUnit,
    simulationType: 'day-to-day',
  })

  const statusKey: 'running' | 'paused' | 'finished' = useMemo(() => {
    if (!hasTimeline) return 'paused'
    if (isPlaying) return 'running'
    if (totalDurationSeconds > 0 && currentSimTime >= totalDurationSeconds) return 'finished'
    return 'paused'
  }, [hasTimeline, isPlaying, currentSimTime, totalDurationSeconds])

  const statusLabel =
    statusKey === 'running' ? 'En curso' : statusKey === 'finished' ? 'Finalizada' : 'Pausada'

  const formattedCurrentTime = useMemo(
    () => formatSimulationTime(currentSimTime),
    [currentSimTime, formatSimulationTime],
  )

  const formattedTotalTime = useMemo(
    () => (totalDurationSeconds > 0 ? formatSimulationTime(totalDurationSeconds) : '—'),
    [totalDurationSeconds, formatSimulationTime],
  )

  const formattedSimDateTime = useMemo(() => {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(currentSimDateTime)
  }, [currentSimDateTime])

  const timelineWindow = useMemo(() => {
    if (!timeline) return null
    const start = new Date(timeline.simulationStartTime)
    const end = new Date(timeline.simulationEndTime)
    const formatter = new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    return `${formatter.format(start)} → ${formatter.format(end)}`
  }, [timeline])

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    seek(Number(event.target.value))
  }

  const handleTimeUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTimeUnit(event.target.value as TimeUnit)
  }

  const controlsDisabled = !hasTimeline

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Simulación en Tiempo Real</Title>
          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
            Reproduce el timeline generado por el backend y observa cada vuelo en vivo.
          </p>
        </div>
        <StatusBadge $status={statusKey}>{statusLabel}</StatusBadge>
      </Header>

      {!hasTimeline && (
        <Info>
          Ejecuta una simulación desde «Monitoreo y Simulación» para obtener el timeline completo.
          Mientras tanto, puedes explorar el mapa con datos de demostración.
        </Info>
      )}

      {timelineWindow && <Info>Ventana simulada: {timelineWindow}</Info>}

      <ControlsCard>
        <ControlsRow>
          <ButtonGroup>
            <ControlButton
              $variant="primary"
              onClick={isPlaying ? pause : play}
              disabled={controlsDisabled}
            >
              {isPlaying ? 'Pausar' : 'Iniciar'}
            </ControlButton>
            <ControlButton onClick={reset} disabled={controlsDisabled}>
              Reiniciar
            </ControlButton>
          </ButtonGroup>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SpeedSelect value={timeUnit} onChange={handleTimeUnitChange} disabled={controlsDisabled}>
              <option value="seconds">1x · Segundos</option>
              <option value="minutes">60x · Minutos</option>
              <option value="hours">3600x · Horas</option>
              <option value="days">86400x · Días</option>
            </SpeedSelect>
            <SpeedHint>{speedLegend[timeUnit]}</SpeedHint>
          </div>
        </ControlsRow>

        <RangeWrapper>
          <RangeInput
            type="range"
            min={0}
            max={totalDurationSeconds || 1}
            value={Math.min(currentSimTime, totalDurationSeconds || 1)}
            onChange={handleSeek}
            disabled={controlsDisabled}
          />
          <TimingRow>
            <span>
              {formattedCurrentTime} · {formattedSimDateTime}
            </span>
            <span>{formattedTotalTime}</span>
          </TimingRow>
        </RangeWrapper>

        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Vuelos activos</MetricLabel>
            <MetricValue>{activeFlights.length}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Vuelos completados</MetricLabel>
            <MetricValue>{flightStats.completed}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Productos entregados</MetricLabel>
            <MetricValue>{completedProductsCount}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Avance</MetricLabel>
            <MetricValue>{progressPercent.toFixed(0)}%</MetricValue>
          </MetricCard>
        </MetricsGrid>
      </ControlsCard>

      <FlightMonitor
        simulationType="day-to-day"
        simulationResults={simulationResults || undefined}
        activeFlights={activeFlights}
        currentSimDateTime={currentSimDateTime}
      />
    </Wrapper>
  )
}