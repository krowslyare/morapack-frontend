// src/components/FlightMonitor.tsx
import { api } from '../api/client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Pane,
  Polyline,
  useMap,
} from 'react-leaflet'
import L, { DivIcon, Marker } from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import styled from 'styled-components'
import { useFlights } from '../hooks/api/useFlights'
import { useAirportCapacityManager } from '../hooks/useAirportCapacityManager'
import type { FlightSchema } from '../types/FlightSchema'
import type { SimAirport } from '../hooks/useFlightSimulation'
import { FlightDetailsModal } from './FlightDetailsModal'
import { AirportDetailsModal } from './AirportDetailsModal'
import type { SimFlight } from '../hooks/useFlightSimulation'
import type { ActiveFlight as TemporalActiveFlight } from '../hooks/useTemporalSimulation'

/* ================== ESTILOS ================== */

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

const HUB_IATAS = new Set(['LIM', 'BRU', 'GYD'])
const HUB_CITIES = new Set(['Lima', 'Bruselas', 'Baku'])

const isHub = (a: SimAirport) =>
  HUB_IATAS.has((a as any).codeIATA) || HUB_CITIES.has(a.city)

function capacityToColor(capacityPercent: number): string {
  if (capacityPercent >= 90) return '#ef4444'
  if (capacityPercent >= 70) return '#f59e0b'
  return '#10b981'
}

/* ================== TIPOS ================== */

type SimulationType = 'day-to-day' | 'weekly' | 'collapse'

interface FlightMonitorProps {
  simulationResults?: unknown // ya no se usa, pero lo dejamos para no romper tipos
  simulationType?: SimulationType
}

type SimulatedActiveFlight = {
  flightId: number
  flightCode: string
  originAirportId: number
  destinationAirportId: number
  progress: number
}

/* ================== UTILIDADES ================== */

function cityToLatLng(a: SimAirport): LatLngTuple {
  return [a.latitude, a.longitude]
}

function computeControlPoint(
  a: LatLngTuple,
  b: LatLngTuple,
  curvature = 0.25,
): LatLngTuple {
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
  const lat =
    oneMinusT * oneMinusT * p0[0] +
    2 * oneMinusT * t * p1[0] +
    t * t * p2[0]
  const lng =
    oneMinusT * oneMinusT * p0[1] +
    2 * oneMinusT * t * p1[1] +
    t * t * p2[1]
  return [lat, lng]
}

function bezierTangent(
  t: number,
  p0: LatLngTuple,
  p1: LatLngTuple,
  p2: LatLngTuple,
): LatLngTuple {
  const lat = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const lng = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  return [lat, lng]
}

/* ================== CAPA DE RUTAS ================== */

function RoutesLayer({
  flights,
  airports,
}: {
  flights: SimulatedActiveFlight[]
  airports: SimAirport[]
}) {
  const map = useMap()

  const airportsById = useMemo(() => {
    const d: Record<number, SimAirport> = {}
    airports.forEach((a) => {
      d[a.id] = a
    })
    return d
  }, [airports])

  const view = map.getBounds()

  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), [])

  return (
    <>
      {flights.map((f) => {
        const o = airportsById[f.originAirportId]
        const d = airportsById[f.destinationAirportId]
        if (!o || !d) return null

        const start: LatLngTuple = [o.latitude, o.longitude]
        const end: LatLngTuple = [d.latitude, d.longitude]
        const ctrl = computeControlPoint(start, end, 0.25)

        // Solo dibujo si alguno de los extremos está en el viewport
        if (!view.contains(start) && !view.contains(end)) return null

        const samples = 24
        const arc: LatLngTuple[] = Array.from({ length: samples + 1 }, (_, i) =>
          bezierPoint(i / samples, start, ctrl, end),
        )

        const touchesHub = isHub(o) || isHub(d)

        return (
          <Polyline
            key={`route-${f.flightId}`}
            positions={arc}
            color="#f6b53bff"
            opacity={touchesHub ? 0.6 : 0.25}
            weight={touchesHub ? 2 : 1}
            renderer={canvasRenderer}
          />
        )
      })}
    </>
  )
}

/* ================== AVIONES ANIMADOS ================== */

