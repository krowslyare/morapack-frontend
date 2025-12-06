import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap, Pane } from 'react-leaflet'
import L, { type LatLngTuple, DivIcon, Marker } from 'leaflet'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'
import { simulationService, type FlightStatus, type FlightInstance, type CollapseSimulationResult, type AffectedAirport } from '../../api/simulationService'
import { useAirports } from '../../hooks/api/useAirports'
import { toast } from 'react-toastify'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import { OrderDetailsModal } from '../../components/OrderDetailsModal'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import { FlightDrawer } from '../WeeklySimulationPage/FlightDrawer'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import type { Continent } from '../../types/Continent'
import type { OrderSchema } from '../../types'
import '../WeeklySimulationPage/index.css'
import './index.css'

// ====================== Styled Components ======================
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

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
`

const ClockLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-bottom: 4px;
`

const ControlButton = styled.button<{ $variant?: 'play' | 'pause' | 'danger' | 'demo' }>`
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
    if (p.$variant === 'demo') return '#8b5cf6'
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

const StatusBadge = styled.div<{ $status: 'idle' | 'running' | 'collapsed' | 'success' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => {
    if (p.$status === 'running') return '#d1fae5'
    if (p.$status === 'collapsed') return '#fee2e2'
    if (p.$status === 'success') return '#dbeafe'
    return '#f3f4f6'
  }};
  color: ${(p) => {
    if (p.$status === 'running') return '#065f46'
    if (p.$status === 'collapsed') return '#991b1b'
    if (p.$status === 'success') return '#1e40af'
    return '#6b7280'
  }};
`

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
`

const SpeedLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
`

const SpeedToggle = styled.button<{ $active?: boolean }>`
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => (p.$active ? '#ef4444' : '#e5e7eb')};
  color: ${(p) => (p.$active ? 'white' : '#374151')};
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? '#dc2626' : '#d1d5db')};
  }
`

const WarningBadge = styled.div`
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 12px;
  color: #991b1b;
  text-align: center;
`

const DayBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fef2f2;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: #dc2626;
`

// ====================== Modal Styles ======================
const ModalOverlay = styled.div<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 420px;
  width: calc(100% - 32px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`

const ModalTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`

const ModalSubtitle = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`

const FormGroup = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background-color: #ffffff;
  color-scheme: light;

  &:focus {
    outline: none;
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`

const InfoBox = styled.div`
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  color: #991b1b;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`

const ModalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  border: ${(p) => (p.$primary ? 'none' : '1px solid #d1d5db')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => (p.$primary ? '#ef4444' : 'white')};
  color: ${(p) => (p.$primary ? 'white' : '#374151')};
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$primary ? '#dc2626' : '#f9fafb')};
  }
