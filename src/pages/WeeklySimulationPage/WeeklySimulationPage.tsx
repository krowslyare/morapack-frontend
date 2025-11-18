import { useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane } from "react-leaflet"
import L, { DivIcon, Marker, type LatLngTuple } from "leaflet"
import gsap from "gsap"
import { useAirports } from "../../hooks/api/useAirports"
import { simulationService, type FlightInstance } from "../../api/simulationService"
import { WeeklyKPICard } from "../../components/ui/WeeklyKPICard"
import { toast } from "react-toastify"
import { useMap } from "react-leaflet"


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
}

function AnimatedFlights(props: AnimatedFlightsProps) {
  const { flightInstances, simulationStartTime, currentSimTime, isPlaying, playbackSpeed } = props

  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const processedRef = useRef<Set<string>>(new Set())

  const MAX_FLIGHTS = 300

  useEffect(() => {
    if (!map) return
    timelineRef.current = gsap.timeline({ paused: true })
    return () => {
      timelineRef.current?.kill()
      Object.values(markersRef.current).forEach(m => m.remove())
    }
  }, [map])

  useEffect(() => {
    if (!timelineRef.current || flightInstances.length === 0) return

    const timeline = timelineRef.current

    const ahead = new Date(currentSimTime.getTime() + 30 * 60000)
    const behind = new Date(currentSimTime.getTime() - 30 * 60000)

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
      const dest: LatLngTuple = [f.destinationAirport.latitude, f.destinationAirport.longitude]
      const ctrl = computeControlPoint(origin, dest)

      const initialAngle = (calculateBearing(origin, dest) + 90) % 360

      const icon = new DivIcon({
        className: 'plane-icon', // <- igual que en la diaria
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

      const dep = new Date(f.departureTime).getTime()
      const arr = new Date(f.arrivalTime).getTime()
      const durationSec = (arr - dep) / 1000
      const offsetSec = (dep - simulationStartTime.getTime()) / 1000

      const animObj = { t: 0 }

      timeline.to(
        animObj,
        {
            t: 1,
            duration: durationSec,
            ease: "none",

            onUpdate() {
            const pos = bezierPoint(animObj.t, origin, ctrl, dest)
            marker.setLatLng(pos)

            const tangent = bezierTangent(animObj.t, origin, ctrl, dest)
            const angle = (Math.atan2(tangent[1], tangent[0]) * 180) / Math.PI
            const adj = (angle + 90) % 360

            const img = marker.getElement()?.querySelector("img")
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
            }
        },
        offsetSec
        )
    })

    const elapsedSec = (currentSimTime.getTime() - simulationStartTime.getTime()) / 1000
    timeline.seek(elapsedSec)
  }, [flightInstances, currentSimTime])

  useEffect(() => {
    if (!timelineRef.current) return
    timelineRef.current.timeScale(playbackSpeed)
    isPlaying ? timelineRef.current.play() : timelineRef.current.pause()
  }, [isPlaying, playbackSpeed])

  return null
}

// ===============================
//        Weekly Simulation
// ===============================
export function WeeklySimulationPage() {
  const { data: airports } = useAirports()

  const MAIN_HUB_CODES = ["SPIM", "EBCI", "UBBB"]

  const mainWarehouses =
    airports?.filter(
      (a: any) =>
        a.codeIATA && MAIN_HUB_CODES.includes(a.codeIATA.toUpperCase())
    ) ?? []

  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const startTime = new Date("2025-01-01T00:00:00Z")
  const [dayIndex, setDayIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<any>(null)

  const [kpi, setKpi] = useState({
    totalFlights: 0,
    avgCapacityUsage: 0,
    busiestAirport: "-",
    busiestDay: "-",
  })

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
        startTime,   // <-- asegúrate de definirlo antes
        168,         // 7 días
        airports     // <-- ahora ya no puede ser undefined
        )

        setFlightInstances(inst)

        setKpi({
        totalFlights: inst.length,
        avgCapacityUsage: response.statistics?.averageUtilization ?? 0,
        busiestAirport: "-",
        busiestDay: "-",
        })

    } catch {
        toast.error("Error cargando vuelos semanales")
    }
    }, [airports, startTime])

  const start = () => {
    if (!airports) return toast.error("Cargar aeropuertos primero")

    setIsRunning(true)
    setCurrentTime(startTime)

    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (!prev) return prev

        const next = new Date(prev.getTime() + 3600 * 1000) // 1 hora simulada por segundo

        const d = Math.floor((next.getTime() - startTime.getTime()) / (24 * 3600 * 1000))
        setDayIndex(d)

        return next
      })
    }, 1000)

    loadWeeklyFlights()
  }

  const stop = () => {
    setIsRunning(false)
    clearInterval(intervalRef.current)
  }

  // ✈ Filtrar vuelos solo del día actual
  const flightsOfDay = flightInstances.filter(f => {
    const dep = new Date(f.departureTime)
    const d = Math.floor((dep.getTime() - startTime.getTime()) / (24 * 3600 * 1000))
    return d === dayIndex
  })

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

            <StatusBadge $running={isRunning}>
            {isRunning ? '● Ejecutando' : '○ Detenido'}
            </StatusBadge>

            <ControlButton
            $variant={isRunning ? 'stop' : 'play'}
            onClick={isRunning ? stop : start}
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
            <WeeklyKPICard label="Aeropuerto más activo" value={kpi.busiestAirport} />
            <WeeklyKPICard label="Día más activo" value={kpi.busiestDay} />
        </KPIContainer>
      </KPIPanel>

      <MapContainer bounds={bounds} style={{ height: "70vh", width: "100%" }}>
        {/* panes opcionales, solo para tener orden */}
        <Pane name="routes" style={{ zIndex: 400 }} />
        <Pane name="airports" style={{ zIndex: 450 }} />
        <Pane name="main-hubs" style={{ zIndex: 500 }} />

        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* Hubs principales */}
        {mainWarehouses.map((airport: any) => {
            const center: LatLngTuple = [
            Number(airport.latitude),
            Number(airport.longitude),
            ]
            const hubFill = "#f6b53b"
            const hubStroke = "#ebc725"

            return (
            <g key={`hub-${airport.id}`}>
                <CircleMarker
                center={center}
                radius={18}
                color="transparent"
                fillColor={hubFill}
                fillOpacity={0.2}
                weight={0}
                pane="main-hubs"
                />
                <CircleMarker
                center={center}
                radius={10}
                color={hubStroke}
                fillColor={hubFill}
                fillOpacity={0.95}
                weight={2.5}
                pane="main-hubs"
                >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div style={{ textAlign: "center" }}>
                    <strong>{airport.cityName}</strong>
                    <div style={{ fontSize: "11px", color: hubStroke, fontWeight: 700 }}>
                        Hub principal ({airport.codeIATA || airport.alias})
                    </div>
                    </div>
                </Tooltip>
                </CircleMarker>
            </g>
            )
        })}

        {/* Aeropuertos */}
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
            />
        ))}

        {isRunning && currentTime && (
            <AnimatedFlights
            flightInstances={flightsOfDay}
            currentSimTime={currentTime}
            simulationStartTime={startTime}
            isPlaying={isRunning}
            playbackSpeed={3600}
            onFlightClick={() => {}}
            onFlightHover={() => {}}
            />
        )}
        </MapContainer>

    </Wrapper>
  )
}
