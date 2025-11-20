import { useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane, Polyline } from "react-leaflet"
import L, { DivIcon, Marker, type LatLngTuple } from "leaflet"
import gsap from "gsap"
import { useAirports } from "../../hooks/api/useAirports"
import { simulationService, type FlightInstance } from "../../api/simulationService"
import { WeeklyKPICard } from "../../components/ui/WeeklyKPICard"
import { toast } from "react-toastify"
import { useMap } from "react-leaflet"
import { useSimulationStore } from "../../store/useSimulationStore"
import type { Continent } from '../../types/Continent'

import type { SimAirport } from '../../hooks/useFlightSimulation'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import './index.css' 

// ====================== Styled =========================
const Wrapper = styled.div`
  padding: 16px;
`

const Header = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`
const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const DayBadge = styled.div`
  padding: 6px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
`

const StatusBadge = styled.div<{ $running: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => (p.$running ? '#d1fae5' : '#f3f4f6')};
  color: ${(p) => (p.$running ? '#065f46' : '#6b7280')};
`

const ControlButton = styled.button<{ $variant?: 'play' | 'stop' }>`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${(p) => (p.$variant === 'play' ? '#10b981' : '#ef4444')};
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`

const MapWrapper = styled.div`
  width: 100%;
  height: 70vh;
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`

const SimulationControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 260px;
`

const Clock = styled.div`
  font-size: 24px;
  font-weight: 900;
  color: #111827;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 10px;
  background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
`

const ClockLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-bottom: 4px;
`

const StatsRow = styled.div`
  font-size: 12px;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const StatLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SpeedControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SpeedLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
`

const SpeedButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`

const SpeedButton = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  border: 2px solid ${(p) => (p.$active ? '#14b8a6' : '#e5e7eb')};
  background: ${(p) => (p.$active ? '#d1fae5' : 'white')};
  color: ${(p) => (p.$active ? '#065f46' : '#6b7280')};
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #14b8a6;
    background: #d1fae5;
    color: #065f46;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SpeedHint = styled.div`
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  margin-top: 4px;
`

const KPIPanel = styled.div`
  margin: 4px 0 8px;          /* casi sin altura extra */
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const KPIPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`

const KPIPanelTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
`

const KPIPanelSubtitle = styled.span`
  font-size: 10px;
  color: #9ca3af;
`

const KPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
`




// =============================================================
//                 AnimatedFlights (igual que diario)
// =============================================================
import { bezierPoint, bezierTangent, computeControlPoint, calculateBearing } from "../../components/ui/bezierUtils"

interface AnimatedFlightsProps {
  flightInstances: FlightInstance[]
  simulationStartTime: Date
  currentSimTime: Date
  isPlaying: boolean
  playbackSpeed: number
  onFlightClick: (flight: FlightInstance) => void
  onFlightHover: (flight: FlightInstance | null) => void
  flightHasProducts: Record<number, boolean>   // ← nuevo
}

function AnimatedFlights(props: AnimatedFlightsProps) {
  const { 
    flightInstances, 
    simulationStartTime, 
    currentSimTime, 
    isPlaying, 
    playbackSpeed,
    onFlightClick,
    onFlightHover,
    flightHasProducts,
  } = props

  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const processedRef = useRef<Set<string>>(new Set())
  const arrivalTimesRef = useRef<Record<string, number>>({})

  const MAX_FLIGHTS = 300

  useEffect(() => {
    if (!map) return
    timelineRef.current = gsap.timeline({ paused: true })
    return () => {
      timelineRef.current?.kill()
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}
      processedRef.current.clear()
      arrivalTimesRef.current = {}
    }
  }, [map])

  // 2) Añadir vuelos al timeline + hacer seek al tiempo actual
  useEffect(() => {
    if (!timelineRef.current || flightInstances.length === 0) return

    const timeline = timelineRef.current

    // ventana dinámica en función de la velocidad
    // siempre al menos 30 min, pero como mínimo ~2 pasos de reloj
    const stepMs = playbackSpeed * 1000           // segundos sim por seg real -> ms
    const halfWindowMs = Math.max(30 * 60 * 1000, stepMs * 2)

    const ahead  = new Date(currentSimTime.getTime() + halfWindowMs)
    const behind = new Date(currentSimTime.getTime() - halfWindowMs)

    const newFlights = flightInstances
        .filter(f => {
        const dep = new Date(f.departureTime)
        const arr = new Date(f.arrivalTime)
        return (
            !processedRef.current.has(f.id) &&
            dep <= ahead &&
            arr >= behind
        )
        })
        .slice(0, MAX_FLIGHTS)

    newFlights.forEach(f => {
        processedRef.current.add(f.id)

        const origin: LatLngTuple = [f.originAirport.latitude, f.originAirport.longitude]
        const dest: LatLngTuple   = [f.destinationAirport.latitude, f.destinationAirport.longitude]
        const ctrl = computeControlPoint(origin, dest)

        
        const initialAngle = (calculateBearing(origin, dest) + 90) % 360
        
        const hasProducts = !!flightHasProducts[f.flightId]   // ← mira el mapa

        const icon = new DivIcon({
          className: hasProducts
            ? 'plane-icon plane-icon--loaded'
            : 'plane-icon plane-icon--empty',
          html: `<img src="/airplane.png"
                        style="width:20px;height:20px;display:block;
                              transform-origin:50% 50%;
                              transform:rotate(${initialAngle}deg);" />`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker(origin, { icon }).addTo(map)
        marker.setOpacity(0)
        markersRef.current[f.id] = marker

        marker.on('click', () => onFlightClick(f))
        marker.on('mouseover', () => onFlightHover(f))
        marker.on('mouseout', () => onFlightHover(null))

        const depMs = new Date(f.departureTime).getTime()
        const arrMs = new Date(f.arrivalTime).getTime()
        arrivalTimesRef.current[f.id] = arrMs

        const durationSec = (arrMs - depMs) / 1000
        const offsetSec   = (depMs - simulationStartTime.getTime()) / 1000

        const animObj = { t: 0 }

        timeline.to(
        animObj,
        {
            t: 1,
            duration: durationSec,
            ease: 'none',
            onUpdate() {
            const pos = bezierPoint(animObj.t, origin, ctrl, dest)
            marker.setLatLng(pos)

            const tangent = bezierTangent(animObj.t, origin, ctrl, dest)
            const angle = (Math.atan2(tangent[1], tangent[0]) * 180) / Math.PI
            const adj = (angle + 90) % 360

            const img = marker.getElement()?.querySelector('img') as HTMLImageElement | null
            if (img) img.style.transform = `rotate(${adj}deg)`
            },
            onStart() {
            marker.setOpacity(1)
            },
            onComplete() {
            const id = f.id
            const m = markersRef.current[id]
            if (m) {
                m.remove()
                delete markersRef.current[id]
            }
            },
        },
        offsetSec
        )
    })

    
    const elapsedSec = (currentSimTime.getTime() - simulationStartTime.getTime()) / 1000
    timeline.seek(elapsedSec, false)
    }, [flightInstances, currentSimTime, playbackSpeed])

    // 3) Limpieza adicional por tiempo de llegada (por si algún onComplete no se dispara)
    useEffect(() => {
        if (!currentSimTime) return

        const now = currentSimTime.getTime()

        Object.entries(arrivalTimesRef.current).forEach(([id, arrMs]) => {
        if (now > arrMs + 60_000) {
            const marker = markersRef.current[id]
            if (marker) {
            marker.remove()
            delete markersRef.current[id]
            }
            delete arrivalTimesRef.current[id]
        }
        })
    }, [currentSimTime])


    useEffect(() => {
        if (!timelineRef.current) return
        timelineRef.current.timeScale(playbackSpeed)
        isPlaying ? timelineRef.current.play() : timelineRef.current.pause()
    }, [isPlaying, playbackSpeed])

  return null
}

