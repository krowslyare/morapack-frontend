import { useState, useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap, Pane } from 'react-leaflet'
import L, { type LatLngTuple, DivIcon, Marker } from 'leaflet'
import gsap from 'gsap'
import { useSimulationStore } from '../../store/useSimulationStore'
import { type FlightInstance } from '../../api/simulationService'
import { useAirports } from '../../hooks/api/useAirports'
import { toast } from 'react-toastify'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import type { Continent } from '../../types/Continent'
import { NEW_ORDER_CREATED_EVENT } from '../../constants/events'
import { useRealtimeSimulationEngine } from '../../store/useRealtimeSimulationEngine'
import type { OrderSchema } from '../../types'

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

const MapWrapper = styled.div`
  width: 100%;
  height: 70vh;
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const SimulationControls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.98);
  padding: 18px 20px;
  border-radius: 12px;
  box-shadow:
    0 4px 20px rgba(15, 23, 42, 0.1),
    0 1px 3px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 240px;
  backdrop-filter: blur(6px);
`

const Clock = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: #111827;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 12px;
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

const ControlButton = styled.button<{ $variant?: 'play' | 'pause' | 'danger' }>`
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => {
    if (p.$variant === 'play') return '#10b981'
    if (p.$variant === 'pause') return '#f59e0b'
    if (p.$variant === 'danger') return '#dc2626'
    return '#6b7280'
  }};
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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

const HintText = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
`