function AnimatedFlights({
  flights,
  airports,
  onFlightClick,
}: {
  flights: SimulatedActiveFlight[]
  airports: SimAirport[]
  onFlightClick: (f: SimulatedActiveFlight) => void
}) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const lastStateRef = useRef<
    Record<string, { progress: number; lat: number; lng: number }>
  >({})

  const airportById = useMemo(() => {
    const d: Record<number, SimAirport> = {}
    airports.forEach((a) => {
      d[a.id] = a
    })
    return d
  }, [airports])

  const flightsKey = useMemo(
    () =>
      flights
        .map((f) => `${f.flightId}-${f.progress.toFixed(3)}`)
        .join('|'),
    [flights],
  )

  const onFlightClickRef = useRef(onFlightClick)
  onFlightClickRef.current = onFlightClick

  useEffect(() => {
    const currentIds = new Set<string>()

    flights.forEach((f) => {
      const origin = airportById[f.originAirportId]
      const dest = airportById[f.destinationAirportId]
      if (!origin || !dest) return

      const start: LatLngTuple = [origin.latitude, origin.longitude]
      const end: LatLngTuple = [dest.latitude, dest.longitude]
      const ctrl = computeControlPoint(start, end, 0.25)

      const markerId = `flight-${f.flightId}`
      currentIds.add(markerId)

      const [lat, lng] = bezierPoint(f.progress, start, ctrl, end)

      let marker = markersRef.current[markerId]
      if (!marker) {
        const planeHTML = `<img src="/airplane.png" alt="✈" class="plane"
          style="width:20px;height:20px;display:block;transform-origin:50% 50%;will-change:transform;" />`

        const icon = new DivIcon({
          className: 'plane-icon',
          html: planeHTML,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        marker = L.marker([lat, lng], { icon, interactive: true })

        marker.on('click', () => {
          onFlightClickRef.current(f)
        })

        marker.addTo(map)
        markersRef.current[markerId] = marker
        lastStateRef.current[markerId] = { progress: -1, lat, lng }
      } else {
        const last = lastStateRef.current[markerId]
        const needsUpdate =
          Math.abs(last.lat - lat) > 0.001 ||
          Math.abs(last.lng - lng) > 0.001 ||
          Math.abs(last.progress - f.progress) > 0.01

        if (needsUpdate) {
          marker.setLatLng([lat, lng])

          const [dlat, dlng] = bezierTangent(f.progress, start, ctrl, end)
          const angleRad = Math.atan2(-dlat, dlng * Math.cos((lat * Math.PI) / 180))
          const plane = marker.getElement()?.querySelector('.plane') as HTMLElement | null
          if (plane) {
            plane.style.transform = `rotate(${angleRad - Math.PI}rad)`
          }

          lastStateRef.current[markerId] = { progress: f.progress, lat, lng }
        }
      }
    })

    // limpiar marcadores de vuelos que ya no existen
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        const mk = markersRef.current[id]
        if (mk) mk.remove()
        delete markersRef.current[id]
        delete lastStateRef.current[id]
      }
    })
  }, [flightsKey, flights, airportById, map])

  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}
      lastStateRef.current = {}
    }
  }, [])

  return null
}

/* ================== COMPONENTE PRINCIPAL ================== */

