import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap, Pane } from 'react-leaflet'
import L, { type LatLngTuple, DivIcon, Marker } from 'leaflet'
import gsap from 'gsap'
import { useSimulationStore } from '../../store/useSimulationStore'
import { simulationService, type FlightStatus, type FlightInstance } from '../../api/simulationService'
import { useAirports } from '../../hooks/api/useAirports'
import { useOrders } from '../../hooks/api/useOrders'
import { toast } from 'react-toastify'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import { WeeklyKPICard } from '../../components/ui/WeeklyKPICard'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import { FlightDrawer } from '../WeeklySimulationPage/FlightDrawer'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import type { Continent } from '../../types/Continent'
import '../WeeklySimulationPage/index.css'

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

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
`

const ToggleSwitch = styled.div<{ $active: boolean }>`
  width: 40px;
  height: 22px;
  background: ${p => p.$active ? '#10b981' : '#d1d5db'};
  border-radius: 11px;
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${p => p.$active ? '20px' : '2px'};
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: left 0.2s ease;
  }
`

const ToggleHint = styled.div`
  font-size: 10px;
  color: #9ca3af;
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

const KPIPanel = styled.div`
  margin: 4px 0 8px;
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
  playbackSpeed: number
  onFlightClick: (flight: FlightInstance) => void
  onFlightHover: (flight: FlightInstance | null) => void
  instanceHasProducts: Record<string, number>
  showOnlyWithProducts: boolean
}

function AnimatedFlights({
  flightInstances,
  simulationStartTime,
  currentSimTime,
  isPlaying,
  playbackSpeed,
  onFlightClick,
  onFlightHover,
  processedIdsRef,
  markersRef,
  instanceHasProducts,
  showOnlyWithProducts,
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
        
        // ✅ Si toggle activo, filtrar vuelos sin productos
        const productCount = instanceHasProducts[f.instanceId] ?? 0
        const hasProducts = productCount > 0
        if (showOnlyWithProducts && !hasProducts) return false
        
        // Include flights that: depart soon, are currently flying, or recently arrived (cleanup window)
        return (
          !processedIdsRef.current.has(f.id) && // use f.id (string unique instance id)
          dept <= thirttyMinutesFromNow &&
          arr >= thirtyMinutesAgo
        )
      })
      // Prioritize flights with cargo to ensure they are visualized when concurrency limit is hit
      .sort((a, b) => {
        // ✅ Usar instanceHasProducts para priorizar
        const cargoA = instanceHasProducts[a.instanceId] ?? 0
        const cargoB = instanceHasProducts[b.instanceId] ?? 0

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
      
      // ✅ Verificar si tiene productos
      const productCount = instanceHasProducts[flight.instanceId] ?? 0
      const hasProducts = productCount > 0

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

      // Create marker with rotation - use loaded class if flight has products
      const planeHTML = `<img src="/airplane.png" alt="✈" style="width:20px;height:20px;display:block;transform-origin:50% 50%;transform:rotate(${adjustedInitialBearing}deg);transition:transform 0.3s linear;" />`
      const planeIcon = new DivIcon({
        className: hasProducts ? 'plane-icon plane-icon--loaded' : 'plane-icon plane-icon--empty',
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

  // Adjust timeline speed when playbackSpeed changes
  useEffect(() => {
    if (!timelineRef.current) return

    // Set the timeScale: at playbackSpeed 1, timeScale is 1
    // At playbackSpeed 60, timeScale should be 60 (timeline runs 60x faster)
    timelineRef.current.timeScale(playbackSpeed)
  }, [playbackSpeed])

  // Toggle visibility of markers based on showOnlyWithProducts
  useEffect(() => {
    // Iterate over existing markers and show/hide based on product status
    Object.entries(markersRef.current).forEach(([flightId, marker]) => {
      // Find the flight instance to get the instanceId
      const flight = flightInstances.find(f => f.id === flightId)
      if (!flight) return

      const productCount = instanceHasProducts[flight.instanceId] ?? 0
      const hasProducts = productCount > 0

      if (showOnlyWithProducts && !hasProducts) {
        // Hide markers for flights without products
        marker.setOpacity(0)
      } else {
        // Check if the flight is currently in-flight to show it
        const dept = new Date(flight.departureTime)
        const arr = new Date(flight.arrivalTime)
        if (currentSimTime >= dept && currentSimTime <= arr) {
          marker.setOpacity(1)
        }
        // If the flight hasn't departed yet or already arrived, keep it hidden (the timeline handles this)
      }
    })
  }, [showOnlyWithProducts, instanceHasProducts, flightInstances, currentSimTime, markersRef])

  return null
}

export function DailySimulationPage() {
  const navigate = useNavigate()
  const {
    hasValidConfig,
    simulationStartDate,
    isDailyRunning,
    dailyCurrentSimTime,
    dailyPlaybackSpeed,
    lastAlgorithmRunTime,
    nextAlgorithmRunTime,
    startDailySimulation,
    updateDailySimTime,
    setDailyPlaybackSpeed,
    stopDailySimulation,
    setLastAlgorithmRunTime,
    // Note: getAdjustedSimTime is accessed via useSimulationStore.getState() in callbacks
  } = useSimulationStore()

  // Simulation state (synced with global store for background persistence)
  // Convert timestamps from store back to Date objects
  const isRunning = isDailyRunning
  const currentSimTime = dailyCurrentSimTime ? new Date(dailyCurrentSimTime) : simulationStartDate
  const playbackSpeed = dailyPlaybackSpeed
  const lastAlgorithmTime = lastAlgorithmRunTime ? new Date(lastAlgorithmRunTime) : null
  const nextAlgorithmTime = nextAlgorithmRunTime ? new Date(nextAlgorithmRunTime) : null
  const [dayCount, setDayCount] = useState(0)

  // Data
  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)
  const [hoveredFlightId, setHoveredFlightId] = useState<number | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
  
  // ✅ Mapeo de instanceId -> cantidad de productos (del algoritmo)
  const [instanceHasProducts, setInstanceHasProducts] = useState<Record<string, number>>({})
  // ✅ Toggle para mostrar solo vuelos con productos
  const [showOnlyWithProducts, setShowOnlyWithProducts] = useState(false)
  // ✅ Panel lateral de vuelos
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'flights' | 'orders'>('flights')

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [algorithmRunning, setAlgorithmRunning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const [kpi, setKpi] = useState({
    totalOrders: 0,
    assignedOrders: 0,
    totalProducts: 0,
    assignedProducts: 0,
  })

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastAlgorithmDayRef = useRef(-1)
  const lastStateUpdateHourRef = useRef(-1)  // Tracks hourly state updates
  // Lifted refs for cleanup access
  const processedIdsRef = useRef<Set<string>>(new Set())
  const markersRef = useRef<Record<string, Marker>>({})
  // Track if we've already restored simulation on this mount
  const hasRestoredRef = useRef(false)
  // Track if clock is running to prevent duplicate intervals
  const isClockRunningRef = useRef(false)
  // Track if algorithm is running (ref to avoid stale closure in interval)
  const algorithmRunningRef = useRef(false)
  
  // Load airports (must be before refs that use airports)
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []
  
  // ✅ Refs to store latest values for stable callbacks (avoid stale closures)
  const simulationStartDateRef = useRef(simulationStartDate)
  const playbackSpeedRef = useRef(playbackSpeed)
  const airportsRef = useRef(airports)
  
  // Keep refs updated with latest values
  useEffect(() => { simulationStartDateRef.current = simulationStartDate }, [simulationStartDate])
  useEffect(() => { playbackSpeedRef.current = playbackSpeed }, [playbackSpeed])
  useEffect(() => { airportsRef.current = airports }, [airports])

  // Load orders for the simulation window (for FlightDrawer orders tab)
  const { 
    data: ordersData, 
    isLoading: loadingOrders 
  } = useOrders(
    simulationStartDate ? {
      // Load orders for current day + some buffer
      startDate: simulationStartDate.toISOString(),
      endDate: new Date(simulationStartDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    } : undefined,
    !!simulationStartDate && isDailyRunning
  )
  
  // Extract orders from query result
  const orders = useMemo(() => ordersData ?? [], [ordersData])

  // Store flight statuses for rolling window
  const flightStatusesRef = useRef<FlightStatus[]>([])

  // Load initial flight statuses and generate instances for 3 days
  const loadFlightData = useCallback(async () => {
    if (!simulationStartDate) return

    try {
      setIsLoadingData(true)
      console.log('Loading flight statuses from backend...')
      
      // ✅ Cargar vuelos e instancias asignadas en paralelo
      const [response, instancesResponse] = await Promise.all([
        simulationService.getFlightStatuses(),
        simulationService.getAssignedFlightInstances()
      ])

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

      // ✅ Guardar instancias con productos
      setInstanceHasProducts(instancesResponse.instances ?? {})
      console.log(`📦 Instancias con productos: ${Object.keys(instancesResponse.instances ?? {}).length}`)

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
  const addNextDayInstances = useCallback((targetDay?: number) => {
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
        // Use targetDay if provided, otherwise fallback to current dayCount
        // ensuring we generate for the correct upcoming day
        targetDay ?? dayCount,
        airports
      )

      console.log(
        `Added instances for day ${(targetDay ?? dayCount) + 1}. Total: ${updated.length} instances`
      )
      return updated
    })
  }, [airports, simulationStartDate, dayCount])

  // Run algorithm using CURRENT simulation time
  const runDailyAlgorithm = useCallback(async (simTime: Date) => {
    if (!simulationStartDate) return
    
    // Prevent duplicate runs
    if (algorithmRunningRef.current) {
      console.log('⚠️ Algorithm already running, skipping duplicate call')
      return
    }

    setAlgorithmRunning(true)
    algorithmRunningRef.current = true
    const algorithmStartTime = performance.now()

    // Calculate day number from the simulation time passed
    const dayNumber = Math.floor(
      (simTime.getTime() - simulationStartDate.getTime()) / (24 * 60 * 60 * 1000)
    )

    try {
      console.group(`%c📊 Algorithm Execution - Day ${dayNumber + 1}`, 'color: #14b8a6; font-weight: bold; font-size: 14px')
      console.log('Simulation time:', simTime.toISOString())
      console.log('Playback speed:', `${playbackSpeed}x`)

      // Daily Simulation uses 10-minute timeframe (not 24 hours like Weekly)
      const TIMEFRAME_MINUTES = 10
      const durationHours = TIMEFRAME_MINUTES / 60  // 0.1667 hours

      // Format sim time as LOCAL time (not UTC) to match data file format
      const year = simTime.getFullYear()
      const month = String(simTime.getMonth() + 1).padStart(2, '0')
      const day = String(simTime.getDate()).padStart(2, '0')
      const hours = String(simTime.getHours()).padStart(2, '0')
      const minutes = String(simTime.getMinutes()).padStart(2, '0')
      const seconds = String(simTime.getSeconds()).padStart(2, '0')
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

      // STEP 1: Refresh orders from files (loads new ones, skips duplicates)
      console.log('📦 Refreshing orders from files...')
      try {
        const refreshResponse = await simulationService.refreshOrdersForDaily(localTimeString)
        if (refreshResponse.success) {
          console.log(`✅ Orders refreshed: ${refreshResponse.statistics.ordersCreated} new, ${refreshResponse.statistics.duplicatesSkipped} skipped`)
        }
      } catch (refreshErr) {
        console.warn('⚠️ Could not refresh orders from files:', refreshErr)
        // Continue with algorithm anyway - manual orders are already in DB
      }

      // STEP 2: Execute algorithm
      console.log('Request:', {
        simulationStartTime: localTimeString,
        simulationDurationHours: durationHours,
        useDatabase: true,
        simulationSpeed: playbackSpeed,
      })

      const response = await simulationService.executeDaily({
        simulationStartTime: localTimeString,
        simulationDurationHours: durationHours,
        useDatabase: true,
        simulationSpeed: playbackSpeed,
      })

      const algorithmDuration = (performance.now() - algorithmStartTime) / 1000

      // Validate algorithm response
      if (!response) {
        console.error('executeDaily returned null/undefined')
        console.groupEnd()
        toast.error('Error: respuesta del algoritmo inválida')
        return
      }

      // Log detailed response
      console.log('Response received:', {
        success: response.success,
        executionTimeSeconds: response.executionTimeSeconds,
        totalOrders: response.totalOrders,
        assignedOrders: response.assignedOrders,
        unassignedOrders: response.unassignedOrders,
        totalProducts: response.totalProducts,
        assignedProducts: response.assignedProducts,
        unassignedProducts: response.unassignedProducts,
        score: response.score,
      })

      console.log('Frontend received response in:', `${algorithmDuration.toFixed(2)}s`)
      console.log('Message:', response.message)
      console.groupEnd()

      toast.success(`Día ${dayNumber + 1}: ${response.assignedOrders || 0} órdenes asignadas`)

      // Update last algorithm run time for 10-min window tracking
      setLastAlgorithmRunTime(simTime)

      // Update KPIs with current totals from this run
      // Use functional update to accumulate properly across multiple runs
      setKpi(prev => {
        const newTotalOrders = response.totalOrders || 0
        const newTotalProducts = response.totalProducts || 0
        const newAssignedOrders = response.assignedOrders || 0
        const newAssignedProducts = response.assignedProducts || 0
        
        // If this is first run (prev is 0), just set the values
        // Otherwise, add the new assignments to previous totals
        const isFirstRun = prev.totalOrders === 0 && prev.totalProducts === 0
        
        if (isFirstRun) {
          return {
            totalOrders: newTotalOrders,
            assignedOrders: newAssignedOrders,
            totalProducts: newTotalProducts,
            assignedProducts: newAssignedProducts,
          }
        }
        
        // For subsequent runs, accumulate the totals and assignments
        return {
          totalOrders: prev.totalOrders + newTotalOrders,
          assignedOrders: prev.assignedOrders + newAssignedOrders,
          totalProducts: prev.totalProducts + newTotalProducts,
          assignedProducts: prev.assignedProducts + newAssignedProducts,
        }
      })

      // Cleanup processedIdsRef periodically to prevent memory leak over many days
      // We can safely clear IDs of flights that have definitely finished
      // This simple approach clears IDs when we load a new day, assuming old flights are done/removed by GSAP cleanup
      if (processedIdsRef.current.size > 1000) {
        processedIdsRef.current.clear()
        // We need to re-add currently active marker IDs so we don't duplicate them
        Object.keys(markersRef.current).forEach(id => processedIdsRef.current.add(id))
      }

      // Reload flight statuses (for next day)
      console.log('📍 Reloading flight statuses from database...')
      const updatedResponse = await simulationService.getFlightStatuses()

      // Validate updated response
      if (!updatedResponse || !updatedResponse.flights || !Array.isArray(updatedResponse.flights)) {
        console.error('Failed to reload flight statuses:', updatedResponse)
        toast.warning('Advertencia: no se pudieron recargar los vuelos')
        return
      }

      console.log(`✈️ Loaded ${updatedResponse.flights.length} active flights`)
      console.log('Flight statistics:', updatedResponse.statistics)

      flightStatusesRef.current = updatedResponse.flights

      // Add instances for the next day using rolling window
      // Pass dayNumber explicitly to ensure we generate for the correct day
      addNextDayInstances(dayNumber)
    } catch (error) {
      const errorDuration = (performance.now() - algorithmStartTime) / 1000
      console.error(`❌ Algorithm error (after ${errorDuration.toFixed(2)}s):`, error)
      toast.error('Error al ejecutar el algoritmo')
    } finally {
      setAlgorithmRunning(false)
      algorithmRunningRef.current = false
    }
  }, [simulationStartDate, addNextDayInstances, playbackSpeed])

  // ✅ Ref to store runDailyAlgorithm for stable access in interval
  const runDailyAlgorithmRef = useRef(runDailyAlgorithm)
  useEffect(() => { runDailyAlgorithmRef.current = runDailyAlgorithm }, [runDailyAlgorithm])

  // Simulation clock - advances by playbackSpeed * 1000ms every real second
  // ✅ STABLE: Uses refs instead of dependencies to avoid re-creating the function
  const startSimulationClock = useCallback(() => {
    // Prevent duplicate intervals
    if (isClockRunningRef.current) {
      console.log('⚠️ Clock already running, skipping duplicate start')
      return
    }
    
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    isClockRunningRef.current = true
    console.log('🕐 Starting simulation clock')

    intervalRef.current = setInterval(() => {
      // ✅ Read current values from refs to avoid stale closures
      const currentPlaybackSpeed = playbackSpeedRef.current
      const currentSimStartDate = simulationStartDateRef.current
      
      // Use updater function to get current state, avoiding stale closures
      updateDailySimTime((prev: number | null) => {
        if (!prev && !currentSimStartDate) return null

        const currentTime = prev ? new Date(prev) : currentSimStartDate!
        const next = new Date(currentTime.getTime() + currentPlaybackSpeed * 1000)

        // Calculate which day we're on based on SIMULATION time
        const elapsedSimulationMs = next.getTime() - currentSimStartDate!.getTime()
        const elapsedHours = elapsedSimulationMs / (1000 * 60 * 60)
        const currentDay = Math.floor(elapsedHours / 24)
        const hourOfDay = elapsedHours % 24

        // Update day count (UI display)
        setDayCount(currentDay)

        // Check if it's time to refresh (10-min window)
        // This handles new orders added via Envíos tab
        // Read directly from store to avoid stale closure
        const currentNextAlgorithmTime = useSimulationStore.getState().nextAlgorithmRunTime
        const currentLastAlgorithmTime = useSimulationStore.getState().lastAlgorithmRunTime
        
        if (currentLastAlgorithmTime && currentNextAlgorithmTime) {
          const nextAlgoDate = new Date(currentNextAlgorithmTime)
          if (next >= nextAlgoDate && !algorithmRunningRef.current) {
            console.log('⏰ Refresh window reached - re-running algorithm for new orders')

            // Re-run algorithm with current simulation time
            // Note: runDailyAlgorithm already calls setLastAlgorithmRunTime internally
            // which also updates nextAlgorithmRunTime
            runDailyAlgorithmRef.current(next)

            // Still update time even if algorithm is running
            return next
          }
        }

        // Update package states every hour of simulation time
        // This allows packages to transition smoothly: IN_TRANSIT → ARRIVED → DELIVERED
        const currentHour = Math.floor(next.getTime() / (1000 * 60 * 60))
        const lastUpdateHour = lastStateUpdateHourRef.current
        
        if (currentHour > lastUpdateHour) {
          console.log(`🔄 Updating package states at ${next.toLocaleTimeString()} (Hour ${hourOfDay})`)
          lastStateUpdateHourRef.current = currentHour
          simulationService.updateStates({
            currentTime: next.toISOString()
          }).then(response => {
            if (response.transitions.total > 0) {
              console.log('✅ States updated:', response.transitions)
            }
          }).catch(err => console.error('Failed to update states:', err))
        }

        // Trigger algorithm pre-calculation logic for next day
        // Calculate dynamic trigger threshold based on playback speed
        const REAL_TIME_BUFFER_SEC = 35
        const simSecondsBuffer = REAL_TIME_BUFFER_SEC * currentPlaybackSpeed
        const simHoursBuffer = simSecondsBuffer / 3600

        // Determine the hour of the day to trigger the next calculation
        let triggerHour = 24 - simHoursBuffer
        triggerHour = Math.max(1, Math.min(22, triggerHour))

        // If we are past the trigger hour, prepare next day
        if (hourOfDay >= triggerHour) {
          const targetRunDay = currentDay + 1

          // Only run if we haven't run for this target day yet
          if (targetRunDay > lastAlgorithmDayRef.current && !algorithmRunningRef.current) {
            console.log(`⏰ Pre-loading algorithm for Day ${targetRunDay + 1} (Trigger Hour: ${triggerHour.toFixed(1)})`)
            lastAlgorithmDayRef.current = targetRunDay

            // Calculate the target date for the algorithm (Midnight of the target day)
            const targetDate = new Date(currentSimStartDate!.getTime() + targetRunDay * 24 * 60 * 60 * 1000)
            runDailyAlgorithmRef.current(targetDate)
          }
        }

        return next
      })
    }, 1000) // Every real second
  }, [updateDailySimTime])  // ✅ Minimal stable dependencies

  // Start simulation
  const handleStart = useCallback(async () => {
    if (!hasValidConfig() || !simulationStartDate) {
      toast.error('Debes configurar la fecha en Planificación primero')
      return
    }

    // Clear previous state to ensure clean start
    processedIdsRef.current.clear()
    // Clear any existing markers in case they weren't cleaned up
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    setIsInitializing(true)
    setDayCount(0)
    lastAlgorithmDayRef.current = -1
    lastStateUpdateHourRef.current = -1  // Reset hourly state tracker
    hasRestoredRef.current = true  // Mark as "restored" since we're starting fresh
    
    // Reset KPIs for fresh start (will be set by first algorithm run)
    setKpi({
      totalOrders: 0,
      assignedOrders: 0,
      totalProducts: 0,
      assignedProducts: 0,
    })

    try {
      // ✅ STEP 1: Auto-load orders from files to database
      console.log('📦 Loading orders for Daily Simulation...')
      toast.info('Cargando datos de órdenes en BD...')

      // Format date as local time (NOT UTC) to match file data format
      // Files have orders in local time format (YYYYMMDD-HH-MM)
      const year = simulationStartDate.getFullYear()
      const month = String(simulationStartDate.getMonth() + 1).padStart(2, '0')
      const day = String(simulationStartDate.getDate()).padStart(2, '0')
      const hours = String(simulationStartDate.getHours()).padStart(2, '0')
      const minutes = String(simulationStartDate.getMinutes()).padStart(2, '0')
      const seconds = String(simulationStartDate.getSeconds()).padStart(2, '0')

      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      console.log('Local time string:', localTimeString)

      const loadResponse = await simulationService.loadForDailySimulation(
        localTimeString
      )

      if (!loadResponse.success) {
        throw new Error(loadResponse.message || 'Failed to load orders')
      }

      console.log('✅ Orders loaded:', {
        ordersCreated: loadResponse.statistics.ordersCreated,
        timeWindow: loadResponse.timeWindow,
      })

      toast.success(
        `Cargados: ${loadResponse.statistics.ordersCreated} órdenes (${loadResponse.timeWindow.durationMinutes} min)`
      )

      // STEP 2: Load flight data (existing)
      console.log('✈️ Loading flight data...')
      await loadFlightData()

      // STEP 3: Run first algorithm with simulation start time (existing)
      console.log('🚀 Running initial algorithm...')
      await runDailyAlgorithm(simulationStartDate)

      // STEP 4: Start simulation in global store (existing)
      startDailySimulation(simulationStartDate, playbackSpeed)

      // STEP 5: Start the clock (existing)
      startSimulationClock()

      console.log('✅ Daily Simulation started successfully')
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast.error('Error al iniciar la simulación: ' + (error as Error).message)
    } finally {
      setIsInitializing(false)
    }
  }, [hasValidConfig, simulationStartDate, loadFlightData, runDailyAlgorithm, startSimulationClock, playbackSpeed, startDailySimulation])

  // Pause simulation (keeps running in background)
  const handlePause = () => {
    // Only pause the local interval, don't stop the global state
    // This allows simulation to continue in background when user switches tabs
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    isClockRunningRef.current = false  // Allow restart
  }

  // Stop simulation (stops background execution)
  const handleStop = () => {
    handlePause()
    stopDailySimulation() // Stop global background state
    setDayCount(0)
    setFlightInstances([])
    lastAlgorithmDayRef.current = -1
    lastStateUpdateHourRef.current = -1  // Reset hourly state tracker
    hasRestoredRef.current = false  // Allow restore on next run
    algorithmRunningRef.current = false
    isClockRunningRef.current = false
    setKpi({
      totalOrders: 0,
      assignedOrders: 0,
      totalProducts: 0,
      assignedProducts: 0,
    })

    // Clean up refs
    processedIdsRef.current.clear()
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}
  }

  // ============================================================
  // RESTORE SIMULATION - Called once on mount if simulation was running
  // ✅ REFACTORED: Using refs and reading store directly to avoid dependency loops
  // ============================================================
  
  // Single useEffect: try to restore on mount, cleanup on unmount
  // ✅ Empty dependencies = runs exactly once on mount
  useEffect(() => {
    const tryRestore = async () => {
      // Guard: only restore once per mount
      if (hasRestoredRef.current) return
      
      // Read current values from store directly (not from props/state which might be stale on mount)
      const storeState = useSimulationStore.getState()
      const { isDailyRunning, simulationStartDate: storeSimStartDate, dailyCurrentSimTime } = storeState
      
      if (!isDailyRunning || !storeSimStartDate || !dailyCurrentSimTime) return
      
      // Wait for airports if not loaded yet
      const currentAirports = airportsRef.current
      if (!currentAirports || currentAirports.length === 0) {
        console.log('⏳ Waiting for airports to load before restore...')
        return  // Will retry via airport useEffect
      }
      
      hasRestoredRef.current = true
      console.log('🔄 Restoring Daily Simulation...')

      try {
        setIsLoadingData(true)
        
        const simStartDate = typeof storeSimStartDate === 'number' 
          ? new Date(storeSimStartDate) 
          : storeSimStartDate

        // Get adjusted time (accounts for real time passed while away)
        const adjustedSimTime = storeState.getAdjustedSimTime()
        if (!adjustedSimTime) return

        const adjustedDate = new Date(adjustedSimTime)
        console.log(`   Adjusted sim time: ${adjustedDate.toLocaleString()}`)

        // Update the store with the adjusted time
        updateDailySimTime(adjustedDate)

        // Calculate current day
        const elapsedMs = adjustedDate.getTime() - simStartDate.getTime()
        const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
        setDayCount(elapsedDays)
        lastAlgorithmDayRef.current = elapsedDays
        lastStateUpdateHourRef.current = Math.floor(adjustedDate.getTime() / (1000 * 60 * 60))

        // Load flight data
        const [response, instancesResponse] = await Promise.all([
          simulationService.getFlightStatuses(),
          simulationService.getAssignedFlightInstances()
        ])

        if (!response?.flights || !Array.isArray(response.flights)) {
          console.error('Failed to load flight data on restore')
          return
        }

        flightStatusesRef.current = response.flights
        setInstanceHasProducts(instancesResponse.instances ?? {})

        // Generate flight instances
        const instances = simulationService.generateFlightInstances(
          response.flights,
          simStartDate,
          elapsedDays + 2,
          currentAirports
        )
        setFlightInstances(instances)
        console.log(`✈️ Restored ${instances.length} flight instances`)

        // Start the clock
        startSimulationClock()
        console.log('✅ Daily Simulation restored')

      } catch (error) {
        console.error('Error restoring simulation:', error)
        toast.error('Error al restaurar la simulación')
      } finally {
        setIsLoadingData(false)
      }
    }
    
    tryRestore()

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      isClockRunningRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // ✅ Empty deps = run once on mount
  
  // ✅ Retry restore when airports load (only if we haven't restored yet)
  useEffect(() => {
    if (airports.length > 0 && !hasRestoredRef.current) {
      // Trigger restore attempt now that airports are available
      const storeState = useSimulationStore.getState()
      if (storeState.isDailyRunning && storeState.simulationStartDate && storeState.dailyCurrentSimTime) {
        console.log('📍 Airports loaded, attempting restore...')
        // Need to re-run the restore logic - we'll call a simpler version
        const doRestore = async () => {
          hasRestoredRef.current = true
          setIsLoadingData(true)
          
          try {
            const simStartDate = typeof storeState.simulationStartDate === 'number' 
              ? new Date(storeState.simulationStartDate) 
              : storeState.simulationStartDate!
              
            const adjustedSimTime = storeState.getAdjustedSimTime()
            if (!adjustedSimTime) return
            
            const adjustedDate = new Date(adjustedSimTime)
            updateDailySimTime(adjustedDate)
            
            const elapsedMs = adjustedDate.getTime() - simStartDate.getTime()
            const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
            setDayCount(elapsedDays)
            lastAlgorithmDayRef.current = elapsedDays
            lastStateUpdateHourRef.current = Math.floor(adjustedDate.getTime() / (1000 * 60 * 60))
            
            const [response, instancesResponse] = await Promise.all([
              simulationService.getFlightStatuses(),
              simulationService.getAssignedFlightInstances()
            ])
            
            if (response?.flights && Array.isArray(response.flights)) {
              flightStatusesRef.current = response.flights
              setInstanceHasProducts(instancesResponse.instances ?? {})
              
              const instances = simulationService.generateFlightInstances(
                response.flights,
                simStartDate,
                elapsedDays + 2,
                airports
              )
              setFlightInstances(instances)
              startSimulationClock()
              console.log('✅ Daily Simulation restored (after airports loaded)')
            }
          } finally {
            setIsLoadingData(false)
          }
        }
        doRestore()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airports.length])  // ✅ Only depend on airports.length to avoid loops

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

      <KPIPanel>
        <KPIPanelHeader>
          <KPIPanelTitle>Indicadores del día</KPIPanelTitle>
          <KPIPanelSubtitle>
            Día {dayCount + 1}
          </KPIPanelSubtitle>
        </KPIPanelHeader>

        <KPIContainer>
          <WeeklyKPICard label="Total Productos" value={kpi.totalProducts} />
          <WeeklyKPICard label="Productos Asignados" value={kpi.assignedProducts} />
          <WeeklyKPICard label="Vuelos Activos" value={activeFlightsCount} />
        </KPIContainer>
      </KPIPanel>

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
            {algorithmRunning && !isInitializing && (
              <AlgorithmBadge>
                Ejecutando algoritmo...
              </AlgorithmBadge>
            )}
          </StatsRow>
          {/* 
          <SpeedControlContainer>
            <SpeedLabel>Velocidad de Reproducción</SpeedLabel>
            <SpeedButtonGroup>
              <SpeedButton
                $active={playbackSpeed === 1}
                onClick={() => setDailyPlaybackSpeed(1)}
                disabled={isRunning || isLoadingData || algorithmRunning || isInitializing}
              >
                1x (1 seg)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 60}
                onClick={() => setDailyPlaybackSpeed(60)}
                disabled={isRunning || isLoadingData || algorithmRunning || isInitializing}
              >
                60x (1 min)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 300}
                onClick={() => setDailyPlaybackSpeed(300)}
                disabled={isRunning || isLoadingData || algorithmRunning || isInitializing}
              >
                300x (5 min)
              </SpeedButton>
              <SpeedButton
                $active={playbackSpeed === 600}
                onClick={() => setDailyPlaybackSpeed(600)}
                disabled={isRunning || isLoadingData || algorithmRunning || isInitializing}
              >
                600x (10 min)
              </SpeedButton>
            </SpeedButtonGroup>
            <SpeedHint>
              {playbackSpeed === 1 && '1 seg simulado = 1 seg real'}
              {playbackSpeed === 60 && '1 min simulado = 1 seg real'}
              {playbackSpeed === 300 && '5 min simulados = 1 seg real'}
              {playbackSpeed === 600 && '10 min simulados = 1 seg real'}
            </SpeedHint>
          </SpeedControlContainer>

  */}
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
                  $variant="danger"
                  onClick={handleStop}
                  disabled={!isRunning && !currentSimTime}
                >
                  Detener
                </ControlButton>
              </>
            )}
          </div>
          
          {/* Toggle para mostrar solo vuelos con productos - igual que Weekly */}
          <ToggleContainer>
            <ToggleLabel onClick={() => setShowOnlyWithProducts(!showOnlyWithProducts)}>
              <ToggleSwitch $active={showOnlyWithProducts} />
              <span>Solo vuelos con carga</span>
            </ToggleLabel>
            <ToggleHint>
              {showOnlyWithProducts 
                ? 'Mostrando solo vuelos con paquetes asignados'
                : 'Mostrando todos los vuelos'}
            </ToggleHint>
          </ToggleContainer>
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
          maxZoom={7}
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
              playbackSpeed={playbackSpeed}
              onFlightClick={handleFlightClick}
              onFlightHover={handleFlightHover}
              processedIdsRef={processedIdsRef}
              markersRef={markersRef}
              instanceHasProducts={instanceHasProducts}
              showOnlyWithProducts={showOnlyWithProducts}
            />
          )}
        </MapContainer>
      </MapWrapper>

      {/* Flight Drawer Panel - same as WeeklySimulationPage */}
      {simulationStartDate && (
        <FlightDrawer
          isOpen={panelOpen}
          onToggle={() => setPanelOpen(!panelOpen)}
          panelTab={panelTab}
          onTabChange={setPanelTab}
          flightInstances={flightInstances}
          instanceHasProducts={instanceHasProducts}
          simulationStartTime={simulationStartDate}
          activeFlightsCount={flightInstances.filter(f => {
            if (!currentSimTime) return false
            const dept = new Date(f.departureTime)
            const arr = new Date(f.arrivalTime)
            return currentSimTime >= dept && currentSimTime <= arr
          }).length}
          onFlightClick={(f) => handleFlightClick(f)}
          orders={orders}
          loadingOrders={loadingOrders}
        />
      )}

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
