import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L, { DivIcon, Marker } from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import gsap from 'gsap'
import styled from 'styled-components'
import { useFlightSimulation } from '../hooks/useFlightSimulation'
import type { FlightSimulationMode, SimAirport, SimFlight } from '../hooks/useFlightSimulation'
import { FlightDetailsModal } from './FlightDetailsModal'
import { AirportDetailsModal } from './AirportDetailsModal'
import type { AlgorithmResultSchema } from '../types'

const MonitorWrapper = styled.div`
  width: 100%;
  height: 70vh; /* Adjust height to fit better in the new layout */
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  font-size: 12px;
  color: #111827;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
`

function capacityToColor(capacityPercent: number): string {
  if (capacityPercent >= 90) return '#ef4444' // red
  if (capacityPercent >= 70) return '#f59e0b' // orange
  return '#10b981' // green
}

function cityToLatLng(city: SimAirport): LatLngTuple {
  return [city.latitude, city.longitude]
}

// Build a quadratic bezier arc control point for a pleasant curve between A and B
function computeControlPoint(a: LatLngTuple, b: LatLngTuple, curvature = 0.25): LatLngTuple {
  const lat1 = a[0]; const lng1 = a[1]
  const lat2 = b[0]; const lng2 = b[1]
  const latMid = (lat1 + lat2) / 2
  const lngMid = (lng1 + lng2) / 2
  // approximate x scaling by latitude so lng distance is scaled
  const scale = Math.cos((lat1 + lat2) * Math.PI / 360)
  const dx = (lng2 - lng1) * scale
  const dy = (lat2 - lat1)
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

function buildArcPoints(a: LatLngTuple, b: LatLngTuple, samples = 32): LatLngTuple[] {
  const c = computeControlPoint(a, b)
  const pts: LatLngTuple[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    pts.push(bezierPoint(t, a, c, b))
  }
  return pts
}


function AnimatedFlights({ 
  airports, 
  flights, 
  speed,
  onFlightClick 
}: { 
  airports: SimAirport[]
  flights: SimFlight[]
  speed: number
  onFlightClick: (flight: SimFlight) => void
}) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Build quick lookup for airport coordinates
  const airportById = useMemo(() => {
    const dict: Record<number, SimAirport> = {}
    airports.forEach(a => { dict[a.id] = a })
    return dict
  }, [airports])

  useEffect(() => {
    // Clear previous markers/timeline
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }

    const tl = gsap.timeline({ repeat: -1 })

    flights.forEach((flight, idx) => {
      const origin = airportById[flight.originAirportId]
      const dest = airportById[flight.destinationAirportId]
      if (!origin || !dest) return
  
      const planeHTML = `<img src="/airplane.png" alt="plane" class="plane" style="width:24px;height:24px;display:block;transform-origin:50% 50%;will-change:transform;" />`
      const planeIcon = new DivIcon({
        className: 'plane-icon',
        html: planeHTML,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
  
      const start: LatLngTuple = cityToLatLng(origin)
      const end: LatLngTuple = cityToLatLng(dest)
      const ctrl: LatLngTuple = computeControlPoint(start, end)
      const marker = L.marker(start, { icon: planeIcon, interactive: true })
      
      // Make marker clickable
      marker.on('click', () => {
        onFlightClick(flight)
      })
      
      // Add hover effect
      marker.on('mouseover', () => {
        const el = marker.getElement()
        if (el) {
          el.style.cursor = 'pointer'
          el.style.transform = 'scale(1.2)'
          el.style.transition = 'transform 0.2s'
        }
      })
      
      marker.on('mouseout', () => {
        const el = marker.getElement()
        if (el) {
          el.style.transform = 'scale(1)'
        }
      })
      
      // Place the marker at its initial progress to avoid a visible jump
      const initialP = Math.min(1, Math.max(0, flight.progress))
      const [initLat, initLng] = bezierPoint(initialP, start, ctrl, end)
      marker.setLatLng([initLat, initLng])
      const [initDlat, initDlng] = bezierTangent(initialP, start, ctrl, end)
      const initScale = Math.cos(initLat * Math.PI / 180) || 1
      const initAngle = Math.atan2(-initDlat, initDlng * initScale) - Math.PI
      const initEl = marker.getElement()?.querySelector?.('.plane') as HTMLElement | null
      if (initEl) initEl.style.transform = `rotate(${initAngle}rad)`
      marker.addTo(map)
      markersRef.current[flight.id] = marker
  
      // Animate progress 0->1 along the bezier curve, rotate plane to tangent
      const progressObj = { p: initialP }
      const duration = (8 + (idx % 3) * 1.5) / speed // slower, slightly varied, scaled by mode
      tl.to(progressObj, {
        p: 1,
        duration,
        ease: 'none',
        onUpdate: () => {
          const [lat, lng] = bezierPoint(progressObj.p, start, ctrl, end)
          marker.setLatLng([lat, lng])
          const [dlat, dlng] = bezierTangent(progressObj.p, start, ctrl, end)
          const scale = Math.cos(lat * Math.PI / 180) || 1
          const angleRad = Math.atan2(-dlat, dlng * scale)
          const el = marker.getElement()?.querySelector('.plane') as HTMLElement | null
          if (el) el.style.transform = `rotate(${angleRad - Math.PI}rad)`
        },
        onComplete: () => {
          // loop back to origin
          marker.setLatLng(start)
          progressObj.p = 0
        },
      }, idx * 0.05) // slight stagger
    })

    timelineRef.current = tl
    return () => {
      tl.kill()
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}
    }
  }, [flights, airportById, map, speed])

  return null
}

