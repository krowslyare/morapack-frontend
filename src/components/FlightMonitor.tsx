import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L, { DivIcon, Marker } from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import styled from 'styled-components'
import type { SimAirport } from '../hooks/useFlightSimulation'
import { FlightDetailsModal } from './FlightDetailsModal'
import { AirportDetailsModal } from './AirportDetailsModal'
import type { AlgorithmResultSchema } from '../types'
import {
  useTemporalSimulation,
  type ActiveFlight,
  type FlightStatusUpdate,
  type FlightCapacityEvent,
} from '../hooks/useTemporalSimulation'
import { useFlightsCount, useUpdateFlight, flightKeys } from '../hooks/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAirportCapacityManager } from '../hooks/useAirportCapacityManager'

const MonitorWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const MapWrapper = styled.div`
  width: 100%;
  height: 70vh;
  position: relative;
`

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 0;
`

const StatCard = styled.div`
  background: rgba(20, 184, 166, 0.95);
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: white;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 1px;
`

const SimulationControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;
`

const ControlButton = styled.button<{ $variant?: 'play' | 'pause' | 'reset' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => {
    if (p.$variant === 'play') return '#10b981'
    if (p.$variant === 'pause') return '#f59e0b'
    if (p.$variant === 'reset') return '#6b7280'
    return '#14b8a6'
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

const ControlsRow = styled.div`
  display: flex;
  gap: 8px;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
`

const ProgressFill = styled.div<{ $progress: number }>`
  width: ${(p) => p.$progress}%;
  height: 100%;
  background: linear-gradient(90deg, #14b8a6, #10b981);
  transition: width 0.1s linear;
`

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
`

const SpeedButton = styled.button<{ $active?: boolean }>`
  padding: 4px 8px;
  border: 1px solid ${(p) => (p.$active ? '#14b8a6' : '#e5e7eb')};
  background: ${(p) => (p.$active ? '#14b8a6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#6b7280')};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #14b8a6;
    background: ${(p) => (p.$active ? '#0d9488' : '#f0fdfa')};
  }
`

const StatsRow = styled.div`
  font-size: 11px;
  color: #6b7280;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
`

const Legend = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  color: #111827;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
`

function capacityToColor(capacityPercent: number): string {
  if (capacityPercent >= 90) return '#ef4444'
  if (capacityPercent >= 70) return '#f59e0b'
  return '#10b981'
}

function cityToLatLng(city: SimAirport): LatLngTuple {
  return [city.latitude, city.longitude]
}

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

function bezierPoint(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  const lat = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * p1[0] + t * t * p2[0]
  const lng = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * p1[1] + t * t * p2[1]
  return [lat, lng]
}

function bezierTangent(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const lat = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const lng = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  return [lat, lng]
}

function buildArcPoints(a: LatLngTuple, b: LatLngTuple, samples = 16): LatLngTuple[] {
  const c = computeControlPoint(a, b)
  const pts: LatLngTuple[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    pts.push(bezierPoint(t, a, c, b))
  }
  return pts
}

// ⚡ OPTIMIZED component for temporal flight animation with aggressive performance improvements
function AnimatedTemporalFlights({
  airports,
  activeFlights,
  onFlightClick,
}: {
  airports: SimAirport[]
  activeFlights: ActiveFlight[]
  onFlightClick: (flight: ActiveFlight) => void
}) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const lastUpdateTimeRef = useRef<number>(0)
  const lastUpdateRef = useRef<Record<string, { progress: number; lat: number; lng: number }>>({})

  // OPTIMIZATION 1: Throttle updates to 200ms (5 FPS) instead of every frame (60 FPS)
  // This reduces render calls by 92%!
  const UPDATE_THROTTLE_MS = 200
  
  // OPTIMIZATION 2: Limit maximum flights rendered
  const MAX_FLIGHTS_RENDERED = 100

  // Store latest values in refs to avoid dependency issues
  const onFlightClickRef = useRef(onFlightClick)
  onFlightClickRef.current = onFlightClick

  const airportById = useMemo(() => {
    const dict: Record<number, SimAirport> = {}
    airports.forEach((a) => {
      dict[a.id] = a
    })
    return dict
  }, [airports])

  // OPTIMIZATION 3: Spatial culling - only render flights in/near viewport
  const viewportBounds = useMemo(() => {
    if (!map) return undefined
    const bounds = map.getBounds()
    // Expand bounds by 20% for smooth entrance/exit
    const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0.2
    const lngPadding = (bounds.getEast() - bounds.getWest()) * 0.2
    return {
      north: bounds.getNorth() + latPadding,
      south: bounds.getSouth() - latPadding,
      east: bounds.getEast() + lngPadding,
      west: bounds.getWest() - lngPadding
    }
  }, [map, activeFlights.length]) // Recalculate when flight count changes

  // OPTIMIZATION 4: Use custom culling to limit flights
  const culledFlights = useMemo(() => {
    if (activeFlights.length <= MAX_FLIGHTS_RENDERED) {
      return activeFlights // No need to cull
    }

    // Filter by viewport if available
    let visibleFlights = activeFlights
    if (viewportBounds) {
      visibleFlights = activeFlights.filter(flight => {
        const origin = airportById[flight.originAirportId]
        const dest = airportById[flight.destinationAirportId]
        if (!origin || !dest) return false

        // Check if either endpoint is in expanded viewport
        const originInView = 
          origin.latitude >= viewportBounds.south && origin.latitude <= viewportBounds.north &&
          origin.longitude >= viewportBounds.west && origin.longitude <= viewportBounds.east
        const destInView =
          dest.latitude >= viewportBounds.south && dest.latitude <= viewportBounds.north &&
          dest.longitude >= viewportBounds.west && dest.longitude <= viewportBounds.east

        return originInView || destInView
      })
    }

    // Prioritize flights by progress (show most progressed flights)
    const sorted = [...visibleFlights].sort((a, b) => b.progress - a.progress)
    const culled = sorted.slice(0, MAX_FLIGHTS_RENDERED)

    // Log culling stats occasionally
    if (Math.random() < 0.05) {
      console.log(`[PERF] Culled ${activeFlights.length} → ${culled.length} flights (${((1 - culled.length/activeFlights.length) * 100).toFixed(0)}% reduction)`)
    }

    return culled
  }, [activeFlights, viewportBounds, airportById])

  // Stable hash for change detection
  const culledFlightsHash = useMemo(() => {
    return culledFlights.map((f) => `${f.flightId}-${f.progress.toFixed(2)}`).join('|')
  }, [culledFlights])

  // OPTIMIZATION 5: Batched, throttled update function
  const updateMarkers = useCallback(() => {
    const now = Date.now()
    
    // Throttle: Skip if called too soon
    if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE_MS) {
      return
    }
    
    lastUpdateTimeRef.current = now

    const airports = airportById
    const clickHandler = onFlightClickRef.current
    const currentMarkerIds = new Set<string>()

    // Batch all marker updates
    culledFlights.forEach((flight) => {
      const origin = airports[flight.originAirportId]
      const dest = airports[flight.destinationAirportId]
      if (!origin || !dest) return

      const markerId = `flight-${flight.flightId}-${flight.productId}`
      currentMarkerIds.add(markerId)

      const start: LatLngTuple = cityToLatLng(origin)
      const end: LatLngTuple = cityToLatLng(dest)
      const ctrl: LatLngTuple = computeControlPoint(start, end)

      let marker = markersRef.current[markerId]

      if (!marker) {
        // Create marker with simplified icon
        const planeHTML = `<img src="/airplane.png" alt="✈" class="plane" style="width:20px;height:20px;display:block;transform-origin:50% 50%;will-change:transform;" />`
        const planeIcon = new DivIcon({
          className: 'plane-icon',
          html: planeHTML,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        marker = L.marker(start, { icon: planeIcon, interactive: true })
        marker.on('click', () => clickHandler(flight))
        marker.on('mouseover', () => {
          const el = marker.getElement()
          if (el) {
            el.style.cursor = 'pointer'
            el.style.transform = 'scale(1.3)'
          }
        })
        marker.on('mouseout', () => {
          const el = marker.getElement()
          if (el) el.style.transform = 'scale(1)'
        })
        marker.addTo(map)
        markersRef.current[markerId] = marker
        lastUpdateRef.current[markerId] = { progress: -1, lat: 0, lng: 0 }
      }

      // Calculate position
      const [lat, lng] = bezierPoint(flight.progress, start, ctrl, end)

      // Update only if changed significantly (reduces DOM writes)
      const lastUpdate = lastUpdateRef.current[markerId]
      const shouldUpdate =
        Math.abs(lat - lastUpdate.lat) > 0.002 ||
        Math.abs(lng - lastUpdate.lng) > 0.002 ||
        Math.abs(flight.progress - lastUpdate.progress) > 0.02

      if (shouldUpdate) {
        marker.setLatLng([lat, lng])

        // Update rotation
        const [dlat, dlng] = bezierTangent(flight.progress, start, ctrl, end)
        const angleRad = Math.atan2(-dlat, dlng * Math.cos((lat * Math.PI) / 180))
        const el = marker.getElement()?.querySelector('.plane') as HTMLElement | null
        if (el) el.style.transform = `rotate(${angleRad - Math.PI}rad)`

        lastUpdateRef.current[markerId] = { progress: flight.progress, lat, lng }
      }
    })

    // Remove inactive markers
    Object.keys(markersRef.current).forEach((markerId) => {
      if (!currentMarkerIds.has(markerId)) {
        const marker = markersRef.current[markerId]
        if (marker) {
          marker.clearAllEventListeners()
          marker.remove()
        }
        delete markersRef.current[markerId]
        delete lastUpdateRef.current[markerId]
      }
    })
  }, [map, culledFlights, airportById])

  // Update on hash change + interval
  useEffect(() => {
    updateMarkers()
    
    // Set up interval for continuous updates
    const intervalId = setInterval(() => {
      updateMarkers()
    }, UPDATE_THROTTLE_MS)
    
    return () => clearInterval(intervalId)
  }, [culledFlightsHash, updateMarkers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => {
        m.clearAllEventListeners()
        m.remove()
      })
      markersRef.current = {}
      lastUpdateRef.current = {}
    }
  }, [])

  return null
}

