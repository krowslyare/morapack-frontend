import { useState, useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap, Pane } from 'react-leaflet'
import L, { type LatLngTuple, DivIcon, Marker } from 'leaflet'
import gsap from 'gsap'
import { useSimulationStore } from '../../store/useSimulationStore'
import { simulationService, type FlightStatus, type FlightInstance } from '../../api/simulationService'
import { useAirports } from '../../hooks/api/useAirports'
import { toast } from 'react-toastify'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'

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
  min-width: 280px;
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
  padding: 32px;
  border-radius: 16px;
  max-width: 500px;
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

// Helper to compute curved flight path
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
  playbackSpeed: number
  onFlightClick: (flight: FlightInstance) => void
}

function AnimatedFlights({
  flightInstances,
  simulationStartTime,
  currentSimTime,
  isPlaying,
  playbackSpeed,
  onFlightClick,
}: AnimatedFlightsProps) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const processedIdsRef = useRef<Set<string>>(new Set())
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
  const MAX_FLIGHTS = 200 // Increased for multi-day support

  // Initialize timeline once
  useEffect(() => {
    if (!map) return

    if (!timelineRef.current) {
      const timeline = gsap.timeline({ paused: true })
      timelineRef.current = timeline
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
        timelineRef.current = null
      }
      Object.values(markersRef.current).forEach((m) => {
        m.off()
        m.remove()
      })
      markersRef.current = {}
      processedIdsRef.current.clear()
    }
  }, [map])

  // Add new flight instances to timeline dynamically
  useEffect(() => {
    if (!map || !timelineRef.current || flightInstances.length === 0) return

    const timeline = timelineRef.current

    // Only process flights departing within the next 30 minutes to optimize performance
    // Older/future flights won't create markers until they're about to depart
    const thirttyMinutesFromNow = new Date(currentSimTime.getTime() + 30 * 60 * 1000)
    const thirtyMinutesAgo = new Date(currentSimTime.getTime() - 30 * 60 * 1000)

    // Find new instances that haven't been processed and are about to fly
    const newInstances = flightInstances
      .filter((f) => {
        const dept = new Date(f.departureTime)
        const arr = new Date(f.arrivalTime)
        // Include flights that: depart soon, are currently flying, or recently arrived (cleanup window)
        return (
          !processedIdsRef.current.has(f.id) &&
          dept <= thirttyMinutesFromNow &&
          arr >= thirtyMinutesAgo
        )
      })
      .slice(0, MAX_FLIGHTS - processedIdsRef.current.size)

    if (newInstances.length === 0) return

    console.log(`Adding ${newInstances.length} new flight animations to timeline`)

    newInstances.forEach((flight) => {
      // Mark as processed
      processedIdsRef.current.add(flight.id)

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
            marker.setOpacity(0.3) // Fade when arrived
            // Remove marker after some time to free memory
            setTimeout(() => {
              if (markersRef.current[flight.id]) {
                markersRef.current[flight.id].remove()
                delete markersRef.current[flight.id]
              }
            }, 60000) // Remove 1 minute after arrival
          },
        },
        startOffsetSeconds
      )
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

    // Seek to the current time in the timeline
    timelineRef.current.seek(elapsedSeconds, false)

    // Update play/pause state
    if (isPlaying) {
      timelineRef.current.play()
    } else {
      timelineRef.current.pause()
    }
  }, [currentSimTime, simulationStartTime, isPlaying])

  // Adjust timeline speed when playbackSpeed changes
  useEffect(() => {
    if (!timelineRef.current) return

    // Set the timeScale: at playbackSpeed 1, timeScale is 1
    // At playbackSpeed 60, timeScale should be 60 (timeline runs 60x faster)
    timelineRef.current.timeScale(playbackSpeed)
  }, [playbackSpeed])

  return null
}