interface FlightMonitorProps {
  mode: FlightSimulationMode;
  simulationResults?: AlgorithmResultSchema | null;
}

export function FlightMonitor({ mode, simulationResults }: FlightMonitorProps) {
  const { airports, flights, speed } = useFlightSimulation(mode)
  const [selectedFlight, setSelectedFlight] = useState<SimFlight | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
  
  // Convertir resultados del algoritmo a vuelos para el mapa
  const algorithmFlights = useMemo(() => {
    if (!simulationResults?.productRoutes) return null
    
    const flights: SimFlight[] = []
    simulationResults.productRoutes.forEach((route, idx) => {
      route.flights.forEach((flight, flightIdx) => {
        const origin = airports.find(a => 
          a.city.toLowerCase() === flight.originAirportCode?.toLowerCase() ||
          a.city.toLowerCase().includes(flight.originAirportCode?.toLowerCase() || '')
        )
        const dest = airports.find(a => 
          a.city.toLowerCase() === flight.destinationAirportCode?.toLowerCase() ||
          a.city.toLowerCase().includes(flight.destinationAirportCode?.toLowerCase() || '')
        )
        
        if (origin && dest) {
          flights.push({
            id: `ALG-${route.orderId}-${flightIdx}`,
            code: flight.code || `FLIGHT-${idx}-${flightIdx}`,
            originAirportId: origin.id,
            destinationAirportId: dest.id,
            progress: Math.random() * 0.8, // Progreso random para animación
            maxCapacity: flight.maxCapacity || 250,
            usedCapacity: flight.usedCapacity || 200,
            status: 'En ruta optimizada',
            transportTimeDays: flight.transportTimeDays || 2,
            description: `Orden ${route.orderName}: ${route.originCity} → ${route.destinationCity}`
          })
        }
      })
    })
    
    return flights.length > 0 ? flights : null
  }, [simulationResults, airports])
  
  // Usar vuelos del algoritmo si existen, sino usar demo
  const displayFlights = algorithmFlights || flights

  const bounds = useMemo(() => {
    return L.latLngBounds(airports.map(a => cityToLatLng(a)))
  }, [airports])

  const handleFlightClick = (flight: SimFlight) => {
    setSelectedFlight(flight)
  }

  const handleAirportClick = (airport: SimAirport) => {
    setSelectedAirport(airport)
  }

  const selectedOrigin = selectedFlight 
    ? airports.find(a => a.id === selectedFlight.originAirportId) || null
    : null

  const selectedDestination = selectedFlight 
    ? airports.find(a => a.id === selectedFlight.destinationAirportId) || null
    : null

  const tileUrl = import.meta.env.VITE_TILE_URL ?? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution = import.meta.env.VITE_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap & CARTO'

  return (
    <MonitorWrapper>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        worldCopyJump={false} // Prevents repeating the world
        maxBounds={new L.LatLngBounds([[-90, -180], [90, 180]])} // Restrict panning
        maxBoundsViscosity={1.0} // Makes bounds solid
        minZoom={3} // Minimum zoom level (prevents zooming out too much)
        maxZoom={5} // Maximum zoom level (prevents zooming in too much)
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          noWrap={true} // Prevents repeating tiles
        />

        {/* Aeropuertos */}
        {airports.map(a => (
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
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
              <div>
                <strong>{a.city}</strong>
                <div>Capacidad: {a.capacityPercent}%</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  Click para ver detalles
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Rutas de vuelo (arcos) */}
        {displayFlights.map(f => {
          const origin = airports.find(a => a.id === f.originAirportId)
          const dest = airports.find(a => a.id === f.destinationAirportId)
          if (!origin || !dest) return null
          const start = cityToLatLng(origin)
          const end = cityToLatLng(dest)
          const arc = buildArcPoints(start, end)
          return <Polyline key={`line-${f.id}`} positions={arc} color="#60a5fa" opacity={0.6} weight={2} />
        })}

        <AnimatedFlights 
          airports={airports} 
          flights={displayFlights} 
          speed={simulationResults ? 1.5 : speed} 
          onFlightClick={handleFlightClick}
        />
      </MapContainer>

      <FlightDetailsModal 
        flight={selectedFlight}
        origin={selectedOrigin}
        destination={selectedDestination}
        onClose={() => setSelectedFlight(null)}
      />

      <AirportDetailsModal 
        airport={selectedAirport}
        onClose={() => setSelectedAirport(null)}
      />

      <Legend>
        {simulationResults && (
          <>
            <div style={{ width: 10, height: 10, background: '#14b8a6', borderRadius: 2 }} />
            <div style={{ fontWeight: 600 }}>Rutas Optimizadas ({displayFlights.length})</div>
          </>
        )}
        <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} />
        <div>Normal (&lt; 70%)</div>
        <div style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }} />
        <div>Cercano a capacidad (&lt; 90%)</div>
        <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2 }} />
        <div>Colapsado (≥ 90%)</div>
      </Legend>
    </MonitorWrapper>
  )
}

export default FlightMonitor