interface FlightMonitorProps {
  simulationResults?: AlgorithmResultSchema | null
  simulationType?: 'day-to-day' | 'weekly' | 'collapse'
}

export function FlightMonitor({
  simulationResults,
  simulationType = 'weekly',
}: FlightMonitorProps) {
  const [selectedFlight, setSelectedFlight] = useState<ActiveFlight | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)

  // Get total flights count from database (always fetch to show real total)
  const { data: totalFlightsFromDB, isLoading: isLoadingFlightsCount, error: flightsCountError } = useFlightsCount()
  
  // Debug logging for flight count and data validation
  useEffect(() => {
    console.log('[FlightMonitor] totalFlightsFromDB:', totalFlightsFromDB)
    console.log('[FlightMonitor] isLoadingFlightsCount:', isLoadingFlightsCount)
    console.log('[FlightMonitor] hasTimeline:', !!simulationResults?.timeline)
    console.log('[FlightMonitor] timeline events:', simulationResults?.timeline?.events?.length || 0)
    
    if (flightsCountError) {
      console.error('[FlightMonitor] flightsCountError:', flightsCountError)
    }
    
    // Warning if timeline exists but no flights in DB
    if (simulationResults?.timeline && totalFlightsFromDB === 0) {
      console.warn(
        '[FlightMonitor] ⚠️ WARNING: Timeline existe pero BD tiene 0 vuelos. ' +
        'Los vuelos mostrados son de una simulación anterior. ' +
        'Usa "Limpiar Resultados" para removerlos.'
      )
    }
  }, [totalFlightsFromDB, isLoadingFlightsCount, flightsCountError, simulationResults?.timeline])

  // Airport capacity manager (uses real data from database)
  // Only initialize when we have timeline to avoid unnecessary queries
  const capacityManager = useAirportCapacityManager()

  // Directly use airports from capacityManager (already memoized in the hook)
  const airportsFromDB = capacityManager.airports

  // Stable reference to capacity event handler
  const handleFlightCapacityEvent = useCallback(
    (event: FlightCapacityEvent) => capacityManager.handleFlightCapacityEvent(event),
    [capacityManager],
  )

  // Mutation to update flight status in database
  const updateFlight = useUpdateFlight()
  const queryClient = useQueryClient()

  // Callback to update flight status in database
  const handleFlightStatusChange = useCallback(
    (update: FlightStatusUpdate) => {
      console.log(
        `[FLIGHT STATUS] Flight ${update.flightId} → ${update.status} at ${update.timestamp.toLocaleTimeString()}`,
      )

      updateFlight.mutate(
        {
          id: update.flightId,
          updates: { status: update.status },
        },
        {
          onSuccess: () => {
            // Invalidate flight counts to refresh stats
            queryClient.invalidateQueries({ queryKey: flightKeys.count() })
          },
          onError: (error : any) => {
            console.error(`[FLIGHT STATUS] Failed to update flight ${update.flightId}:`, error)
          },
        },
      )
    },
    [updateFlight, queryClient],
  )

  // Callback to handle capacity changes (departures/arrivals)
  const handleCapacityChange = useCallback(
    (event: FlightCapacityEvent) => {
      handleFlightCapacityEvent(event)
    },
    [handleFlightCapacityEvent],
  )

  // Determine initial time unit based on simulation type
  const getInitialTimeUnit = (): 'seconds' | 'minutes' | 'hours' | 'days' => {
    if (simulationType === 'day-to-day') return 'seconds' // 1:1 real time
    if (simulationType === 'weekly') return 'hours' // Fast forward
    return 'minutes' // collapse
  }

  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>(
    getInitialTimeUnit(),
  )

  // Use temporal simulation if we have timeline data
  const temporalSim = useTemporalSimulation({
    timeline: simulationResults?.timeline,
    timeUnit,
    simulationType,
    onFlightStatusChange: handleFlightStatusChange,
    onFlightCapacityChange: handleCapacityChange,
  })

  // Determine which airports to show
  const airports = useMemo(() => {
    const hasDBData = airportsFromDB.length > 0

    // Always show database airports if available (even without simulation)
    if (hasDBData) {
      return airportsFromDB
    }

    // If no DB data, return empty array (don't show dummy data)
    return []
  }, [airportsFromDB])

  const bounds = useMemo(() => {
    if (airports.length === 0) {
      // Default bounds if no airports (world view)
      return L.latLngBounds([
        [-60, -180],
        [70, 180],
      ])
    }
    return L.latLngBounds(airports.map((a) => cityToLatLng(a)))
  }, [airports])

  // Note: Capacities reset automatically when simulation changes
  // No need for manual reset to avoid render loops

  const handleFlightClick = useCallback((flight: ActiveFlight) => {
    setSelectedFlight(flight)
  }, [])

  const handleAirportClick = useCallback((airport: SimAirport) => {
    setSelectedAirport(airport)
  }, [])

  const tileUrl =
    import.meta.env.VITE_TILE_URL ??
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution = import.meta.env.VITE_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap & CARTO'

  const hasTimeline = !!simulationResults?.timeline

  // Always use total from database to show real count (not grouped flights from timeline)
  const totalFlights = totalFlightsFromDB || 0

  // Data validation flags
  const noDataAvailable = airports.length === 0 && hasTimeline && !capacityManager.isLoading
  const hasStaleResults = hasTimeline && totalFlightsFromDB === 0 && !isLoadingFlightsCount

  return (
    <MonitorWrapper>
      {noDataAvailable && (
        <div
          style={{
            padding: '20px',
            background: '#fef3c7',
            border: '2px solid #fcd34d',
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <strong>⚠️ Sin datos de aeropuertos:</strong> No se encontraron aeropuertos en la base de
          datos. Por favor, carga los datos desde la página "Datos" antes de ejecutar la
          simulación.
        </div>
      )}
      
      {hasStaleResults && (
        <div
          style={{
            padding: '20px',
            background: '#fee2e2',
            border: '2px solid #fca5a5',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '16px',
          }}
        >
          <strong>🚨 Datos obsoletos detectados:</strong> Estás viendo resultados de una simulación anterior, 
          pero la base de datos actualmente tiene 0 vuelos cargados. Estos vuelos NO son reales. 
          Por favor, usa el botón "Limpiar Resultados" en la parte superior para removerlos, 
          o carga datos reales desde la página "Datos" y ejecuta el algoritmo nuevamente.
        </div>
      )}
      <MapWrapper>
        {hasTimeline && (
          <SimulationControls>
            <ControlsRow>
              {!temporalSim.isPlaying ? (
                <ControlButton $variant="play" onClick={temporalSim.play}>
                  ▶ Reproducir
                </ControlButton>
              ) : (
                <ControlButton $variant="pause" onClick={temporalSim.pause}>
                  ⏸ Pausar
                </ControlButton>
              )}
              <ControlButton $variant="reset" onClick={temporalSim.reset}>
                ⏹ Reiniciar
              </ControlButton>
            </ControlsRow>

            <ProgressBar>
              <ProgressFill $progress={temporalSim.progressPercent} />
            </ProgressBar>

            <SpeedControl>
              <span>1 seg real =</span>
              <SpeedButton $active={timeUnit === 'seconds'} onClick={() => setTimeUnit('seconds')}>
                1 seg
              </SpeedButton>
              <SpeedButton $active={timeUnit === 'minutes'} onClick={() => setTimeUnit('minutes')}>
                1 min
              </SpeedButton>
              <SpeedButton $active={timeUnit === 'hours'} onClick={() => setTimeUnit('hours')}>
                1 hora
              </SpeedButton>
              <SpeedButton $active={timeUnit === 'days'} onClick={() => setTimeUnit('days')}>
                1 día
              </SpeedButton>
            </SpeedControl>

            <StatsRow>
              <div>Vuelos activos: {temporalSim.activeFlights.length}</div>
              <div>Productos entregados: {temporalSim.completedProductsCount}</div>
            </StatsRow>
          </SimulationControls>
        )}

        <MapContainer
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', borderRadius: 12 }}
          worldCopyJump={false}
          maxBounds={
            new L.LatLngBounds([
              [-90, -180],
              [90, 180],
            ])
          }
          maxBoundsViscosity={1.0}
          minZoom={2}
          maxZoom={5}
          zoomControl={true}
        >
          <TileLayer attribution={tileAttribution} url={tileUrl} noWrap={true} />

          {/* Aeropuertos */}
          {airports.map((a) => (
            <CircleMarker
              key={a.id}
              center={cityToLatLng(a)}
              radius={8}
              color={capacityToColor(a.capacityPercent)}
              fillColor={capacityToColor(a.capacityPercent)}
              fillOpacity={0.9}
              weight={1.5}
              eventHandlers={{
                click: () => handleAirportClick(a),
                mouseover: (e) => {
                  e.target.setRadius(12)
                  e.target.setStyle({ weight: 3 })
                },
                mouseout: (e) => {
                  e.target.setRadius(8)
                  e.target.setStyle({ weight: 1.5 })
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                <div>
                  <strong>{a.city}</strong>
                  <div>Capacidad: {(((a as any).maxCapacity - (a as any).currentUsedCapacity) / (a as any).maxCapacity ) * 100}%</div>
                  {(a as any).warehouseName && (
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {(a as any).warehouseName}
                    </div>
                  )}
                  {(a as any).currentUsedCapacity !== undefined &&
                    (a as any).maxCapacity !== undefined && (
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {Math.round((a as any).currentUsedCapacity)}/{(a as any).maxCapacity}{' '}
                        unidades
                      </div>
                    )}
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Click para ver detalles
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* ⚡ OPTIMIZED: Rutas de vuelo (arcos) - limited to prevent lag */}
          {/* Only show polylines for first 30 flights to prevent lag */}
          {hasTimeline &&
            temporalSim.activeFlights.slice(0, 30).map((f) => {
              const origin = airports.find((a) => a.id === f.originAirportId)
              const dest = airports.find((a) => a.id === f.destinationAirportId)
              if (!origin || !dest) return null
              const start = cityToLatLng(origin)
              const end = cityToLatLng(dest)
              const arc = buildArcPoints(start, end)
              return (
                <Polyline
                  key={`line-${f.productId}-${f.flightId}`}
                  positions={arc}
                  color="#3b82f6"
                  opacity={0.3}
                  weight={1.2}
                />
              )
            })}

          {hasTimeline ? (
            <AnimatedTemporalFlights
              airports={airports}
              activeFlights={temporalSim.activeFlights}
              onFlightClick={handleFlightClick}
            />
          ) : null}

          {/* Legend dentro del mapa */}
          <Legend>
            {hasTimeline && (
              <>
                <div style={{ width: 10, height: 10, background: '#14b8a6', borderRadius: 2 }} />
                <div style={{ fontWeight: 600 }}>
                  Simulación Temporal (Vuelos: {temporalSim.activeFlights.length})
                </div>
              </>
            )}
            <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} />
            <div>Normal (&lt; 70%)</div>
            <div style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }} />
            <div>Cercano a capacidad (&lt; 90%)</div>
            <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2 }} />
            <div>Colapsado (≥ 90%)</div>
          </Legend>
        </MapContainer>
      </MapWrapper>

      {hasTimeline && (
        <StatsBar>
          <StatCard>
            <StatLabel>Tiempo de Simulación</StatLabel>
            <StatValue>{temporalSim.formatSimulationTime(temporalSim.currentSimTime)}</StatValue>
          </StatCard>

          <StatCard>
            <StatLabel>Vuelos Completados</StatLabel>
            <StatValue>
              {temporalSim.flightStats.completed} / {totalFlights}
            </StatValue>
          </StatCard>

          <StatCard>
            <StatLabel>Vuelos en Vuelo</StatLabel>
            <StatValue>
              {temporalSim.flightStats.inFlight} / {totalFlights}
            </StatValue>
          </StatCard>

          <StatCard>
            <StatLabel>Vuelos Pendientes</StatLabel>
            <StatValue>
              {temporalSim.flightStats.pending} / {totalFlights}
            </StatValue>
          </StatCard>
        </StatsBar>
      )}

      <FlightDetailsModal
        flight={selectedFlight}
        origin={
          selectedFlight
            ? airports.find((a) => a.id === selectedFlight.originAirportId) || null
            : null
        }
        destination={
          selectedFlight
            ? airports.find((a) => a.id === selectedFlight.destinationAirportId) || null
            : null
        }
        onClose={() => setSelectedFlight(null)}
      />

      <AirportDetailsModal airport={selectedAirport} onClose={() => setSelectedAirport(null)} />
    </MonitorWrapper>
  )
}

export default FlightMonitor
