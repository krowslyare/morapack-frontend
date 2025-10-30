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

/** ===== Capa de rutas ligada al viewport ===== */
function RoutesLayer({
  flights,
  airports,
  getCtrlPoint,
  canvasRenderer,
}: {
  flights: ActiveFlight[]
  airports: SimAirport[]
  getCtrlPoint: (f: ActiveFlight, a: LatLngTuple, b: LatLngTuple) => LatLngTuple
  canvasRenderer: L.Renderer
}) {
  const map = useMap()

  const airportsById = useMemo(() => {
    const d: Record<number, SimAirport> = {}
    airports.forEach((a) => {
      d[a.id] = a
    })
    return d
  }, [airports])

  // Re-render al pan/zoom
  const [, force] = useState(0)
  useEffect(() => {
    if (!map) return
    let t: number | undefined

    const onMove = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => force(x => x + 1), 50)
    }

    map.on('moveend', onMove)
    return () => {
      window.clearTimeout(t)
      map.off('moveend', onMove)
    }
  }, [map])

  const view = map.getBounds()

  return (
    <>
      {flights
        .filter((f) => {
          const o = airportsById[f.originAirportId]
          const d = airportsById[f.destinationAirportId]
          if (!o || !d) return false
          return (
            view.contains([o.latitude, o.longitude]) ||
            view.contains([d.latitude, d.longitude])
          )
        })
        .map((f) => {
          const o = airportsById[f.originAirportId]!
          const d = airportsById[f.destinationAirportId]!
          const start: LatLngTuple = [o.latitude, o.longitude]
          const end: LatLngTuple = [d.latitude, d.longitude]
          const ctrl = getCtrlPoint(f, start, end)
          const samples = 24
          const arc: LatLngTuple[] = Array.from({ length: samples + 1 }, (_, i) =>
            bezierPoint(i / samples, start, ctrl, end),
          )
          return (
            <Polyline
              key={`route-${f.productId}-${f.flightId}`}
              positions={arc}
              color="#3b82f6"
              opacity={0.25}
              weight={1}
              renderer={canvasRenderer}
            />
          )
        })}
    </>
  )
}