function mapAirportToSimAirport(a: any): SimAirport {
  return {
    id: a.id,
    city: a.cityName ?? a.city ?? '',
    country: a.countryName ?? a.country ?? '',
    // si tu API ya trae el continente, úsalo; si no, ponle un default válido
    continent: (a.continent as Continent) ?? 'America', 

    latitude: Number(a.latitude ?? 0),
    longitude: Number(a.longitude ?? 0),

    // si el aeropuerto del backend no tiene esto, puedes:
    //  - usar un campo existente (p.ej. a.capacityPercent)
    //  - o fijar un valor calculado / por defecto
    capacityPercent: Number(a.capacityPercent ?? 0),
  }
}

const INITIAL_KPI = {
  totalFlights: 0,
  avgCapacityUsage: 0,
  busiestAirport: "-",
  busiestDay: "-",
}


// ===============================
//        Weekly Simulation
// ===============================
export function WeeklySimulationPage() {

    const TOTAL_DAYS = 7
    const SPEED_SLOW = 1800   // 30 min simulados por segundo real
    const SPEED_FAST = 3600   // 1 hora simulada por segundo real

    const { simulationStartDate, hasValidConfig } = useSimulationStore()
    const startTime = simulationStartDate ?? new Date()

    const [playbackSpeed, setPlaybackSpeed] = useState(SPEED_FAST) // 1 hora simulada por segundo
    const speedRef = useRef(SPEED_FAST)

    const [flightHasProducts, setFlightHasProducts] = useState<Record<number, boolean>>({})

    useEffect(() => {
        speedRef.current = playbackSpeed
    }, [playbackSpeed])

    const [hoveredFlight, setHoveredFlight] = useState<FlightInstance | null>(null)

    const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
    const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)

    const handleFlightClick = (flight: FlightInstance) => {
        console.log('CLICK flightId:', flight.flightId, 'flightCode:', flight.flightCode)
        // usa los campos que tengas en FlightInstance
        setSelectedFlight({
        id: flight.flightId,      // o flight.id si ese es el ID base
        code: flight.flightCode,  // o flight.code
        })
    }

    const { data: airports } = useAirports()

    const MAIN_HUB_CODES = ["SPIM", "EBCI", "UBBB"]

    const mainWarehouses =
        airports?.filter(
        (a: any) =>
            a.codeIATA && MAIN_HUB_CODES.includes(a.codeIATA.toUpperCase())
        ) ?? []

    

    const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])

    const [currentTime, setCurrentTime] = useState<Date | null>(null)

    const [dayIndex, setDayIndex] = useState(0)

    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    const intervalRef = useRef<any>(null)

    const [kpi, setKpi] = useState(INITIAL_KPI)

    const loadWeeklyFlights = useCallback(async () => {
        try {
            const response = await simulationService.getFlightStatuses()

            // VALIDACIÓN — evita el error TS2345
            if (!airports || airports.length === 0) {
            toast.error("No hay aeropuertos cargados")
            return
            }

            const inst = simulationService.generateFlightInstances(
              response.flights,
              startTime,
              168,
              airports
            )

            setFlightInstances(inst)

            // === marcar vuelos que tienen paquetes ===
            const hasProductsMap: Record<number, boolean> = {}
            response.flights.forEach((f: any) => {
              console.log(
                'flightInstance',
                f.flightId,
                f.flightCode,
                'hasProducts?',
                !!flightHasProducts[f.flightId]
              )
              // usa el mismo campo que expone el backend
              const assigned = f.assignedProducts ?? 0   // o f.usedCapacity ?? 0
              hasProductsMap[f.flightId] = assigned > 0
            })
            setFlightHasProducts(hasProductsMap)

            // ==== Aeropuerto más activo (por salidas) ====
            const flightsByAirport: Record<string, number> = {}

            inst.forEach((f) => {
                // Normalizar código: primero IATA, luego alias, luego nombre de ciudad
                const rawCode =
                    f.originAirport.codeIATA ??
                    (typeof f.originAirport.city === 'string'
                    ? f.originAirport.city
                    : f.originAirport.city?.name)

                if (!rawCode) return

                const code = String(rawCode) // aquí garantizamos que es string

                flightsByAirport[code] = (flightsByAirport[code] ?? 0) + 1
            })

            let busiestAirport = "-"
            let maxFlightsAirport = 0

            Object.entries(flightsByAirport).forEach(([code, count]) => {
                if (count > maxFlightsAirport) {
                    maxFlightsAirport = count
                    busiestAirport = `${code} (${count} vuelos)`
                }
            })

            // ==== Día más activo (por fecha de salida) ====
            const flightsByDay = Array(TOTAL_DAYS).fill(0)

            inst.forEach(f => {
            const dep = new Date(f.departureTime)
            const d = Math.floor(
                (dep.getTime() - startTime.getTime()) / (24 * 3600 * 1000)
            )
            if (d >= 0 && d < TOTAL_DAYS) {
                flightsByDay[d] += 1
            }
            })

            let busiestDay = "-"
            let maxFlightsDay = 0
            for (let i = 0; i < TOTAL_DAYS; i++) {
            if (flightsByDay[i] > maxFlightsDay) {
                maxFlightsDay = flightsByDay[i]
                busiestDay = `Día ${i + 1} (${flightsByDay[i]} vuelos)`
            }
            }

            setKpi({
            totalFlights: inst.length,
            avgCapacityUsage: response.statistics?.averageUtilization ?? 0,
            busiestAirport,
            busiestDay,
            })

        } catch {
            toast.error("Error cargando vuelos semanales")
        }
    }, [airports, startTime])

    const setupInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            setCurrentTime(prev => {
            if (!prev) return prev

            const next = new Date(prev.getTime() + speedRef.current * 1000)

            const d = Math.floor(
                (next.getTime() - startTime.getTime()) / (24 * 3600 * 1000)
            )

            if (d >= TOTAL_DAYS) {
                // terminó la semana → solo detiene, NO resetea contador ni KPIs
                stop(false)
                return prev
            }

            setDayIndex(d)
            return next
            })
        }, 1000)
    }

    const stop = (reset: boolean = true) => {
        setIsRunning(false)
        setIsPaused(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (reset) {
          setCurrentTime(null)
          setDayIndex(0)
          setFlightInstances([])
          setKpi(INITIAL_KPI)   // KPI “en blanco” solo cuando reset = true
         }
    }

    const start = () => {

        if (!hasValidConfig() || !simulationStartDate) {
            toast.error("Debes configurar la fecha en Planificación primero")
            return
        }

        if (!airports) return toast.error("Cargar aeropuertos primero")

        // limpiar cualquier intervalo viejo y estado de semana
        stop()
        setDayIndex(0)
        setCurrentTime(startTime)

        setIsRunning(true)
        setIsPaused(false)

        setupInterval()
        loadWeeklyFlights()
    }

    const togglePause = () => {
        if (!isRunning) return

        setIsPaused(prev => {
            const next = !prev

            if (next) {
            // pausar
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            } else {
            // reanudar
            setupInterval()
            }

            return next
        })
    }

    // ✈ Filtrar vuelos solo del día actual
    const flightsOfDay = flightInstances.filter(f => {
        const dep = new Date(f.departureTime)
        const d = Math.floor((dep.getTime() - startTime.getTime()) / (24 * 3600 * 1000))
        return d === dayIndex
    })

    const activeFlightsCount = currentTime
    ? flightsOfDay.filter(f => {
        const dep = new Date(f.departureTime)
        const arr = new Date(f.arrivalTime)
        return currentTime >= dep && currentTime <= arr
        }).length
    : 0

    const bounds = airports?.length
        ? L.latLngBounds(airports.map(a => [Number(a.latitude), Number(a.longitude)] as LatLngTuple))
        : L.latLngBounds([[-60, -180], [60, 180]])

    return (
        <Wrapper>
            <Header>
            <TitleBlock>
                <Title>Simulación semanal</Title>
                <Subtitle>
                Semana de operación — vuelos programados y uso de capacidad
                </Subtitle>
            </TitleBlock>

            <HeaderRight>
                <DayBadge>Día {Math.min(dayIndex + 1, 7)} / 7</DayBadge>

                <StatusBadge $running={isRunning && !isPaused}>
                {!isRunning
                    ? '○ Detenido'
                    : isPaused
                    ? '▮▮ Pausado'
                    : '● Ejecutando'}
                </StatusBadge>

                <ControlButton
                $variant="play"
                onClick={togglePause}
                disabled={!isRunning}
                >
                {isPaused ? 'Reanudar' : 'Pausar'}
                </ControlButton>

                <ControlButton
                $variant={isRunning ? 'stop' : 'play'}
                onClick={isRunning ? () => stop() : start}
                disabled={!airports || airports.length === 0}
                >
                {isRunning ? 'Detener simulación' : 'Iniciar simulación'}
                </ControlButton>

            </HeaderRight>
            </Header>

            <KPIPanel>
            <KPIPanelHeader>
                <KPIPanelTitle>Indicadores de la semana</KPIPanelTitle>
                <KPIPanelSubtitle>
                Corte del día {Math.min(dayIndex + 1, 7)} / 7
                </KPIPanelSubtitle>
            </KPIPanelHeader>

            <KPIContainer>
                <WeeklyKPICard label="Total de vuelos" value={kpi.totalFlights} />
                <WeeklyKPICard label="Capacidad Promedio" value={kpi.avgCapacityUsage + "%"} />
                <WeeklyKPICard label="Aeropuerto más activo" value={kpi.busiestAirport}  />
                <WeeklyKPICard label="Día más activo" value={kpi.busiestDay}  />
            </KPIContainer>
            </KPIPanel>

            {/* AQUÍ va el panel lateral + mapa */}
            <MapWrapper>
            <SimulationControls>
                <div>
                <ClockLabel>Tiempo de simulación</ClockLabel>
                <Clock>
                    {currentTime
                    ? currentTime.toLocaleDateString('es-ES')
                    : '--/--/----'}
                </Clock>
                <Clock style={{ marginTop: '8px', fontSize: '20px' }}>
                    {currentTime
                    ? currentTime.toLocaleTimeString('es-ES', { hour12: false })
                    : '--:--:--'}
                </Clock>
                </div>

                <StatsRow>
                <StatLine>
                    <span>Día de la semana:</span>
                    <strong>{Math.min(dayIndex + 1, 7)} / 7</strong>
                </StatLine>
                <StatLine>
                    <span>Vuelos del día:</span>
                    <strong>{flightsOfDay.length}</strong>
                </StatLine>
                <StatLine>
                    <span>Vuelos activos ahora:</span>
                    <strong>{activeFlightsCount}</strong>
                </StatLine>
                </StatsRow>

                <SpeedControlContainer>
                    <SpeedLabel>Velocidad de reproducción</SpeedLabel>
                    <SpeedButtonGroup>
                        <SpeedButton
                        $active={playbackSpeed === SPEED_SLOW}
                        onClick={() => setPlaybackSpeed(SPEED_SLOW)}
                        disabled={!isRunning}
                        >
                        30 min / seg
                        </SpeedButton>
                        <SpeedButton
                        $active={playbackSpeed === SPEED_FAST}
                        onClick={() => setPlaybackSpeed(SPEED_FAST)}
                        disabled={!isRunning}
                        >
                        1h / seg
                        </SpeedButton>
                    </SpeedButtonGroup>
                    <SpeedHint>
                        {playbackSpeed === SPEED_SLOW &&
                        '30 minutos simulados = 1 segundo real'}
                        {playbackSpeed === SPEED_FAST &&
                        '1 hora simulada = 1 segundo real'}
                    </SpeedHint>
                </SpeedControlContainer>
            </SimulationControls>

            <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
                <Pane name="routes" style={{ zIndex: 400 }} />
                <Pane name="airports" style={{ zIndex: 450 }} />
                <Pane name="main-hubs" style={{ zIndex: 500 }} />

                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                {mainWarehouses.map((airport: any) => {
                const center: LatLngTuple = [
                    Number(airport.latitude),
                    Number(airport.longitude),
                ]
                const hubFill = '#f6b53b'
                const hubStroke = '#ebc725'

                return (
                    <g key={`hub-${airport.id}`}>
                    <CircleMarker
                        center={center}
                        radius={10}
                        color={hubStroke}
                        fillColor={hubFill}
                        fillOpacity={0.95}
                        weight={2.5}
                        pane="main-hubs"
                        eventHandlers={{
                            click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
                        }}
                    />
                    <CircleMarker
                        center={center}
                        radius={10}
                        color={hubStroke}
                        fillColor={hubFill}
                        fillOpacity={0.95}
                        weight={2.5}
                        pane="main-hubs"
                        eventHandlers={{
                            click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                        <div style={{ textAlign: 'center' }}>
                            <strong>{airport.cityName}</strong>
                            <div style={{ fontSize: '11px', color: hubStroke, fontWeight: 700 }}>
                            Hub principal ({airport.codeIATA || airport.alias})
                            </div>
                        </div>
                        </Tooltip>
                    </CircleMarker>
                    </g>
                )
                })}

                {airports?.map((airport: any) => (
                    <CircleMarker
                        key={airport.id}
                        center={[Number(airport.latitude), Number(airport.longitude)]}
                        radius={6}
                        color="#14b8a6"
                        fillColor="#14b8a6"
                        fillOpacity={0.8}
                        weight={2}
                        pane="airports"
                        eventHandlers={{
                        click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
                        }}
                    />
                ))}

                {hoveredFlight && (
                    (() => {
                        const origin: LatLngTuple = [
                        hoveredFlight.originAirport.latitude,
                        hoveredFlight.originAirport.longitude,
                        ]
                        const dest: LatLngTuple = [
                        hoveredFlight.destinationAirport.latitude,
                        hoveredFlight.destinationAirport.longitude,
                        ]
                        const ctrl = computeControlPoint(origin, dest) // ya lo importas de bezierUtils

                        const samples = 30
                        const arc: LatLngTuple[] = Array.from({ length: samples + 1 }, (_, i) => {
                        const t = i / samples
                        return bezierPoint(t, origin, ctrl, dest)
                        })

                        return (
                        <Polyline
                            positions={arc}
                            color="#3b82f6"
                            weight={2.5}
                            opacity={0.85}
                            pane="routes"
                        />
                        )
                    })()
                )}

                {isRunning && currentTime && (
                  <AnimatedFlights
                    flightInstances={flightInstances}
                    currentSimTime={currentTime}
                    simulationStartTime={startTime}
                    isPlaying={isRunning && !isPaused}
                    playbackSpeed={playbackSpeed}
                    onFlightClick={handleFlightClick}
                    onFlightHover={setHoveredFlight}
                    flightHasProducts={flightHasProducts}   // ← nuevo prop
                  />
                )}
            </MapContainer>
            </MapWrapper>

            {selectedAirport && (
                <AirportDetailsModal
                airport={selectedAirport}
                onClose={() => setSelectedAirport(null)}
                readOnly
                />
            )}

            {selectedFlight && (
                <FlightPackagesModal
                flightId={selectedFlight.id}
                flightCode={selectedFlight.code}
                onClose={() => setSelectedFlight(null)}
                />
            )}

        </Wrapper>
        )

}
