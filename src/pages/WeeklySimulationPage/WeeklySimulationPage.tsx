import { useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { MapContainer, TileLayer } from "react-leaflet"
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
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const Title = styled.h2``

const KPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
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
        html: `<img src="/airplane.png" style="width:20px;height:20px;transform:rotate(${initialAngle}deg);"/>`,
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
            marker.setOpacity(0.3)
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
        <Title>Simulación Semanal — Día {dayIndex + 1} / 7</Title>
        <button onClick={isRunning ? stop : start}>
          {isRunning ? "Detener" : "Iniciar"}
        </button>
      </Header>

      <KPIContainer>
        <WeeklyKPICard label="Total de vuelos" value={kpi.totalFlights} />
        <WeeklyKPICard label="Capacidad Promedio" value={kpi.avgCapacityUsage + "%"} />
        <WeeklyKPICard label="Aeropuerto más activo" value={kpi.busiestAirport} />
        <WeeklyKPICard label="Día más activo" value={kpi.busiestDay} />
      </KPIContainer>

      <MapContainer bounds={bounds} style={{ height: "70vh", width: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {isRunning && currentTime && (
          <AnimatedFlights
            flightInstances={flightsOfDay}   // ⬅ FILTRADOS POR DÍA
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