/** ===== Aviones animados usando el mismo control point ===== */
function AnimatedTemporalFlights({
  airports,
  activeFlights,
  onFlightClick,
  getCtrlPoint,
}: {
  airports: SimAirport[]
  activeFlights: ActiveFlight[]
  onFlightClick: (flight: ActiveFlight) => void
  getCtrlPoint: (f: ActiveFlight, a: LatLngTuple, b: LatLngTuple) => LatLngTuple
}) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const lastUpdateTimeRef = useRef<number>(0)
  const lastUpdateRef = useRef<Record<string, { progress: number; lat: number; lng: number }>>({})

  const UPDATE_THROTTLE_MS = 200
  const MAX_FLIGHTS_RENDERED = 100

  const onFlightClickRef = useRef(onFlightClick)
  onFlightClickRef.current = onFlightClick

  const airportById = useMemo(() => {
    const dict: Record<number, SimAirport> = {}
    airports.forEach((a) => { dict[a.id] = a })
    return dict
  }, [airports])

  const culledFlights = useMemo(() => {
    const list = activeFlights
    if (list.length <= MAX_FLIGHTS_RENDERED) return list
    return [...list].sort((a, b) => b.progress - a.progress).slice(0, MAX_FLIGHTS_RENDERED)
  }, [activeFlights])

  const culledFlightsHash = useMemo(
    () => culledFlights.map((f) => `${f.flightId}-${f.progress.toFixed(2)}`).join('|'),
    [culledFlights],
  )

  // helper para popup HTML
  type AnyFlight = ActiveFlight 

  const popupHtml = (f: AnyFlight, o: SimAirport, d: SimAirport) => {
    const flightCode =
      (f as any).flightCode ?? (f as any).code ?? (f as any).flightId ?? (f as any).id

    const productLine =
      (f as any).productId != null
        ? `<div style="color:#6b7280">Producto #${(f as any).productId}</div>`
        : ``

    const pct = Math.round((f as any).progress * 100)
    const originLabel = (o as any).codeIATA ?? o.city
    const destLabel   = (d as any).codeIATA ?? d.city

    return `
      <div style="font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto;color:#111827">
        <div style="font-weight:700;margin-bottom:4px">Vuelo ${flightCode}</div>
        <div>${originLabel} → ${destLabel}</div>
        ${productLine}
        <div style="margin-top:6px">Progreso: <strong>${pct}%</strong></div>
        <button id="openDetailsBtn"
          style="margin-top:8px;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;
                background:#fff;color:#111827;cursor:pointer;font-weight:600">
          Ver detalles
        </button>
      </div>
    `
  }

  const updateMarkers = useCallback(() => {
    const now = Date.now()
    if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE_MS) return
    lastUpdateTimeRef.current = now

    const currentMarkerIds = new Set<string>()

    culledFlights.forEach((flight) => {
      const origin = airportById[flight.originAirportId]
      const dest = airportById[flight.destinationAirportId]
      if (!origin || !dest) return

      const markerId = `flight-${flight.flightId}-${flight.productId}`
      currentMarkerIds.add(markerId)

      const start: LatLngTuple = [origin.latitude, origin.longitude]
      const end: LatLngTuple   = [dest.latitude, dest.longitude]
      const ctrl               = getCtrlPoint(flight, start, end)

      let marker = markersRef.current[markerId]
      if (!marker) {
        const planeHTML =
          `<img src="/airplane.png" alt="✈" class="plane"
             style="width:20px;height:20px;display:block;transform-origin:50% 50%;will-change:transform;" />`
        const planeIcon = new DivIcon({ className: 'plane-icon', html: planeHTML, iconSize: [20, 20], iconAnchor: [10, 10] })
        marker = L.marker(start, { icon: planeIcon, interactive: true })

        // click => popup pequeño + botón "Ver detalles"
        marker.on('click', () => {
          const p = L.popup({ offset: [0, -10], autoPan: true, closeButton: true })
            .setLatLng(marker!.getLatLng())
            .setContent(popupHtml(flight, origin, dest))
            .openOn(map)

          // delega para el botón dentro del popup
          setTimeout(() => {
            const btn = document.getElementById('openDetailsBtn')
            if (btn) {
              btn.onclick = () => {
                map.closePopup(p)
                onFlightClickRef.current(flight) // abre tu FlightDetailsModal existente
              }
            }
          }, 0)
        })

        marker.on('mouseover', () => {
          const plane = marker!.getElement()?.querySelector('.plane') as HTMLElement | null
          if (plane) {
            plane.style.cursor = 'pointer'
            plane.style.transform = `${plane.style.transform?.replace(/\s*scale\([^)]*\)/, '')} scale(1.3)`
          }
        })
        marker.on('mouseout', () => {
          const plane = marker!.getElement()?.querySelector('.plane') as HTMLElement | null
          if (plane) {
            plane.style.transform = plane.style.transform?.replace(/\s*scale\([^)]*\)/, '')!
          }
        })

        marker.addTo(map)
        markersRef.current[markerId] = marker
        lastUpdateRef.current[markerId] = { progress: -1, lat: 0, lng: 0 }
      }

      // posiciona y rota
      const [lat, lng] = bezierPoint(flight.progress, start, ctrl, end)
      const last = lastUpdateRef.current[markerId]
      const shouldUpdate =
        Math.abs(lat - last.lat) > 0.002 ||
        Math.abs(lng - last.lng) > 0.002 ||
        Math.abs(flight.progress - last.progress) > 0.02

      if (shouldUpdate) {
        marker.setLatLng([lat, lng])
        const [dlat, dlng] = bezierTangent(flight.progress, start, ctrl, end)
        const angleRad = Math.atan2(-dlat, dlng * Math.cos((lat * Math.PI) / 180))
        const plane = marker.getElement()?.querySelector('.plane') as HTMLElement | null
        if (plane) {
          const base = `rotate(${angleRad - Math.PI}rad)`
          const scale = plane.style.transform.match(/scale\([^)]*\)/)?.[0] ?? ''
          plane.style.transform = `${base}${scale ? ' ' + scale : ''}`
        }
        lastUpdateRef.current[markerId] = { progress: flight.progress, lat, lng }
      }
    })

    // limpia inactivos
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentMarkerIds.has(id)) {
        const mk = markersRef.current[id]
        if (mk) { mk.off(); mk.remove() }
        delete markersRef.current[id]
        delete lastUpdateRef.current[id]
      }
    })
  }, [map, culledFlights, airportById, getCtrlPoint])

  useEffect(() => {
    updateMarkers()
    const id = setInterval(updateMarkers, UPDATE_THROTTLE_MS)
    return () => clearInterval(id)
  }, [culledFlightsHash, updateMarkers])

  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => { m.off(); m.remove() })
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

  const { data: totalFlightsFromDB, isLoading: isLoadingFlightsCount, error: flightsCountError } =
    useFlightsCount()

  useEffect(() => {
    if (flightsCountError) console.error('[FlightMonitor] flightsCountError:', flightsCountError)
  }, [flightsCountError])

  const capacityManager = useAirportCapacityManager()
  const airportsFromDB = capacityManager.airports

  const handleFlightCapacityEvent = useCallback(
    (event: FlightCapacityEvent) => capacityManager.handleFlightCapacityEvent(event),
    [capacityManager],
  )

  const updateFlight = useUpdateFlight()
  const queryClient = useQueryClient()

  const handleFlightStatusChange = useCallback(
    (update: FlightStatusUpdate) => {
      updateFlight.mutate(
        { id: update.flightId, updates: { status: update.status } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: flightKeys.count() }) },
      )
    },
    [updateFlight, queryClient],
  )

  const handleCapacityChange = useCallback(
    (event: FlightCapacityEvent) => {
      handleFlightCapacityEvent(event)
    },
    [handleFlightCapacityEvent],
  )

  const getInitialTimeUnit = (): 'seconds' | 'minutes' | 'hours' | 'days' => {
    if (simulationType === 'day-to-day') return 'seconds'
    if (simulationType === 'weekly') return 'hours'
    return 'minutes'
  }

  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>(
    getInitialTimeUnit(),
  )

  const temporalSim = useTemporalSimulation({
    timeline: simulationResults?.timeline,
    timeUnit,
    simulationType,
    onFlightStatusChange: handleFlightStatusChange,
    onFlightCapacityChange: handleCapacityChange,
  })

  const airports = useMemo(() => {
    if (airportsFromDB.length > 0) return airportsFromDB
    return []
  }, [airportsFromDB])

  const bounds = useMemo(() => {
    if (airports.length === 0) {
      return L.latLngBounds([
        [-60, -180],
        [70, 180],
      ])
    }
    return L.latLngBounds(airports.map((a) => cityToLatLng(a)))
  }, [airports])

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
  const totalFlights = totalFlightsFromDB || 0
  const noDataAvailable = airports.length === 0 && hasTimeline && !capacityManager.isLoading
  const hasStaleResults = hasTimeline && totalFlightsFromDB === 0 && !isLoadingFlightsCount

  /** ===== Caché de control points + invalidación ===== */
  const ctrlCacheRef = useRef<Record<string, LatLngTuple>>({})

  // Invalida caché si cambian aeropuertos o timeline
  useEffect(() => {
    ctrlCacheRef.current = {}
  }, [airportsFromDB, simulationResults?.timeline])

  const getCtrlPoint = useCallback((f: ActiveFlight, start: LatLngTuple, end: LatLngTuple) => {
    const id = `${f.flightId}-${f.productId}-${start[0]}-${start[1]}-${end[0]}-${end[1]}`
    if (!ctrlCacheRef.current[id]) {
      ctrlCacheRef.current[id] = computeControlPoint(start, end, 0.25)
    }
    return ctrlCacheRef.current[id]
  }, [])

  // Renderer Canvas para muchas líneas
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), [])

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
          <strong>⚠️ Sin datos de aeropuertos:</strong> Carga datos antes de ejecutar la simulación.
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
          <strong>🚨 Datos obsoletos:</strong> Timeline previo con 0 vuelos en BD.
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
                  <div>
                    Capacidad:{' '}
                    {(((a as any).maxCapacity - (a as any).currentUsedCapacity) /
                      (a as any).maxCapacity) *
                      100}
                    %
                  </div>
                  {(a as any).warehouseName && (
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {(a as any).warehouseName}
                    </div>
                  )}
                  {(a as any).currentUsedCapacity !== undefined &&
                    (a as any).maxCapacity !== undefined && (
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {Math.round((a as any).currentUsedCapacity)}/{(a as any).maxCapacity} unidades
                      </div>
                    )}
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Click para ver detalles
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Rutas de vuelo ligadas al viewport, usando el mismo control point */}
          {hasTimeline && (
            <RoutesLayer
              flights={temporalSim.activeFlights}
              airports={airports}
              getCtrlPoint={getCtrlPoint}
              canvasRenderer={canvasRenderer}
            />
          )}

          {hasTimeline ? (
            <AnimatedTemporalFlights
              airports={airports}
              activeFlights={temporalSim.activeFlights}
              onFlightClick={handleFlightClick}
              getCtrlPoint={getCtrlPoint}
            />
          ) : null}

          {/* Leyenda */}
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

      <AirportDetailsModal 
        airport={selectedAirport} 
        onClose={() => setSelectedAirport(null)}
        readOnly 
      />
    </MonitorWrapper>
  )
}

export default FlightMonitor