export function DailySimulationPage() {
  const navigate = useNavigate()
  const { hasValidConfig, simulationStartDate } = useSimulationStore()

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [currentSimTime, setCurrentSimTime] = useState<Date | null>(simulationStartDate)
  const [dayCount, setDayCount] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1 = 1 sec sim per real sec, 60 = 1 min per sec, etc.

  // Data
  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [algorithmRunning, setAlgorithmRunning] = useState(false)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastAlgorithmDayRef = useRef(-1)

  // Load airports
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []

  // Store flight statuses for rolling window
  const flightStatusesRef = useRef<FlightStatus[]>([])

  // Load initial flight statuses and generate instances for 3 days
  const loadFlightData = useCallback(async () => {
    if (!simulationStartDate) return

    try {
      setIsLoadingData(true)
      console.log('Loading flight statuses from backend...')
      const response = await simulationService.getFlightStatuses()

      // Validate response structure
      if (!response) {
        console.error('getFlightStatuses returned null/undefined')
        toast.error('Error: respuesta del backend inválida')
        return
      }

      if (!response.flights || !Array.isArray(response.flights)) {
        console.error('getFlightStatuses returned invalid flights:', response)
        toast.error('Error: datos de vuelos inválidos')
        flightStatusesRef.current = []
        return
      }

      console.log(`Received ${response.flights.length} flight statuses from backend`)
      flightStatusesRef.current = response.flights

      // Validate airports
      if (!airports || airports.length === 0) {
        console.warn('No airports loaded yet, cannot generate instances')
        toast.warning('Esperando datos de aeropuertos...')
        return
      }

      // Generate flight instances for next 3 days (72 hours)
      // This ensures we have enough instances for midnight-crossing flights
      const instances = simulationService.generateFlightInstances(
        response.flights,
        simulationStartDate,
        72, // 72 hours = 3 days
        airports
      )

      console.log(`Generated ${instances.length} flight instances for 3 days`)
      setFlightInstances(instances)

      if (instances.length === 0) {
        toast.warning('No se generaron instancias de vuelo. Verifica los datos del backend.')
      }
    } catch (error) {
      console.error('Error loading flight data:', error)
      toast.error('Error al cargar vuelos')
      // Ensure ref is never undefined
      flightStatusesRef.current = []
    } finally {
      setIsLoadingData(false)
    }
  }, [airports, simulationStartDate])

  // Add instances for next day (rolling window)
  const addNextDayInstances = useCallback(() => {
    if (!simulationStartDate) {
      console.warn('Cannot add instances: no simulation start date')
      return
    }

    if (!flightStatusesRef.current || !Array.isArray(flightStatusesRef.current) || flightStatusesRef.current.length === 0) {
      console.warn('Cannot add instances: no flight statuses available')
      return
    }

    if (!airports || airports.length === 0) {
      console.warn('Cannot add instances: no airports available')
      return
    }

    setFlightInstances((current) => {
      const updated = simulationService.addNextDayInstances(
        flightStatusesRef.current,
        current,
        simulationStartDate,
        dayCount,
        airports
      )

      console.log(
        `Added instances for day ${dayCount + 1}. Total: ${updated.length} instances`
      )
      return updated
    })
  }, [airports, simulationStartDate, dayCount])

  // Run algorithm using CURRENT simulation time
  const runDailyAlgorithm = useCallback(async (simTime: Date) => {
    if (!simulationStartDate) return

    setAlgorithmRunning(true)
    try {
      // Use the current simulation time directly
      console.log(`Running algorithm at simulation time: ${simTime.toISOString()}`)
      const response = await simulationService.executeDaily({
        simulationStartTime: simTime.toISOString(),
        simulationDurationHours: 24, // 1 day
        useDatabase: true,
        simulationSpeed: playbackSpeed, // Pass the current playback speed to backend
      })

      // Validate algorithm response
      if (!response) {
        console.error('executeDaily returned null/undefined')
        toast.error('Error: respuesta del algoritmo inválida')
        return
      }

      const dayNumber = Math.floor(
        (simTime.getTime() - simulationStartDate.getTime()) / (24 * 60 * 60 * 1000)
      )
      console.log(`Day ${dayNumber} algorithm completed:`, response)
      toast.success(`Día ${dayNumber + 1}: ${response.assignedOrders || 0} órdenes asignadas`)

      // Reload flight statuses (for next day)
      console.log('Reloading flight statuses after algorithm...')
      const updatedResponse = await simulationService.getFlightStatuses()

      // Validate updated response
      if (!updatedResponse || !updatedResponse.flights || !Array.isArray(updatedResponse.flights)) {
        console.error('Failed to reload flight statuses:', updatedResponse)
        toast.warning('Advertencia: no se pudieron recargar los vuelos')
        return
      }

      console.log(`Reloaded ${updatedResponse.flights.length} flight statuses`)
      flightStatusesRef.current = updatedResponse.flights

      // Add instances for the next day using rolling window
      addNextDayInstances()
    } catch (error) {
      console.error('Error running algorithm:', error)
      toast.error('Error al ejecutar el algoritmo')
    } finally {
      setAlgorithmRunning(false)
    }
  }, [simulationStartDate, addNextDayInstances])

  // Simulation clock - advances by playbackSpeed * 1000ms every real second
  const startSimulationClock = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setCurrentSimTime((prev) => {
        if (!prev || !simulationStartDate) return prev

        // Add playbackSpeed simulation seconds (playbackSpeed * 1000 ms)
        const next = new Date(prev.getTime() + playbackSpeed * 1000)

        // Calculate which day we're on based on SIMULATION time
        const elapsedSimulationMs = next.getTime() - simulationStartDate.getTime()
        const newDay = Math.floor(elapsedSimulationMs / (24 * 60 * 60 * 1000))

        // Update day count
        setDayCount(newDay)

        // Trigger algorithm every 24 simulation hours (when day changes)
        if (newDay > lastAlgorithmDayRef.current && newDay > 0) {
          lastAlgorithmDayRef.current = newDay
          // Run algorithm with current simulation time
          runDailyAlgorithm(next)
        }

        return next
      })
    }, 1000) // Every real second
  }, [simulationStartDate, runDailyAlgorithm, playbackSpeed])

  // Start simulation
  const handleStart = useCallback(async () => {
    if (!hasValidConfig() || !simulationStartDate) {
      toast.error('Debes configurar la fecha en Planificación primero')
      return
    }

    setIsRunning(true)
    setCurrentSimTime(simulationStartDate)
    setDayCount(0)
    lastAlgorithmDayRef.current = -1

    // Load initial data
    await loadFlightData()

    // Run first algorithm with simulation start time
    await runDailyAlgorithm(simulationStartDate)

    // Start the clock
    startSimulationClock()
  }, [hasValidConfig, simulationStartDate, loadFlightData, runDailyAlgorithm, startSimulationClock])

  // Pause simulation
  const handlePause = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }

  // Stop simulation
  const handleStop = () => {
    handlePause()
    setCurrentSimTime(simulationStartDate)
    setDayCount(0)
    setFlightInstances([])
    lastAlgorithmDayRef.current = -1
  }

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

  // Handle flight click
  const handleFlightClick = (flight: FlightInstance) => {
    setSelectedFlight({ id: flight.flightId, code: flight.flightCode })
  }

  // Count active flights
  const activeFlightsCount = currentSimTime
    ? flightInstances.filter((f) => {
        const dept = new Date(f.departureTime)
        const arr = new Date(f.arrivalTime)
        return currentSimTime >= dept && currentSimTime <= arr
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
            {algorithmRunning && (
              <StatLine style={{ color: '#f59e0b' }}>
                <span>⏳ Ejecutando algoritmo...</span>
              </StatLine>
            )}
          </StatsRow>

          <SpeedControlContainer>
            <SpeedLabel>Velocidad de Reproducción</SpeedLabel>
            <SpeedButtonGroup>
              <SpeedButton
                $active={playbackSpeed === 1}
                onClick={() => setPlaybackSpeed(1)}
                disabled={isRunning || isLoadingData || algorithmRunning}
              >
                1x (1 seg)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 60}
                onClick={() => setPlaybackSpeed(60)}
                disabled={isRunning || isLoadingData || algorithmRunning}
              >
                60x (1 min)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 1800}
                onClick={() => setPlaybackSpeed(1800)}
                disabled={isRunning || isLoadingData || algorithmRunning}
              >
                30x min (30 min)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 3600}
                onClick={() => setPlaybackSpeed(3600)}
                disabled={isRunning || isLoadingData || algorithmRunning}
              >
                1h (1 hora)
              </SpeedButton>
            </SpeedButtonGroup>
            <SpeedHint>
              {playbackSpeed === 1 && '1 seg simulado = 1 seg real'}
              {playbackSpeed === 60 && '1 min simulado = 1 seg real'}
              {playbackSpeed === 1800 && '30 min simulados = 1 seg real'}
              {playbackSpeed === 3600 && '1 hora simulada = 1 seg real'}
            </SpeedHint>
          </SpeedControlContainer>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {!isRunning ? (
              <ControlButton
                $variant="play"
                onClick={handleStart}
                disabled={isLoadingData || algorithmRunning}
              >
                {isLoadingData ? 'Cargando...' : '▶ Iniciar Simulación'}
              </ControlButton>
            ) : (
              <>
                <ControlButton $variant="pause" onClick={handlePause}>
                  ⏸ Pausar
                </ControlButton>
                <ControlButton $variant="danger" onClick={handleStop}>
                  ⏹ Detener
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
          minZoom={2}
          maxZoom={6}
          zoomControl={true}
        >
          <Pane name="routes" style={{ zIndex: 400 }} />
          <Pane name="airports" style={{ zIndex: 500 }} />

          <TileLayer attribution={tileAttribution} url={tileUrl} noWrap={true} />

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

          {/* Flight routes - only show route for selected flight (performance optimization) */}
          {selectedFlight &&
            currentSimTime &&
            flightInstances
              .filter((f) => f.flightId === selectedFlight.id)
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

                return (
                  <Polyline
                    key={flight.id}
                    positions={arc}
                    color={isActive ? '#10b981' : '#f59e0b'}
                    opacity={isActive ? 0.6 : 0.3}
                    weight={isActive ? 2 : 1}
                    pane="routes"
                  />
                )
              })}

          {/* GSAP Animated planes */}
          {isRunning && simulationStartDate && currentSimTime && (
            <AnimatedFlights
              flightInstances={flightInstances}
              simulationStartTime={simulationStartDate}
              currentSimTime={currentSimTime}
              isPlaying={isRunning}
              playbackSpeed={playbackSpeed}
              onFlightClick={handleFlightClick}
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
    </Wrapper>
  )
}