`

// ====================== Result Modal ======================
const ResultModal = styled.div`
  background: white;
  padding: 0;
  border-radius: 16px;
  max-width: 520px;
  width: calc(100% - 32px);
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`

const ResultHeader = styled.div<{ $collapsed: boolean }>`
  text-align: center;
  padding: 28px 24px;
  background: ${(p) =>
    p.$collapsed
      ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'};
`

const ResultIcon = styled.div<{ $collapsed?: boolean }>`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 700;
  background: ${(p) => (p.$collapsed ? '#fecaca' : '#bbf7d0')};
  color: ${(p) => (p.$collapsed ? '#dc2626' : '#16a34a')};
`

const ResultTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`

const ResultSubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #6b7280;
`

const ResultBody = styled.div`
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
`

const ResultSection = styled.div`
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
`

const ResultSectionTitle = styled.h4`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const ResultCard = styled.div<{ $highlight?: boolean }>`
  padding: 14px;
  background: ${(p) => (p.$highlight ? '#fef2f2' : '#f9fafb')};
  border: 1px solid ${(p) => (p.$highlight ? '#fecaca' : '#e5e7eb')};
  border-radius: 10px;
  text-align: center;
`

const ResultCardValue = styled.div<{ $danger?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => (p.$danger ? '#dc2626' : '#111827')};
`

const ResultCardLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
`

const ReasonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  font-weight: 600;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
`

const ResultFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
`

// ====================== Map Legend ======================
const MapLegend = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
`

const LegendTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #374151;
  &:last-child {
    margin-bottom: 0;
  }
`

const LegendDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`

// Affected airports panel
const AffectedPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  max-height: calc(100% - 40px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const AffectedPanelHeader = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
`

const AffectedPanelTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
`

const AffectedPanelSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
`

const AffectedPanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`

const AffectedAirportCard = styled.div<{ $severity: string }>`
  background: ${(p) => {
    switch (p.$severity) {
      case 'critical': return 'rgba(220, 38, 38, 0.08)'
      case 'high': return 'rgba(234, 88, 12, 0.08)'
      case 'medium': return 'rgba(202, 138, 4, 0.08)'
      default: return 'rgba(22, 163, 74, 0.08)'
    }
  }};
  border-left: 4px solid ${(p) => {
    switch (p.$severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#ca8a04'
      default: return '#16a34a'
    }
  }};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const AffectedAirportName = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #111827;
  margin-bottom: 4px;
`

const AffectedAirportCode = styled.span`
  font-weight: 700;
  font-size: 11px;
  color: #6b7280;
  margin-left: 6px;
`

const AffectedAirportStats = styled.div`
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #374151;
  margin-bottom: 4px;
`

const AffectedAirportReason = styled.div`
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
`

const SeverityBadge = styled.span<{ $severity: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(p) => {
    switch (p.$severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#ca8a04'
      default: return '#16a34a'
    }
  }};
  color: white;
  margin-left: 8px;
`

const CloseAffectedPanelButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

// ====================== Helpers ======================
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

function formatCollapseReason(reason: string): string {
  switch (reason) {
    case 'SLA_BREACH':
      return 'Incumplimiento de SLA'
    case 'CAPACITY_EXHAUSTED':
      return 'Capacidad agotada'
    case 'UNASSIGNED_ORDERS':
      return 'Órdenes sin asignar acumuladas'
    case 'WAREHOUSE_SATURATED':
      return 'Almacén saturado'
    default:
      return reason
  }
}

// Speed options in minutes per second
const SPEED_OPTIONS = [
  { label: '15m/s', value: 15 },
  { label: '30m/s', value: 30 },
  { label: '1h/s', value: 60 },
  { label: '2h/s', value: 120 },
]

// Collapse thresholds
// Collapse as soon as 1 order violates SLA
const MAX_UNASSIGNED_RATIO = 0.3 // 30% unassigned ratio = collapse

// ====================== Animated Planes Component ======================
function AnimatedPlanes({
  flightInstances,
  currentTime,
  airports,
}: {
  flightInstances: FlightInstance[]
  currentTime: Date | null
  airports: any[]
}) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!currentTime || !map) return

    const activeFlights = flightInstances.filter((f) => {
      const dept = new Date(f.departureTime)
      const arr = new Date(f.arrivalTime)
      return currentTime >= dept && currentTime <= arr
    })

    // Clean up old markers
    markersRef.current.forEach((marker, id) => {
      if (!activeFlights.find((f) => f.instanceId === id)) {
        map.removeLayer(marker)
        markersRef.current.delete(id)
      }
    })

    // Update or create markers for active flights
    activeFlights.forEach((flight) => {
      const origin = airports.find(
        (a) => a.id === flight.originAirport?.id || a.codeIATA === flight.originAirport?.codeIATA
      )
      const dest = airports.find(
        (a) =>
          a.id === flight.destinationAirport?.id ||
          a.codeIATA === flight.destinationAirport?.codeIATA
      )

      if (!origin || !dest) return

      const dept = new Date(flight.departureTime).getTime()
      const arr = new Date(flight.arrivalTime).getTime()
      const now = currentTime.getTime()
      const progress = Math.min(Math.max((now - dept) / (arr - dept), 0), 1)

      const startLat = parseFloat(origin.latitude)
      const startLng = parseFloat(origin.longitude)
      const endLat = parseFloat(dest.latitude)
      const endLng = parseFloat(dest.longitude)

      const currentLat = startLat + (endLat - startLat) * progress
      const currentLng = startLng + (endLng - startLng) * progress

      const angle = (Math.atan2(endLng - startLng, endLat - startLat) * 180) / Math.PI

      let marker = markersRef.current.get(flight.instanceId)

      if (!marker) {
        const icon = new DivIcon({
          className: 'plane-marker-collapse',
          html: `<div class="plane-icon" style="transform: rotate(${angle}deg)">✈</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        marker = new Marker([currentLat, currentLng], { icon, pane: 'flights' })
        marker.addTo(map)
        markersRef.current.set(flight.instanceId, marker)
      } else {
        marker.setLatLng([currentLat, currentLng])
        const iconEl = marker.getElement()?.querySelector('.plane-icon') as HTMLElement
        if (iconEl) {
          iconEl.style.transform = `rotate(${angle}deg)`
        }
      }
    })

    return () => {}
  }, [currentTime, flightInstances, airports, map])

  // Render flight paths
  return (
    <>
      {flightInstances
        .filter((f) => {
          if (!currentTime) return false
          const dept = new Date(f.departureTime)
          const arr = new Date(f.arrivalTime)
          return currentTime >= dept && currentTime <= arr
        })
        .map((flight) => {
          const origin = airports.find(
            (a) =>
              a.id === flight.originAirport?.id || a.codeIATA === flight.originAirport?.codeIATA
          )
          const dest = airports.find(
            (a) =>
              a.id === flight.destinationAirport?.id ||
              a.codeIATA === flight.destinationAirport?.codeIATA
          )
          if (!origin || !dest) return null

          return (
            <Polyline
              key={`path-${flight.instanceId}`}
              positions={[
                [parseFloat(origin.latitude), parseFloat(origin.longitude)],
                [parseFloat(dest.latitude), parseFloat(dest.longitude)],
              ]}
              color="#ef4444"
              weight={1.5}
              opacity={0.4}
              dashArray="5,10"
            />
          )
        })}
    </>
  )
}

// ====================== Main Component ======================
export function CollapseSimulationPage() {
  const navigate = useNavigate()

  // Config modal
  const [showConfigModal, setShowConfigModal] = useState(true)
  const [configStartDate, setConfigStartDate] = useState(new Date().toISOString().slice(0, 16))

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [simulationStartDate, setSimulationStartDate] = useState<Date | null>(null)
  const [currentSimTime, setCurrentSimTime] = useState<Date | null>(null)
  const [dayCount, setDayCount] = useState(0)

  // Speed control (minutes per real second)
  const [playbackSpeed, setPlaybackSpeed] = useState(15) // 15 min per second (fastest for collapse)

  // Algorithm state
  const [algorithmRunning, setAlgorithmRunning] = useState(false)
  const algorithmRunningRef = useRef(false)
  const lastAlgorithmDayRef = useRef(-1)

  // Collapse detection
  const [hasCollapsed, setHasCollapsed] = useState(false)
  const [collapseDay, setCollapseDay] = useState<number | null>(null)
  const [collapseReason, setCollapseReason] = useState<string>('')
  const [showResultModal, setShowResultModal] = useState(false)

  // KPIs accumulated
  const [kpi, setKpi] = useState({
    totalOrders: 0,
    assignedOrders: 0,
    unassignedOrders: 0,
    totalProducts: 0,
    assignedProducts: 0,
    unassignedProducts: 0,
    slaViolationPercentage: 0,
    ordersLate: 0, // Count of orders that violated SLA
  })

  // Flight visualization
  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [instanceHasProducts, setInstanceHasProducts] = useState<Record<string, boolean>>({})
  const [orders, setOrders] = useState<OrderSchema[]>([])

  // UI
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<'flights' | 'orders'>('flights')
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderSchema | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)

  // Demo affected airports
  const [demoAffectedAirports, setDemoAffectedAirports] = useState<AffectedAirport[]>([])
  const [showDemoOverlay, setShowDemoOverlay] = useState(false)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startRealTimeRef = useRef<number>(0)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const currentSimTimeRef = useRef<Date | null>(null)

  // Keep currentSimTimeRef in sync
  useEffect(() => {
    currentSimTimeRef.current = currentSimTime
  }, [currentSimTime])

  // Load airports
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []

  const MAIN_HUB_CODES = ['SPIM', 'EBCI', 'UBBB']
  const mainWarehouses = airports.filter(
    (airport: any) => airport.codeIATA && MAIN_HUB_CODES.includes(airport.codeIATA.toUpperCase())
  )

  const bounds =
    airports.length > 0
      ? L.latLngBounds(
          airports.map(
            (a: any) => [parseFloat(a.latitude), parseFloat(a.longitude)] as LatLngTuple
          )
        )
      : L.latLngBounds([
          [-60, -180],
          [70, 180],
        ])

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  // Generate flight instances for a given day
  const generateFlightInstancesForDay = useCallback(
    async (dayNumber: number, baseDate: Date) => {
      try {
        const response = await simulationService.getFlightStatuses()
        const flightStatuses: FlightStatus[] = response.flights || []

        const instances: FlightInstance[] = []
        const dayStart = new Date(baseDate)
        dayStart.setHours(0, 0, 0, 0)
        dayStart.setDate(dayStart.getDate() + dayNumber)

        for (const flight of flightStatuses) {
          if (!flight.departureTime) continue

          const [hours, minutes] = flight.departureTime.split(':').map(Number)

          const departureTime = new Date(dayStart)
          departureTime.setHours(hours, minutes, 0, 0)

          const flightDuration = (flight.transportTimeDays || 0.1) * 24 * 60 * 60 * 1000
          const arrivalTime = new Date(departureTime.getTime() + flightDuration)

          const instanceId = `FL-${flight.id}-DAY-${dayNumber}-${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`

          instances.push({
            instanceId,
            flightId: flight.id,
            flightCode: flight.code,
            departureTime: departureTime.toISOString(),
            arrivalTime: arrivalTime.toISOString(),
            status: 'SCHEDULED',
            originAirport: flight.originAirportSchema,
            destinationAirport: flight.destinationAirportSchema,
            maxCapacity: flight.maxCapacity,
            usedCapacity: 0,
          })
        }

        return instances
      } catch (error) {
        console.error('Error generating flight instances:', error)
        return []
      }
    },
    []
  )

  // Run algorithm for a specific day (without persisting)
  const runCollapseAlgorithm = useCallback(
    async (simTime: Date, dayNumber: number) => {
      if (!simulationStartDate || algorithmRunningRef.current || hasCollapsed) return

      setAlgorithmRunning(true)
      algorithmRunningRef.current = true

      try {
        console.group(
          `%c📊 Collapse Algorithm - Day ${dayNumber + 1}`,
          'color: #ef4444; font-weight: bold; font-size: 14px'
        )
        console.log('Simulation time:', simTime.toISOString())

        // Format sim time as LOCAL time
        const year = simTime.getFullYear()
        const month = String(simTime.getMonth() + 1).padStart(2, '0')
        const day = String(simTime.getDate()).padStart(2, '0')
        const hours = String(simTime.getHours()).padStart(2, '0')
        const minutes = String(simTime.getMinutes()).padStart(2, '0')
        const seconds = String(simTime.getSeconds()).padStart(2, '0')
        const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

        // Execute algorithm (24 hour window for collapse scenario)
        const response = await simulationService.executeDaily({
          simulationStartTime: localTimeString,
          simulationDurationHours: 24,
          useDatabase: true,
          simulationSpeed: playbackSpeed,
          persist: true, // Persist to DB so unassigned orders accumulate for next day
        })

        console.log('Response:', response)
        console.groupEnd()

        // Update KPIs
        const newTotalOrders = (kpi.totalOrders || 0) + (response.totalOrders || 0)
        const newAssigned = (kpi.assignedOrders || 0) + (response.assignedOrders || 0)
        const newUnassigned = (kpi.unassignedOrders || 0) + (response.unassignedOrders || 0)
        const unassignedRatio = newTotalOrders > 0 ? newUnassigned / newTotalOrders : 0
        const slaViolation = response.slaViolationPercentage || 0
        const ordersLate = response.ordersLate || 0 // Number of orders that violated SLA

        setKpi({
          totalOrders: newTotalOrders,
          assignedOrders: newAssigned,
          unassignedOrders: newUnassigned,
          totalProducts: (kpi.totalProducts || 0) + (response.totalProducts || 0),
          assignedProducts: (kpi.assignedProducts || 0) + (response.assignedProducts || 0),
          unassignedProducts: (kpi.unassignedProducts || 0) + (response.unassignedProducts || 0),
          slaViolationPercentage: slaViolation,
          ordersLate: (kpi.ordersLate || 0) + ordersLate,
        })

        // Check collapse conditions - collapse as soon as 1 order violates SLA
        if (ordersLate > 0) {
          console.log(`💥 COLLAPSE: ${ordersLate} order(s) violated SLA`)
          setHasCollapsed(true)
          setCollapseDay(dayNumber + 1)
          setCollapseReason('SLA_BREACH')
          setShowResultModal(true)
          setIsRunning(false)
          toast.error(`Sistema colapsó en el día ${dayNumber + 1}: ${ordersLate} orden(es) fuera de SLA`)
          return
        }

        if (unassignedRatio >= MAX_UNASSIGNED_RATIO) {
          console.log(
            `💥 COLLAPSE: Unassigned ratio ${(unassignedRatio * 100).toFixed(1)}% >= ${MAX_UNASSIGNED_RATIO * 100}%`
          )
          setHasCollapsed(true)
          setCollapseDay(dayNumber + 1)
          setCollapseReason('UNASSIGNED_ORDERS')
          setShowResultModal(true)
          setIsRunning(false)
          toast.error(`Sistema colapsó en el día ${dayNumber + 1}: Órdenes acumuladas`)
          return
        }

        // Load flight instances for next day
        const newInstances = await generateFlightInstancesForDay(dayNumber + 1, simulationStartDate)
        setFlightInstances((prev) => [...prev, ...newInstances])

        toast.success(`Día ${dayNumber + 1}: ${response.assignedOrders || 0} órdenes asignadas`)
      } catch (error: any) {
        console.error('Error running collapse algorithm:', error)
        toast.error('Error durante la simulación')
      } finally {
        // Recalculate startRealTimeRef to avoid time jump after algorithm finishes
        // We want the sim clock to continue from where it was (current simTime)
        if (simulationStartDate && currentSimTimeRef.current) {
          const simElapsed = currentSimTimeRef.current.getTime() - simulationStartDate.getTime()
          const realSecondsNeeded = simElapsed / (playbackSpeed * 60 * 1000)
          startRealTimeRef.current = Date.now() - realSecondsNeeded * 1000
        }
        
        setAlgorithmRunning(false)
        algorithmRunningRef.current = false
      }
    },
    [simulationStartDate, hasCollapsed, kpi, playbackSpeed, generateFlightInstancesForDay]
  )

  // Reference for algorithm function
  const runCollapseAlgorithmRef = useRef(runCollapseAlgorithm)
  useEffect(() => {
    runCollapseAlgorithmRef.current = runCollapseAlgorithm
  }, [runCollapseAlgorithm])

  // Simulation clock tick
  const tick = useCallback(() => {
    if (!simulationStartDate || hasCollapsed) return
    
    // BUFFER: Don't advance time while algorithm is running
    if (algorithmRunningRef.current) {
      return
    }

    const elapsedRealSeconds = (Date.now() - startRealTimeRef.current) / 1000
    const simMinutesElapsed = elapsedRealSeconds * playbackSpeed
    const newSimTime = new Date(simulationStartDate.getTime() + simMinutesElapsed * 60 * 1000)

    setCurrentSimTime(newSimTime)

    // Calculate current day
    const currentDay = Math.floor(
      (newSimTime.getTime() - simulationStartDate.getTime()) / (24 * 60 * 60 * 1000)
    )
    setDayCount(currentDay)

    // Trigger algorithm at start of each new day (with buffer - wait for previous to finish)
    if (currentDay > lastAlgorithmDayRef.current && !algorithmRunningRef.current) {
      // Set last algorithm day immediately to prevent duplicate triggers
      lastAlgorithmDayRef.current = currentDay
      
      // Calculate day start time
      const dayStart = new Date(simulationStartDate)
      dayStart.setDate(dayStart.getDate() + currentDay)
      dayStart.setHours(0, 0, 0, 0)
      
      // Small delay to allow UI to update before heavy algorithm execution
      setTimeout(() => {
        runCollapseAlgorithmRef.current(dayStart, currentDay)
      }, 50)
    }
  }, [simulationStartDate, playbackSpeed, hasCollapsed])

  // Start/stop simulation clock
  useEffect(() => {
    if (isRunning && !hasCollapsed) {
      intervalRef.current = setInterval(tick, 100) // 10 FPS for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, tick, hasCollapsed])

  // Handle start
  const handleStart = useCallback(async () => {
    const startDate = new Date(configStartDate)

    setShowConfigModal(false)
    setIsRunning(true)
    setHasCollapsed(false)
    setCollapseDay(null)
    setCollapseReason('')
    setSimulationStartDate(startDate)
    setCurrentSimTime(startDate)
    setDayCount(0)
    lastAlgorithmDayRef.current = -1
    startRealTimeRef.current = Date.now()

    // Reset KPIs
    setKpi({
      totalOrders: 0,
      assignedOrders: 0,
      unassignedOrders: 0,
      totalProducts: 0,
      assignedProducts: 0,
      unassignedProducts: 0,
      slaViolationPercentage: 0,
      ordersLate: 0,
    })

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    // Load initial flight instances (day 0)
    const initialInstances = await generateFlightInstancesForDay(0, startDate)
    setFlightInstances(initialInstances)

    toast.info('Simulación de colapso iniciada')
  }, [configStartDate, generateFlightInstancesForDay])

  // Handle stop
  const handleStop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // If stopped manually without collapse, show success
    if (!hasCollapsed && dayCount > 0) {
      setShowResultModal(true)
    }
  }, [hasCollapsed, dayCount])

  // Format time for display
  const formatSimTime = (date: Date | null) => {
    if (!date) return '--:--'
    return date.toLocaleString('es-PE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  // Active flights count
  const activeFlightsCount = useMemo(() => {
    if (!currentSimTime) return 0
    return flightInstances.filter((f) => {
      const dept = new Date(f.departureTime)
      const arr = new Date(f.arrivalTime)
      return currentSimTime >= dept && currentSimTime <= arr
    }).length
  }, [currentSimTime, flightInstances])

  // Get status
  const getStatus = (): 'idle' | 'running' | 'collapsed' | 'success' => {
    if (hasCollapsed) return 'collapsed'
    if (isRunning) return 'running'
    if (dayCount > 0 && !isRunning) return 'success'
    return 'idle'
  }

  const getStatusText = () => {
    const status = getStatus()
    if (status === 'running') return '● Ejecutando'
    if (status === 'collapsed') return 'Colapsado'
    if (status === 'success') return 'Completado'
    return '○ Detenido'
  }

  // Demo preview with dummy data
  const handleDemoPreview = useCallback(() => {
    // Set demo data
    setKpi({
      totalOrders: 847,
      assignedOrders: 661,
      unassignedOrders: 186,
      totalProducts: 2527,
      assignedProducts: 2341,
      unassignedProducts: 186,
      slaViolationPercentage: 11.8,
      ordersLate: 276,
    })
    setHasCollapsed(true)
    setCollapseDay(12)
    setCollapseReason('SLA_BREACH')
    setDayCount(12)
    
    // Set demo affected airports - these show on the map
    const demoAirports: AffectedAirport[] = [
      {
        airportCode: 'SPIM',
        airportName: 'Jorge Chávez',
        cityName: 'Lima',
        latitude: -12.0219,
        longitude: -77.1143,
        unassignedProducts: 87,
        affectedOrders: 42,
        severity: 'critical',
        reason: 'Capacidad excedida',
      },
      {
        airportCode: 'EBCI',
        airportName: 'Brussels-Charleroi',
        cityName: 'Charleroi',
        latitude: 50.4592,
        longitude: 4.4538,
        unassignedProducts: 45,
        affectedOrders: 23,
        severity: 'high',
        reason: 'Vuelos saturados',
      },
      {
        airportCode: 'UBBB',
        airportName: 'Heydar Aliyev',
        cityName: 'Baku',
        latitude: 40.4675,
        longitude: 50.0467,
        unassignedProducts: 31,
        affectedOrders: 18,
        severity: 'medium',
        reason: 'Demoras de conexión',
      },
      {
        airportCode: 'SPJC',
        airportName: 'Cajamarca',
        cityName: 'Cajamarca',
        latitude: -7.139,
        longitude: -78.489,
        unassignedProducts: 12,
        affectedOrders: 8,
        severity: 'low',
        reason: 'Baja frecuencia',
      },
      {
        airportCode: 'SPHY',
        airportName: 'Andahuaylas',
        cityName: 'Andahuaylas',
        latitude: -13.706,
        longitude: -73.350,
        unassignedProducts: 11,
        affectedOrders: 6,
        severity: 'medium',
        reason: 'Rutas limitadas',
      },
    ]
    setDemoAffectedAirports(demoAirports)
    setShowDemoOverlay(true)
    setShowResultModal(true)
    setShowConfigModal(false)
    toast.info('Vista previa con datos de ejemplo')
  }, [])

  return (
    <Wrapper>
      {/* Config Modal */}
      <ModalOverlay $show={showConfigModal && !isRunning}>
        <ModalContent>
          <ModalTitle>Simulación de Colapso</ModalTitle>
          <ModalSubtitle>
            Ejecuta el algoritmo día a día hasta detectar el punto de quiebre del sistema.
            <br />
            <br />
            <strong>Criterios de colapso:</strong>
            <br />• SLA: Al detectar 1 orden fuera de tiempo
            <br />• Acumulación: &gt;{MAX_UNASSIGNED_RATIO * 100}% de órdenes sin asignar
          </ModalSubtitle>

          <FormGroup>
            <Label>Fecha de inicio</Label>
            <Input
              type="datetime-local"
              value={configStartDate}
              onChange={(e) => setConfigStartDate(e.target.value)}
            />
          </FormGroup>

          <InfoBox>
            La simulación corre el algoritmo completo día a día, acumulando órdenes no asignadas
            como en la realidad.
          </InfoBox>

          <ButtonRow>
            <ModalButton onClick={() => navigate('/simulacion/semanal')}>Cancelar</ModalButton>
            <ModalButton $primary onClick={handleStart}>
              Iniciar Simulación
            </ModalButton>
          </ButtonRow>
        </ModalContent>
      </ModalOverlay>

      {/* Result Modal */}
      <ModalOverlay $show={showResultModal}>
        <ResultModal>
          <ResultHeader $collapsed={hasCollapsed}>
            <ResultIcon $collapsed={hasCollapsed}>{hasCollapsed ? '✕' : '✓'}</ResultIcon>
            <ResultTitle>{hasCollapsed ? 'Sistema Colapsó' : 'Sin Colapso'}</ResultTitle>
            <ResultSubtitle>
              {hasCollapsed
                ? `Día ${collapseDay}: ${kpi.ordersLate} orden(es) fuera de SLA`
                : `${dayCount} días simulados sin problemas`}
            </ResultSubtitle>
          </ResultHeader>

          <ResultBody>
            {hasCollapsed && (
              <ResultSection>
                <ResultSectionTitle>Razón</ResultSectionTitle>
                <ReasonBadge>{formatCollapseReason(collapseReason)}</ReasonBadge>
              </ResultSection>
            )}

            <ResultSection>
              <ResultSectionTitle>Estadísticas</ResultSectionTitle>
              <ResultGrid>
                <ResultCard>
                  <ResultCardValue>{kpi.totalOrders}</ResultCardValue>
                  <ResultCardLabel>Órdenes totales</ResultCardLabel>
                </ResultCard>
                <ResultCard $highlight={kpi.unassignedOrders > 0}>
                  <ResultCardValue $danger={kpi.unassignedOrders > 0}>
                    {kpi.unassignedOrders}
                  </ResultCardValue>
                  <ResultCardLabel>Sin asignar</ResultCardLabel>
                </ResultCard>
                <ResultCard>
                  <ResultCardValue>{dayCount}</ResultCardValue>
                  <ResultCardLabel>Días simulados</ResultCardLabel>
                </ResultCard>
                <ResultCard>
                  <ResultCardValue>
                    {kpi.totalOrders > 0
                      ? ((kpi.assignedOrders / kpi.totalOrders) * 100).toFixed(0)
                      : 100}
                    %
                  </ResultCardValue>
                  <ResultCardLabel>Asignación</ResultCardLabel>
                </ResultCard>
              </ResultGrid>
            </ResultSection>
          </ResultBody>

          <ResultFooter>
            <ModalButton
              onClick={() => {
                setShowResultModal(false)
                setShowConfigModal(true)
              }}
            >
              Nueva Simulación
            </ModalButton>
            <ModalButton $primary onClick={() => setShowResultModal(false)}>
              Ver Mapa
            </ModalButton>
          </ResultFooter>
        </ResultModal>
      </ModalOverlay>

      <Header>
        <TitleBlock>
          <Title>Simulación de Colapso</Title>
          <Subtitle>Detecta el punto de quiebre ejecutando día a día</Subtitle>
        </TitleBlock>

        <HeaderRight>
          <StatusBadge $status={getStatus()}>{getStatusText()}</StatusBadge>
          {dayCount > 0 && <DayBadge>Día {dayCount + 1}</DayBadge>}
          {isRunning ? (
            <ControlButton $variant="danger" onClick={handleStop}>
              Detener
            </ControlButton>
          ) : (
            <>
              <ControlButton $variant="demo" onClick={handleDemoPreview}>
                Demo
              </ControlButton>
              <ControlButton $variant="play" onClick={() => setShowConfigModal(true)}>
                Configurar
              </ControlButton>
            </>
          )}
        </HeaderRight>
      </Header>

      <MapWrapper>
        {/* Simulation Controls - when running or has result */}
        {(isRunning || dayCount > 0) && currentSimTime && (
          <SimulationControls>
            <ClockLabel>Tiempo Simulación</ClockLabel>
            <Clock>{formatSimTime(currentSimTime)}</Clock>

            {/* Speed control */}
            <SpeedControl>
              <SpeedLabel>Velocidad:</SpeedLabel>
              {SPEED_OPTIONS.map((opt) => (
                <SpeedToggle
                  key={opt.value}
                  $active={playbackSpeed === opt.value}
                  onClick={() => setPlaybackSpeed(opt.value)}
                  disabled={!isRunning}
                >
                  {opt.label}
                </SpeedToggle>
              ))}
            </SpeedControl>

            <StatsRow>
              <StatLine>
                <span>Día:</span>
                <strong>{dayCount + 1}</strong>
              </StatLine>
              <StatLine>
                <span>Vuelos activos:</span>
                <strong>{activeFlightsCount}</strong>
              </StatLine>
              <StatLine>
                <span>Órdenes:</span>
                <strong>
                  {kpi.assignedOrders}/{kpi.totalOrders}
                </strong>
              </StatLine>
              <StatLine>
                <span>Sin asignar:</span>
                <strong style={{ color: kpi.unassignedOrders > 0 ? '#dc2626' : 'inherit' }}>
                  {kpi.unassignedOrders}
                </strong>
              </StatLine>
            </StatsRow>

            {algorithmRunning && <WarningBadge>Ejecutando algoritmo...</WarningBadge>}
          </SimulationControls>
        )}

        {/* Flight Drawer */}
        {(isRunning || dayCount > 0) && simulationStartDate && (
          <FlightDrawer
            isOpen={panelOpen}
            onToggle={() => setPanelOpen(!panelOpen)}
            panelTab={panelTab}
            onTabChange={setPanelTab}
            flightInstances={flightInstances}
            instanceHasProducts={instanceHasProducts}
            simulationStartTime={simulationStartDate}
            activeFlightsCount={activeFlightsCount}
            onFlightClick={(f) => setSelectedFlight({ id: f.flightId, code: f.flightCode })}
            onOrderClick={(order) => setSelectedOrder(order)}
            orders={orders}
            loadingOrders={false}
          />
        )}

        <MapContainer
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          minZoom={2}
          maxZoom={8}
        >
          <Pane name="airports" style={{ zIndex: 500 }} />
          <Pane name="main-hubs" style={{ zIndex: 600 }} />
          <Pane name="flights" style={{ zIndex: 700 }} />
          <Pane name="affected-airports" style={{ zIndex: 800 }} />

          <TileLayer url={tileUrl} noWrap={true} />

          {/* Animated planes */}
          {(isRunning || dayCount > 0) && (
            <AnimatedPlanes
              flightInstances={flightInstances}
              currentTime={currentSimTime}
              airports={airports}
            />
          )}

          {/* Main hubs */}
          {mainWarehouses.map((airport: any) => (
            <CircleMarker
              key={`hub-${airport.id}`}
              center={[parseFloat(airport.latitude), parseFloat(airport.longitude)]}
              radius={10}
              color="#ebc725"
              fillColor="#f6b53b"
              fillOpacity={0.95}
              weight={2.5}
              pane="main-hubs"
              eventHandlers={{ click: () => setSelectedAirport(mapAirportToSimAirport(airport)) }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <strong>{airport.cityName}</strong> (Hub)
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Regular airports */}
          {airports
            .filter((a) => !MAIN_HUB_CODES.includes(a.codeIATA?.toUpperCase()))
            .map((airport: any) => (
              <CircleMarker
                key={airport.id}
                center={[parseFloat(airport.latitude), parseFloat(airport.longitude)]}
                radius={5}
                color="#14b8a6"
                fillColor="#14b8a6"
                fillOpacity={0.7}
                weight={1.5}
                pane="airports"
                eventHandlers={{ click: () => setSelectedAirport(mapAirportToSimAirport(airport)) }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {airport.cityName}
                </Tooltip>
              </CircleMarker>
            ))}

          {/* Affected airports from demo or collapse */}
          {showDemoOverlay && demoAffectedAirports.map((affected) => {
            const severityColors: Record<string, string> = {
              critical: '#dc2626',
              high: '#ea580c',
              medium: '#ca8a04',
              low: '#16a34a',
            }
            const color = severityColors[affected.severity] || '#dc2626'
            const radius = affected.severity === 'critical' ? 18 : affected.severity === 'high' ? 15 : 12
            
            return (
              <CircleMarker
                key={`affected-${affected.airportCode}`}
                center={[affected.latitude, affected.longitude]}
                radius={radius}
                color={color}
                fillColor={color}
                fillOpacity={0.4}
                weight={3}
                pane="affected-airports"
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={affected.severity === 'critical'}>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ color }}>{affected.airportCode}</strong>
                    <br />
                    <span style={{ fontSize: '11px' }}>{affected.unassignedProducts} productos sin asignar</span>
                    <br />
                    <span style={{ fontSize: '10px', color: '#666' }}>{affected.reason}</span>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Legend */}
        <MapLegend>
          <LegendTitle>Leyenda</LegendTitle>
          <LegendItem>
            <LegendDot $color="#f6b53b" />
            <span>Hub principal</span>
          </LegendItem>
          <LegendItem>
            <LegendDot $color="#14b8a6" />
            <span>Aeropuerto</span>
          </LegendItem>
          <LegendItem>
            <LegendDot $color="#ef4444" />
            <span>Vuelo activo</span>
          </LegendItem>
          {showDemoOverlay && (
            <>
              <LegendItem>
                <LegendDot $color="#dc2626" />
                <span>Crítico</span>
              </LegendItem>
              <LegendItem>
                <LegendDot $color="#ea580c" />
                <span>Alto</span>
              </LegendItem>
              <LegendItem>
                <LegendDot $color="#ca8a04" />
                <span>Medio</span>
              </LegendItem>
              <LegendItem>
                <LegendDot $color="#16a34a" />
                <span>Bajo</span>
              </LegendItem>
            </>
          )}
        </MapLegend>

        {/* Affected Airports Panel */}
        {showDemoOverlay && demoAffectedAirports.length > 0 && (
          <AffectedPanel>
            <AffectedPanelHeader>
              <CloseAffectedPanelButton onClick={() => {
                setShowDemoOverlay(false)
                setDemoAffectedAirports([])
              }}>
                ×
              </CloseAffectedPanelButton>
              <AffectedPanelTitle>⚠️ Aeropuertos Afectados</AffectedPanelTitle>
              <AffectedPanelSubtitle>
                {demoAffectedAirports.length} aeropuertos con problemas de capacidad
              </AffectedPanelSubtitle>
            </AffectedPanelHeader>
            <AffectedPanelBody>
              {demoAffectedAirports
                .sort((a, b) => {
                  const order = { critical: 0, high: 1, medium: 2, low: 3 }
                  return order[a.severity] - order[b.severity]
                })
                .map((airport) => (
                  <AffectedAirportCard key={airport.airportCode} $severity={airport.severity}>
                    <AffectedAirportName>
                      {airport.cityName}
                      <AffectedAirportCode>{airport.airportCode}</AffectedAirportCode>
                      <SeverityBadge $severity={airport.severity}>
                        {airport.severity === 'critical' ? 'Crítico' : 
                         airport.severity === 'high' ? 'Alto' :
                         airport.severity === 'medium' ? 'Medio' : 'Bajo'}
                      </SeverityBadge>
                    </AffectedAirportName>
                    <AffectedAirportStats>
                      <span>📦 {airport.unassignedProducts} productos</span>
                      <span>🧾 {airport.affectedOrders} órdenes</span>
                    </AffectedAirportStats>
                    <AffectedAirportReason>{airport.reason}</AffectedAirportReason>
                  </AffectedAirportCard>
                ))}
            </AffectedPanelBody>
          </AffectedPanel>
        )}
      </MapWrapper>

      {/* Modals */}
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

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </Wrapper>
  )
}