const Modal = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 14px;
  max-width: 280px;
  width: calc(100% - 32px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
`

const ModalTitle = styled.h3`
  margin: 0 0 16px;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
`

const ModalText = styled.p`
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.5;
`

const ModalButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #14b8a6;
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0d9488;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const StatusBadge = styled.div<{ $status: 'idle' | 'running' | 'paused' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => {
    if (p.$status === 'running') return '#d1fae5'
    if (p.$status === 'paused') return '#fed7aa'
    return '#f3f4f6'
  }};
  color: ${(p) => {
    if (p.$status === 'running') return '#065f46'
    if (p.$status === 'paused') return '#92400e'
    return '#6b7280'
  }};
`


const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 12px;
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const LoadingText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`

const AlgorithmBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 6px;
  color: #c2410c;
  font-size: 12px;
  font-weight: 600;
`


function mapAirportToSimAirport(a: any): SimAirport {
  return {
    id: a.id,
    city: a.cityName ?? a.city ?? '',
    country: a.countryName ?? a.country ?? '',
    continent: (a.continent as Continent) ?? 'America',
    latitude: Number(a.latitude ?? 0),
    longitude: Number(a.longitude ?? 0),
    capacityPercent: Number(a.capacityPercent ?? 0),
  }
}

// =============================================================
//                 AnimatedFlights
// =============================================================

function computeControlPoint(a: LatLngTuple, b: LatLngTuple, curvature = 0.25): LatLngTuple {
  const lat1 = a[0]
  const lng1 = a[1]
  const lat2 = b[0]
  const lng2 = b[1]
  const latMid = (lat1 + lat2) / 2
  const lngMid = (lng1 + lng2) / 2
  const scale = Math.cos(((lat1 + lat2) * Math.PI) / 360)
  const dx = (lng2 - lng1) * scale
  const dy = lat2 - lat1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = curvature * len
  const ctrlLng = lngMid + (nx * offset) / (scale || 1e-6)
  const ctrlLat = latMid + ny * offset
  return [ctrlLat, ctrlLng]
}

// Bezier interpolation
function bezierPoint(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  const lat = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * p1[0] + t * t * p2[0]
  const lng = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * p1[1] + t * t * p2[1]
  return [lat, lng]
}

// Calculate tangent vector of Bezier curve (derivative)
function bezierTangent(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  const dlat = 2 * oneMinusT * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const dlng = 2 * oneMinusT * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  return [dlat, dlng]
}

// Calculate bearing/heading from point A to point B
function calculateBearing(from: LatLngTuple, to: LatLngTuple): number {
  const lat1 = (from[0] * Math.PI) / 180
  const lat2 = (to[0] * Math.PI) / 180
  const dLng = ((to[1] - from[1]) * Math.PI) / 180

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360 // Normalize to 0-360
}

// GSAP-based animated flights component
interface AnimatedFlightsProps {
  flightInstances: FlightInstance[]
  simulationStartTime: Date
  currentSimTime: Date
  isPlaying: boolean
  onFlightClick: (flight: FlightInstance) => void
  onFlightHover: (flight: FlightInstance | null) => void
}

function AnimatedFlights({
  flightInstances,
  simulationStartTime,
  currentSimTime,
  isPlaying,
  onFlightClick,
  onFlightHover,
  processedIdsRef,
  markersRef
}: AnimatedFlightsProps & {
  processedIdsRef: React.MutableRefObject<Set<string>>,
  markersRef: React.MutableRefObject<Record<string, Marker>>
}) {
  const map = useMap()
  // Removed local refs
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const animDataRef = useRef<
    Record<
      string,
      {
        origin: LatLngTuple
        destination: LatLngTuple
        ctrl: LatLngTuple
      }
    >
  >({})

  // Limit to prevent performance issues
  const MAX_CONCURRENT_ANIMATIONS = 300 // Limit active animations, not total processed

  // Initialize timeline once
  useEffect(() => {
    if (!map) return

    if (!timelineRef.current) {
      const timeline = gsap.timeline({ paused: true })
      timeline.timeScale(1)
      timelineRef.current = timeline
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
        timelineRef.current = null
      }
      // Don't clear refs on unmount to persist state if needed, or clear if truly unmounting
      // But for now we let parent handle lifetime if needed.
      // Actually, we SHOULD clear markers on unmount of this component to avoid map clutter
      Object.values(markersRef.current).forEach((m) => {
        m.off()
        m.remove()
      })
      markersRef.current = {}
      // processedIdsRef is managed by parent now
    }
  }, [map, markersRef])

  // Add new flight instances to timeline dynamically
  useEffect(() => {
    if (!map || !timelineRef.current || flightInstances.length === 0) return

    const timeline = timelineRef.current

    // Only process flights departing within the next 30 minutes to optimize performance
    // Older/future flights won't create markers until they're about to depart
    const thirttyMinutesFromNow = new Date(currentSimTime.getTime() + 30 * 60 * 1000)
    const thirtyMinutesAgo = new Date(currentSimTime.getTime() - 30 * 60 * 1000)

    // Calculate currently active markers to respect limit
    const currentActiveCount = Object.keys(markersRef.current).length
    const availableSlots = MAX_CONCURRENT_ANIMATIONS - currentActiveCount

    if (availableSlots <= 0) return

    // Find new instances that haven't been processed and are about to fly
    const newInstances = flightInstances
      .filter((f) => {
        const dept = new Date(f.departureTime)
        const arr = new Date(f.arrivalTime)
        // Include flights that: depart soon, are currently flying, or recently arrived (cleanup window)
        return (
          !processedIdsRef.current.has(f.id) && // use f.id (string unique instance id)
          dept <= thirttyMinutesFromNow &&
          arr >= thirtyMinutesAgo
        )
      })
      // Prioritize flights with cargo to ensure they are visualized when concurrency limit is hit
      .sort((a, b) => {
        const cargoA = a.assignedProducts || 0
        const cargoB = b.assignedProducts || 0

        // Priority 1: Cargo vs No Cargo (Flights with cargo come first)
        if (cargoA > 0 && cargoB === 0) return -1
        if (cargoB > 0 && cargoA === 0) return 1

        // Priority 2: Departure time (FIFO - earlier flights first)
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      })
      // Limit the number of NEW animations added per cycle to avoid flooding
      // This respects the MAX_CONCURRENT_ANIMATIONS somewhat indirectly by throttling
      // But better to limit based on available slots
      .slice(0, availableSlots)

    if (newInstances.length === 0) return

    console.log(`Adding ${newInstances.length} new flight animations to timeline`)

    newInstances.forEach((flight) => {
      // Mark as processed
      processedIdsRef.current.add(flight.id) // use flight.id

      const origin: LatLngTuple = [
        flight.originAirport.latitude,
        flight.originAirport.longitude,
      ]
      const destination: LatLngTuple = [
        flight.destinationAirport.latitude,
        flight.destinationAirport.longitude,
      ]
      const ctrl = computeControlPoint(origin, destination, 0.2)

      // Store animation data
      animDataRef.current[flight.id] = { origin, destination, ctrl }

      // Calculate initial bearing (heading) from origin to destination
      // Add 90 degree offset because airplane image points left (270°), not right (90°)
      const initialBearing = calculateBearing(origin, destination)
      const adjustedInitialBearing = (initialBearing + 90) % 360

      // Create marker with rotation
      const planeHTML = `<img src="/airplane.png" alt="✈" style="width:20px;height:20px;display:block;transform-origin:50% 50%;transform:rotate(${adjustedInitialBearing}deg);transition:transform 0.3s linear;" />`
      const planeIcon = new DivIcon({
        className: 'plane-icon',
        html: planeHTML,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker(origin, { icon: planeIcon, interactive: true })
      marker.setOpacity(0) // Start hidden
      marker.on('click', () => onFlightClick(flight))
      marker.addTo(map)
      markersRef.current[flight.id] = marker

      // Calculate timing
      const departureTime = new Date(flight.departureTime)
      const arrivalTime = new Date(flight.arrivalTime)
      const flightDurationMs = arrivalTime.getTime() - departureTime.getTime()
      const flightDurationSeconds = flightDurationMs / 1000
      const startOffsetMs = departureTime.getTime() - simulationStartTime.getTime()
      const startOffsetSeconds = startOffsetMs / 1000

      // Animation object for GSAP
      const animObj = { progress: 0 }

      // Add animation to timeline at the correct time
      timeline.to(
        animObj,
        {
          progress: 1,
          duration: flightDurationSeconds,
          ease: 'none',
          onUpdate: () => {
            const pos = bezierPoint(animObj.progress, origin, ctrl, destination)
            marker.setLatLng(pos)

            // Calculate bearing from tangent of Bezier curve for accurate direction
            const tangent = bezierTangent(animObj.progress, origin, ctrl, destination)
            const bearing = (Math.atan2(tangent[1], tangent[0]) * 180) / Math.PI
            // Add 90 degree offset because airplane image points left, not right
            const adjustedBearing = (bearing + 90) % 360

            const markerElement = marker.getElement()
            if (markerElement) {
              const img = markerElement.querySelector('img') as HTMLImageElement
              if (img) {
                img.style.transform = `rotate(${adjustedBearing}deg)`
              }
            }
          },
          onStart: () => {
            marker.setOpacity(1) // Show when flight departs
          },
          onComplete: () => {
            marker.setOpacity(0) // Hide immediately when arrived
            // Remove marker shortly after to free memory
            setTimeout(() => {
              if (markersRef.current[flight.id]) {
                markersRef.current[flight.id].remove()
                delete markersRef.current[flight.id]
                // Do NOT remove from processedIdsRef here. 
                // Keeping it prevents the system from trying to re-add this same flight 
                // if it's still within the 30min visibility window.
              }
            }, 100) // Remove 100ms after arrival (almost instant)
          },
        },
        startOffsetSeconds
      )
      marker.on('mouseover', () => onFlightHover(flight))
      marker.on('mouseout', () => onFlightHover(null))
    })

    // Seek to current time to update new animations
    const elapsedMs = currentSimTime.getTime() - simulationStartTime.getTime()
    const elapsedSeconds = elapsedMs / 1000
    timeline.seek(elapsedSeconds, false)
  }, [flightInstances, map, simulationStartTime, currentSimTime, onFlightClick])

  // Sync timeline with simulation time and play/pause state
  useEffect(() => {
    if (!timelineRef.current) return

    const elapsedMs = currentSimTime.getTime() - simulationStartTime.getTime()
    const elapsedSeconds = elapsedMs / 1000

    // Only seek if the divergence is significant to prevent jitter on hover/updates
    // GSAP's internal time vs our React state time
    // We use a slightly larger tolerance to avoid micro-adjustments during playback
    const currentTime = timelineRef.current.time()

    // If paused, we want precise seeking for scrubbing
    if (!isPlaying) {
      timelineRef.current.seek(elapsedSeconds, false)
      return
    }

    // If playing, only correct if drift is noticeable (> 1s) to prevent visual stutter
    if (Math.abs(currentTime - elapsedSeconds) > 2) {
      timelineRef.current.seek(elapsedSeconds, false)
    }

    // Ensure playing state is correct
    if (!timelineRef.current.isActive()) {
      timelineRef.current.play()
    }
  }, [currentSimTime, simulationStartTime, isPlaying])

  return null
}

export function DailySimulationPage() {
  const navigate = useNavigate()
  const { hasValidConfig, simulationStartDate } = useSimulationStore()
  const {
    isRunning,
    isInitializing,
    isLoadingData,
    algorithmRunning,
    currentSimTime,
    dayCount,
    windowMinutes,
    flightInstances,
    start,
    pause,
    stop,
    enqueueImmediateRun,
    setAirports,
  } = useRealtimeSimulationEngine()

  // Data
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)
  const [hoveredFlightId, setHoveredFlightId] = useState<number | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)

  // Refs
  // Lifted refs for cleanup access
  const processedIdsRef = useRef<Set<string>>(new Set())
  const markersRef = useRef<Record<string, Marker>>({})

  // Load airports
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []

  useEffect(() => {
    if (airports && airports.length > 0) {
      setAirports(airports)
    }
  }, [airports, setAirports])

  useEffect(() => {
    return () => {
      const { isRunning: running } = useRealtimeSimulationEngine.getState()
      if (running) {
        toast.info('Simulación tiempo real corriendo en segundo plano...')
      }
    }
  }, [])

  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      const detail = (event as CustomEvent<OrderSchema | undefined>).detail
      enqueueImmediateRun(detail?.creationDate)
    }

    window.addEventListener(NEW_ORDER_CREATED_EVENT, handleNewOrder)
    return () => window.removeEventListener(NEW_ORDER_CREATED_EVENT, handleNewOrder)
  }, [enqueueImmediateRun])

  // Start simulation
  const handleStart = useCallback(async () => {
    if (!hasValidConfig() || !simulationStartDate) {
      toast.error('Debes configurar la fecha en Planificación primero')
      return
    }

    if (isRunning) {
      toast.info('La simulación ya está en curso.')
      return
    }

    if (!airports || airports.length === 0) {
      toast.error('Debes cargar los aeropuertos antes de iniciar la simulación')
      return
    }

    processedIdsRef.current.clear()
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    await start({ simulationStartDate, airports })
  }, [airports, hasValidConfig, isRunning, simulationStartDate, start])

  const handlePause = useCallback(() => {
    pause()
  }, [pause])

  const handleStop = useCallback(() => {
    stop(true)
    processedIdsRef.current.clear()
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}
  }, [stop])

  // Format time for display
  const formatSimTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('es-ES', { hour12: false })
  }

  const formatSimDate = (date: Date | null) => {
    if (!date) return '--/--/----'
    return date.toLocaleDateString('es-ES')
  }

  // Map bounds
  const bounds =
    airports.length > 0
      ? L.latLngBounds(
        airports.map((a: any) => [parseFloat(a.latitude), parseFloat(a.longitude)] as LatLngTuple)
      )
      : L.latLngBounds([
        [-60, -180],
        [70, 180],
      ])

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution = '&copy; OpenStreetMap & CARTO'
  const MAIN_HUB_CODES = ['SPIM', 'EBCI', 'UBBB']
  const mainWarehouses = airports.filter(
    (airport: any) => airport.codeIATA && MAIN_HUB_CODES.includes(airport.codeIATA.toUpperCase()),
  )

  // Handle flight click
  const handleFlightClick = (flight: FlightInstance) => {
    setSelectedFlight({ id: flight.flightId, code: flight.flightCode })
  }

  const handleFlightHover = (flight: FlightInstance | null) => {
    setHoveredFlightId(flight ? flight.flightId : null)
  }

  // Calculate active flights for KPI
  const activeFlightsCount = currentSimTime
    ? flightInstances.filter((f) => {
      const dep = new Date(f.departureTime)
      const arr = new Date(f.arrivalTime)
      return currentSimTime >= dep && currentSimTime <= arr
    }).length
    : 0

  return (
    <Wrapper>
      {/* Config check modal */}
      <Modal $show={!hasValidConfig()}>
        <ModalContent>
          <ModalTitle>⚠️ Configuración Requerida</ModalTitle>
          <ModalText>
            Debes configurar la fecha de simulación en la página de Planificación antes de continuar.
          </ModalText>
          <ModalButton onClick={() => navigate('/planificacion')}>Ir a Planificación</ModalButton>
        </ModalContent>
      </Modal>

      <Header>
        <div>
          <Title>Simulación Diaria</Title>
          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
            Simulación con GSAP - Tiempos reales de vuelo
          </p>
        </div>
        <StatusBadge $status={isRunning ? 'running' : 'idle'}>
          {isRunning ? '● Ejecutando' : '○ Detenido'}
        </StatusBadge>
      </Header>

      <MapWrapper>
        {(isLoadingData || isInitializing) && (
          <LoadingOverlay>
            <Spinner />
            <LoadingText>
              {isLoadingData ? 'Cargando datos de vuelos...' : 'Ejecutando algoritmo inicial...'}
            </LoadingText>
          </LoadingOverlay>
        )}

        <SimulationControls>
          <div>
            <ClockLabel>Tiempo de Simulación</ClockLabel>
            <Clock>{formatSimDate(currentSimTime)}</Clock>
            <Clock style={{ marginTop: '8px', fontSize: '24px' }}>{formatSimTime(currentSimTime)}</Clock>
          </div>

          <StatsRow>
            <StatLine>
              <span>Día:</span>
              <strong>{dayCount + 1}</strong>
            </StatLine>
            <StatLine>
              <span>Instancias programadas:</span>
              <strong>{flightInstances.length}</strong>
            </StatLine>
            <StatLine>
              <span>Vuelos activos ahora:</span>
              <strong>{activeFlightsCount}</strong>
            </StatLine>
            <StatLine>
              <span>Ventana activa:</span>
              <strong>{windowMinutes} min</strong>
            </StatLine>
            {algorithmRunning && !isInitializing && (
              <AlgorithmBadge>
                Ejecutando algoritmo...
              </AlgorithmBadge>
            )}
          </StatsRow>

          <HintText>
            Recalculamos automáticamente la ventana fija de {windowMinutes} min, 30 segundos antes de
            agotarse y cada vez que se registra un pedido nuevo dentro de ese rango.
          </HintText>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {!isRunning && !isInitializing ? (
              <ControlButton
                $variant="play"
                onClick={handleStart}
                disabled={isLoadingData || algorithmRunning}
              >
                {isLoadingData ? 'Cargando...' : '▶ Iniciar Simulación'}
              </ControlButton>
            ) : isInitializing ? (
              <ControlButton disabled>
                Iniciando...
              </ControlButton>
            ) : (
              <>
                <ControlButton $variant="pause" onClick={handlePause}>
                  ⏸ Pausar
                </ControlButton>
                <ControlButton
                  onClick={() => enqueueImmediateRun()}
                  disabled={algorithmRunning}
                >
                   Recalcular ventana
                </ControlButton>
                <ControlButton
                  $variant="danger"
                  onClick={handleStop}
                  disabled={!isRunning && !currentSimTime}
                >
                  Detener
                </ControlButton>
              </>
            )}
          </div>
        </SimulationControls>

        <MapContainer
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          worldCopyJump={false}
          maxBounds={new L.LatLngBounds([
            [-90, -180],
            [90, 180],
          ])}
          maxBoundsViscosity={1.0}
          minZoom={3}
          maxZoom={8}
          zoomControl={true}
        >
          <Pane name="routes" style={{ zIndex: 400 }} />
          <Pane name="airports" style={{ zIndex: 500 }} />
          <Pane name="main-hubs" style={{ zIndex: 600 }} />

          <TileLayer attribution={tileAttribution} url={tileUrl} noWrap={true} />

          {/* Main warehouses */}
          {mainWarehouses.map((airport: any) => {
            const center: LatLngTuple = [
              parseFloat(airport.latitude),
              parseFloat(airport.longitude),
            ]
            const hubFill = '#f6b53b'
            const hubStroke = '#ebc725'

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

          {/* Airports */}
          {airports.map((airport: any) => (
            <CircleMarker
              key={airport.id}
              center={[parseFloat(airport.latitude), parseFloat(airport.longitude)]}
              radius={6}
              color="#14b8a6"
              fillColor="#14b8a6"
              fillOpacity={0.8}
              weight={2}
              pane="airports"
              eventHandlers={{
                click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div>
                  <strong>{airport.cityName}</strong>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    {airport.codeIATA || airport.alias}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Flight routes - show for selected flight and hovered preview */}
          {currentSimTime &&
            flightInstances
              .filter((f) => {
                if (selectedFlight && f.flightId === selectedFlight.id) return true
                if (hoveredFlightId !== null && f.flightId === hoveredFlightId) return true
                return false
              })
              .map((flight) => {
                const origin: LatLngTuple = [
                  flight.originAirport.latitude,
                  flight.originAirport.longitude,
                ]
                const destination: LatLngTuple = [
                  flight.destinationAirport.latitude,
                  flight.destinationAirport.longitude,
                ]
                const ctrl = computeControlPoint(origin, destination, 0.2)
                const samples = 30
                const arc: LatLngTuple[] = Array.from({ length: samples + 1 }, (_, i) => {
                  const t = i / samples
                  return bezierPoint(t, origin, ctrl, destination)
                })

                // Check if flight is currently active
                const dept = new Date(flight.departureTime)
                const arr = new Date(flight.arrivalTime)
                const isActive = currentSimTime >= dept && currentSimTime <= arr
                const isSelected = selectedFlight?.id === flight.flightId
                const isHovered = hoveredFlightId === flight.flightId && !isSelected

                return (
                  <Polyline
                    key={flight.id}
                    positions={arc}
                    color={isHovered ? '#3b82f6' : isActive ? '#10b981' : '#f59e0b'}
                    opacity={isHovered ? 0.85 : isActive ? 0.6 : 0.3}
                    weight={isSelected ? 3 : isHovered ? 2.5 : isActive ? 2 : 1}
                    pane="routes"
                  />
                )
              })}

          {/* GSAP Animated planes - Keep mounted if data exists, control via isPlaying */}
          {simulationStartDate && currentSimTime && (
            <AnimatedFlights
              flightInstances={flightInstances}
              simulationStartTime={simulationStartDate}
              currentSimTime={currentSimTime}
              isPlaying={isRunning}
              onFlightClick={handleFlightClick}
              onFlightHover={handleFlightHover}
              processedIdsRef={processedIdsRef}
              markersRef={markersRef}
            />
          )}
        </MapContainer>
      </MapWrapper>

      {/* Flight packages modal */}
      {selectedFlight && (
        <FlightPackagesModal
          flightId={selectedFlight.id}
          flightCode={selectedFlight.code}
          onClose={() => setSelectedFlight(null)}
        />
      )}

      {/* Airport Details Modal */}
      {selectedAirport && (
        <AirportDetailsModal
          airport={selectedAirport}
          onClose={() => setSelectedAirport(null)}
        />
      )}
    </Wrapper>
  )
}