export function FlightMonitor({
  simulationResults, // ya no usado
  simulationType = 'weekly',
}: FlightMonitorProps) {
  const { data: flightsData } = useFlights()
  const capacityManager = useAirportCapacityManager()
  const airports = capacityManager.airports

  const [selectedFlight, setSelectedFlight] = useState<SimFlight | TemporalActiveFlight | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)

  // Reloj simple para animación (solo front)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (simulationType !== 'weekly') return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 1000 / 30) // ~30fps
    return () => window.clearInterval(id)
  }, [simulationType])

  // Vuelos activos con progreso 0–1 (front-only, usando transportTimeDays para escala)
  const activeFlights: SimulatedActiveFlight[] = useMemo(() => {
    if (!flightsData || airports.length === 0) return []

    const airportById: Record<number, SimAirport> = {}
    airports.forEach((a) => {
      airportById[a.id] = a
    })

    const SPEED_FACTOR = 0.3 // < 1 = más lento, > 1 = más rápido
    const now = (tick / 60) * SPEED_FACTOR

    return flightsData
      .map((f: FlightSchema, index: number) => {
        const origin = airportById[f.originAirportId]
        const dest = airportById[f.destinationAirportId]
        if (!origin || !dest) return null

        const durDays = f.transportTimeDays || 1
        const basePeriod = Math.max(durDays, 0.25) // evitar 0
        const seed = index * 0.37

        // progreso periódico 0..1
        const t = (now / basePeriod + seed) % 1

        return {
          flightId: f.id!,
          flightCode: f.code,
          originAirportId: f.originAirportId,
          destinationAirportId: f.destinationAirportId,
          progress: t,
        } as SimulatedActiveFlight
      })
      .filter((x): x is SimulatedActiveFlight => x !== null)
  }, [flightsData, airports, tick])

  // Bounds del mapa
  const bounds = useMemo(() => {
    if (airports.length === 0) {
      return L.latLngBounds([
        [-60, -180],
        [70, 180],
      ])
    }
    return L.latLngBounds(airports.map((a) => cityToLatLng(a)))
  }, [airports])

  const tileUrl =
    import.meta.env.VITE_TILE_URL ??
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution =
    import.meta.env.VITE_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap & CARTO'

  const handleFlightClick = useCallback(async (f: SimulatedActiveFlight) => {
    // pides al backend el vuelo real por código
    const res = await api.get(`/api/query/flights/${f.flightCode}/status`)
    const realFlight: SimFlight = res.data.flight

    setSelectedFlight(realFlight)
  }, [])

  const handleAirportClick = useCallback((a: SimAirport) => {
    setSelectedAirport(a)
  }, [])

  const noAirports = airports.length === 0

  return (
    <MonitorWrapper>
      {noAirports && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef3c7',
            borderRadius: 8,
            border: '1px solid #facc15',
            color: '#92400e',
            fontSize: 14,
          }}
        >
          <strong>⚠️ No hay aeropuertos cargados.</strong> Carga datos antes de visualizar la
          simulación.
        </div>
      )}

      <MapWrapper>
        <MapContainer
          bounds={bounds}
          scrollWheelZoom
          style={{ width: '100%', height: '100%', borderRadius: 12 }}
          worldCopyJump={false}
          maxBounds={new L.LatLngBounds([[-90, -180], [90, 180]])}
          maxBoundsViscosity={1.0}
          minZoom={2}
          maxZoom={5}
          zoomControl
        >
          <Pane name="hubs" style={{ zIndex: 650 }} />

          <TileLayer attribution={tileAttribution} url={tileUrl} noWrap />

          {/* Aeropuertos */}
          {airports.map((a) => {
            const hub = isHub(a)
            const base = capacityToColor((a as any).capacityPercent ?? 30)
            const hubFill = '#f6b53bff'
            const hubStroke = '#ebc725ff'
            const center = cityToLatLng(a)

            return (
              <g key={a.id as any}>
                {hub && (
                  <CircleMarker
                    center={center}
                    radius={18}
                    color="transparent"
                    fillColor={hubFill}
                    fillOpacity={0.18}
                    weight={0}
                    pane="hubs"
                  />
                )}

                <CircleMarker
                  center={center}
                  radius={hub ? 10 : 8}
                  color={hub ? hubStroke : base}
                  fillColor={hub ? hubFill : base}
                  fillOpacity={0.95}
                  weight={hub ? 2.5 : 1.5}
                  pane={hub ? 'hubs' : undefined}
                  eventHandlers={{
                    click: () => handleAirportClick(a),
                  }}
                >
                  <Tooltip
                    direction={hub ? 'right' : 'top'}
                    offset={[0, -8]}
                    opacity={1}
                    permanent={hub}
                  >
                    <div>
                      <strong>
                        {a.city}
                        {(a as any).codeIATA ? ` · ${(a as any).codeIATA}` : ''}
                      </strong>
                    </div>
                  </Tooltip>
                </CircleMarker>
              </g>
            )
          })}

          {/* Rutas y aviones */}
          {activeFlights.length > 0 && (
            <>
              <RoutesLayer flights={activeFlights} airports={airports} />
              <AnimatedFlights
                flights={activeFlights}
                airports={airports}
                onFlightClick={handleFlightClick}
              />
            </>
          )}

          {/* Leyenda */}
          <Legend>
            <div style={{ width: 10, height: 10, background: '#14b8a6', borderRadius: 2 }} />
            <div style={{ fontWeight: 600 }}>Aviones en movimiento (simulación semanal)</div>

            <div style={{ width: 10, height: 10, background: '#f5b835ff', borderRadius: 2 }} />
            <div>Hub destacado (Lima, Bruselas, Baku)</div>

            <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} />
            <div>Capacidad baja (&lt; 70%)</div>

            <div style={{ width: 10, height: 10, background: '#f8fc35ff', borderRadius: 2 }} />
            <div>Capacidad media (&lt; 90%)</div>

            <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2 }} />
            <div>Capacidad alta (≥ 90%)</div>
          </Legend>
        </MapContainer>
      </MapWrapper>

      <FlightDetailsModal
        flight={selectedFlight}  // ahora sí es SimFlight del backend
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
