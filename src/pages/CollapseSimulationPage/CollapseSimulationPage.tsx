import { useState, useCallback, useRef, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Pane } from 'react-leaflet'
import L, { type LatLngTuple, DivIcon, Marker } from 'leaflet'
import { useAirports } from '../../hooks/api/useAirports'
import { 
  simulationService, 
  type CollapseSimulationResult,
  type CollapseVisualDayResult,
  type FlightStatus,
  type FlightInstance,
  type FlightInstanceDTO
} from '../../api/simulationService'
import { toast } from 'react-toastify'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import { OrderDetailsModal } from '../../components/OrderDetailsModal'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import { useSimulationStore } from '../../store/useSimulationStore'
import type { SimAirport } from '../../hooks/useFlightSimulation'
import type { Continent } from '../../types/Continent'
import '../WeeklySimulationPage/index.css'

// ====================== Constants ======================
const DEFAULT_START_DATE = new Date('2025-01-02T00:00:00')
const SPEED_OPTIONS = [
  { label: '15min/s', value: 15 },
  { label: '30min/s', value: 30 },
]

// ====================== Animations ======================
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`

const collapseFlash = keyframes`
  0%, 100% { background: rgba(239, 68, 68, 0.1); }
  50% { background: rgba(239, 68, 68, 0.3); }
`

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
  padding: 16px 24px;
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
  gap: 2px;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 22px;
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

const StatusBadge = styled.div<{ $status: 'idle' | 'running' | 'paused' | 'collapsed' | 'completed' }>`
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => {
    if (p.$status === 'running') return '#d1fae5'
    if (p.$status === 'paused') return '#fed7aa'
    if (p.$status === 'collapsed') return '#fee2e2'
    if (p.$status === 'completed') return '#dbeafe'
    return '#f3f4f6'
  }};
  color: ${(p) => {
    if (p.$status === 'running') return '#065f46'
    if (p.$status === 'paused') return '#92400e'
    if (p.$status === 'collapsed') return '#991b1b'
    if (p.$status === 'completed') return '#1e40af'
    return '#6b7280'
  }};
`

const ControlButton = styled.button<{ $variant?: 'play' | 'pause' | 'stop' | 'demo' | 'reset' }>`
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  background: ${(p) => {
    if (p.$variant === 'play') return '#10b981'
    if (p.$variant === 'pause') return '#f59e0b'
    if (p.$variant === 'stop') return '#ef4444'
    if (p.$variant === 'demo') return '#8b5cf6'
    if (p.$variant === 'reset') return '#6b7280'
    return '#e5e7eb'
  }};
  color: ${(p) => p.$variant ? 'white' : '#374151'};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const MapWrapper = styled.div<{ $collapsed?: boolean }>`
  width: 100%;
  height: 70vh;
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  ${(p) => p.$collapsed && css`animation: ${collapseFlash} 1s ease-in-out infinite;`}
`

const SimulationControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.97);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;
  max-width: 320px;
`

const ClockBox = styled.div<{ $danger?: boolean }>`
  padding: 14px;
  background: ${(p) => p.$danger 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)'};
  border-radius: 10px;
  color: white;
`

const ClockLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-bottom: 4px;
`

const ClockValue = styled.div`
  font-size: 26px;
  font-weight: 900;
  font-family: 'Courier New', monospace;
`

const ClockSubvalue = styled.div`
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
`

const DayCounter = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;
  align-items: baseline;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 8px;
`

const DayNumber = styled.span`
  font-size: 32px;
  font-weight: 900;
  color: #111827;
`

const DayLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`

const ProgressSection = styled.div`
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`

const ProgressLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 8px;
`

const ProgressBar = styled.div`
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`

const ProgressFill = styled.div<{ $percent: number; $status: string }>`
  height: 100%;
  width: ${(p) => Math.min(p.$percent, 100)}%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
  background: ${(p) => {
    if (p.$status === 'COLLAPSED') return '#ef4444'
    if (p.$status === 'CRITICAL') return '#f97316'
    if (p.$status === 'WARNING') return '#eab308'
    return '#10b981'
  }};
`

const ProgressValue = styled.div`
  font-size: 12px;
  color: #374151;
  margin-top: 4px;
  text-align: right;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const StatCard = styled.div<{ $highlight?: boolean }>`
  padding: 10px;
  background: ${(p) => p.$highlight ? '#fef2f2' : '#f9fafb'};
  border: 1px solid ${(p) => p.$highlight ? '#fecaca' : '#e5e7eb'};
  border-radius: 8px;
  text-align: center;
`

const StatValue = styled.div<{ $danger?: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${(p) => p.$danger ? '#dc2626' : '#111827'};
`

const StatLabel = styled.div`
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
`

const SpeedControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SpeedLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
`

const SpeedButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
`

const SpeedButton = styled.button<{ $active: boolean }>`
  padding: 6px 8px;
  border: 2px solid ${(p) => p.$active ? '#14b8a6' : '#e5e7eb'};
  background: ${(p) => p.$active ? '#d1fae5' : 'white'};
  color: ${(p) => p.$active ? '#065f46' : '#6b7280'};
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: #14b8a6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  border-radius: 12px;
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`

const LoadingText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
`

const LoadingSubtext = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
`

const CollapseOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  border-radius: 12px;
`

const CollapseIcon = styled.div`
  font-size: 64px;
  animation: ${pulse} 1s ease-in-out infinite;
`

const CollapseTitle = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: #dc2626;
  margin-top: 16px;
`

const CollapseSubtitle = styled.div`
  font-size: 16px;
  color: #7f1d1d;
  margin-top: 8px;
`

// Modal Styles
const ModalOverlay = styled.div<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: ${(p) => p.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: white;
  padding: 28px;
  border-radius: 16px;
  max-width: 480px;
  width: calc(100% - 32px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
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

const ModalInfoBox = styled.div`
  padding: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  margin-bottom: 20px;
`

const ModalInfoTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 4px;
`

const ModalInfoText = styled.div`
  font-size: 12px;
  color: #3b82f6;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`

const ModalButton = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  border: ${(p) => (p.$primary || p.$danger) ? 'none' : '1px solid #d1d5db'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => {
    if (p.$primary) return '#14b8a6'
    if (p.$danger) return '#8b5cf6'
    return 'white'
  }};
  color: ${(p) => (p.$primary || p.$danger) ? 'white' : '#374151'};

  &:hover {
    transform: translateY(-1px);
  }
`

// Result Modal
const ResultModal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 520px;
  width: calc(100% - 32px);
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
`

const ResultHeader = styled.div<{ $collapsed: boolean }>`
  text-align: center;
  padding: 28px 24px;
  background: ${(p) => p.$collapsed
    ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'};
`

const ResultIcon = styled.div`
  font-size: 48px;
  margin-bottom: 8px;
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
  max-height: 350px;
  overflow-y: auto;
`

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`

const ResultCard = styled.div<{ $highlight?: boolean }>`
  padding: 14px;
  background: ${(p) => p.$highlight ? '#fef2f2' : '#f9fafb'};
  border: 1px solid ${(p) => p.$highlight ? '#fecaca' : '#e5e7eb'};
  border-radius: 10px;
  text-align: center;
`

const ResultCardValue = styled.div<{ $danger?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.$danger ? '#dc2626' : '#111827'};
`

const ResultCardLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Bezier curve helpers
function computeControlPoint(a: LatLngTuple, b: LatLngTuple, curvature = 0.25): LatLngTuple {
  const latMid = (a[0] + b[0]) / 2
  const lngMid = (a[1] + b[1]) / 2
  const scale = Math.cos(((a[0] + b[0]) * Math.PI) / 360)
  const dx = (b[1] - a[1]) * scale
  const dy = b[0] - a[0]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = curvature * len
  return [latMid + ny * offset, lngMid + (nx * offset) / (scale || 1e-6)]
}

function bezierPoint(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  return [
    oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * p1[0] + t * t * p2[0],
    oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * p1[1] + t * t * p2[1],
  ]
}

function bezierTangent(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  return [
    2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
    2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
  ]
}

// Calculate bearing (heading) between two points
function calculateBearing(start: LatLngTuple, end: LatLngTuple): number {
  const lat1 = (start[0] * Math.PI) / 180
  const lat2 = (end[0] * Math.PI) / 180
  const dLng = ((end[1] - start[1]) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}

// ====================== AnimatedFlights Component ======================
interface AnimatedFlightsProps {
  flightInstances: FlightInstance[]
  currentSimTime: Date
  isPlaying: boolean
  playbackSpeed: number
}

function AnimatedFlights({ flightInstances, currentSimTime }: AnimatedFlightsProps) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const lastUpdateRef = useRef<number>(0)

  // Update flight positions based on current simulation time
  useEffect(() => {
    if (!map || flightInstances.length === 0) return

    const now = Date.now()
    // Throttle updates to 60fps max
    if (now - lastUpdateRef.current < 16) return
    lastUpdateRef.current = now

    const currentTimeMs = currentSimTime.getTime()
    
    // Get flights that should be visible (in flight right now)
    const activeFlights = flightInstances.filter((f) => {
      const deptTime = new Date(f.departureTime).getTime()
      const arrTime = new Date(f.arrivalTime).getTime()
      return currentTimeMs >= deptTime && currentTimeMs <= arrTime &&
             f.originAirport?.latitude && f.destinationAirport?.latitude
    }).slice(0, 1000) // Increased limit to prevent disappearing planes on zoom

    // Track which flights are currently shown
    const activeIds = new Set(activeFlights.map(f => f.instanceId))

    // Remove markers for flights that are no longer active
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Update or add markers for active flights
    activeFlights.forEach((flight) => {
      const origin: LatLngTuple = [flight.originAirport.latitude, flight.originAirport.longitude]
      const dest: LatLngTuple = [flight.destinationAirport.latitude, flight.destinationAirport.longitude]
      
      const deptTime = new Date(flight.departureTime).getTime()
      const arrTime = new Date(flight.arrivalTime).getTime()
      const totalDuration = arrTime - deptTime
      const elapsed = currentTimeMs - deptTime
      const progress = Math.min(1, Math.max(0, elapsed / totalDuration))
      
      // Calculate bezier position
      const ctrl = computeControlPoint(origin, dest)
      const pos = bezierPoint(progress, origin, ctrl, dest)
      
      // Calculate bearing from tangent of Bezier curve for accurate direction
      const tangent = bezierTangent(progress, origin, ctrl, dest)
      const bearing = (Math.atan2(tangent[1], tangent[0]) * 180) / Math.PI
      const adjustedBearing = (bearing + 90) % 360

      if (markersRef.current[flight.instanceId]) {
        // Update existing marker position and rotation
        const marker = markersRef.current[flight.instanceId]
        marker.setLatLng(pos)
        
        // Update rotation
        const icon = marker.getIcon() as DivIcon
        const img = icon.options.html
        if (typeof img === 'string') {
           const newHtml = img.replace(/rotate\([\d.-]+deg\)/, `rotate(${adjustedBearing}deg)`)
           if (newHtml !== img) {
             const newIcon = new DivIcon({
               ...icon.options,
               html: newHtml
             })
             marker.setIcon(newIcon)
           }
        }
      } else {
        // Create new marker with airplane icon
        const planeHTML = `<img src="/airplane.png" alt="✈" style="width:24px;height:24px;display:block;transform-origin:50% 50%;transform:rotate(${adjustedBearing}deg);" />`
        const icon = new DivIcon({
          className: 'plane-icon plane-icon--loaded',
          html: planeHTML,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = new Marker(pos, { icon, pane: 'flights' })
        marker.addTo(map)
        markersRef.current[flight.instanceId] = marker
      }
    })

    console.log(`Active flights: ${activeFlights.length}, Markers: ${Object.keys(markersRef.current).length}`)

  }, [map, flightInstances, currentSimTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}
    }
  }, [])

  return null
}

// ====================== Main Component ======================
export function CollapseSimulationPage() {
  const navigate = useNavigate()
  const {
    collapseVisualStatus,
    collapseVisualCurrentDay,
    collapseVisualCurrentTime,
    collapseVisualSpeed,
    collapseVisualBacklog,
    collapseVisualProgress,
    collapseVisualStatusLabel,
    collapseVisualHasCollapsed,
    collapseVisualCollapseReason,
    startCollapseVisual,
    updateCollapseVisualTime,
    advanceCollapseVisualDay,
    setCollapseVisualSpeed,
    setCollapseVisualProgress,
    setCollapseVisualCollapsed,
    pauseCollapseVisual,
    resumeCollapseVisual,
    resetCollapseVisual,
  } = useSimulationStore()

  // State
  const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
  const [showStartModal, setShowStartModal] = useState(true)
  const [showDemoResultModal, setShowDemoResultModal] = useState(false)
  const [demoResult, setDemoResult] = useState<CollapseSimulationResult | null>(null)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [isProcessingDay, setIsProcessingDay] = useState(false)
  // Removed showEmptyFlights state - always show only flights with cargo
  
  // Flight data
  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const flightStatusesRef = useRef<FlightStatus[]>([])
  
  // Prefetch system: cache one day ahead for seamless transitions (sequential)
  const prefetchCacheRef = useRef<Map<number, Awaited<ReturnType<typeof simulationService.executeCollapseVisualDay>>>>(new Map())
  const prefetchPromiseRef = useRef<Map<number, Promise<any>>>(new Map()) // Track in-flight promises
  
  // Convert backend FlightInstanceDTO to frontend FlightInstance
  const convertToFlightInstance = useCallback((dto: FlightInstanceDTO, airports: any[]): FlightInstance | null => {
    if (!dto.originLat || !dto.originLng || !dto.destLat || !dto.destLng) {
      return null
    }
    
    // Find origin and destination airports
    const originAirport = airports.find((a: any) => a.codeIATA === dto.originCode)
    const destAirport = airports.find((a: any) => a.codeIATA === dto.destinationCode)
    
    return {
      id: dto.instanceId,
      flightId: dto.flightId || 0,
      flightCode: dto.flightCode || '',
      departureTime: dto.departureTime,
      arrivalTime: dto.arrivalTime,
      instanceId: dto.instanceId,
      originAirportId: originAirport?.id || 0,
      destinationAirportId: destAirport?.id || 0,
      originAirport: {
        codeIATA: dto.originCode || '',
        city: { name: originAirport?.city?.name || dto.originCode || '' },
        latitude: dto.originLat,
        longitude: dto.originLng
      },
      destinationAirport: {
        codeIATA: dto.destinationCode || '',
        city: { name: destAirport?.city?.name || dto.destinationCode || '' },
        latitude: dto.destLat,
        longitude: dto.destLng
      },
      status: 'SCHEDULED' as const,
      assignedProducts: dto.productCount
    }
  }, [])
  
  // Load airports
  const { data: airportsData } = useAirports()
  const airports = Array.isArray(airportsData) ? airportsData : []

  const MAIN_HUB_CODES = ['SPIM', 'EBCI', 'UBBB']
  const mainWarehouses = airports.filter(
    (airport: any) => airport.codeIATA && MAIN_HUB_CODES.includes(airport.codeIATA.toUpperCase())
  )

  // Map config
  const bounds = airports.length > 0
    ? L.latLngBounds(airports.map((a: any) => [parseFloat(a.latitude), parseFloat(a.longitude)] as LatLngTuple))
    : L.latLngBounds([[-60, -180], [70, 180]])

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttribution = '&copy; <a href="https://carto.com/">CARTO</a>'

  // Current simulation time
  const currentTime = collapseVisualCurrentTime ? new Date(collapseVisualCurrentTime) : DEFAULT_START_DATE
  const isRunning = collapseVisualStatus === 'running'
  const isPaused = collapseVisualStatus === 'paused'
  const hasCollapsed = collapseVisualHasCollapsed

  // Helper for Spanish status
  const getStatusLabelSpanish = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'SALUDABLE'
      case 'WARNING': return 'ADVERTENCIA'
      case 'CRITICAL': return 'CRÍTICO'
      case 'COLLAPSED': return 'COLAPSADO'
      default: return status
    }
  }

  // Calculate active flights for display
  const activeFlightsCount = flightInstances.filter(f => {
    const now = currentTime.getTime()
    const dept = new Date(f.departureTime).getTime()
    const arr = new Date(f.arrivalTime).getTime()
    return now >= dept && now <= arr
  }).length

  // Load flight data
  const loadFlightData = useCallback(async () => {
    try {
      console.log('Loading flight data...')
      const response = await simulationService.getFlightStatuses()
      console.log('Flight statuses response:', response)
      if (response?.flights && response.flights.length > 0) {
        flightStatusesRef.current = response.flights
        console.log(`Loaded ${response.flights.length} flights`)
        
        // Generate initial instances
        const instances = simulationService.generateFlightInstances(
          response.flights,
          DEFAULT_START_DATE,
          72,
          airports
        )
        console.log(`Generated ${instances.length} flight instances`)
        setFlightInstances(instances)
      } else {
        console.warn('No flights returned from getFlightStatuses')
      }
    } catch (error) {
      console.error('Error loading flight data:', error)
    }
  }, [airports])

  // Initialize and load data on mount
  useEffect(() => {
    if (airports.length > 0) {
      loadFlightData()
    }
  }, [airports, loadFlightData])

  // Prefetch a specific day in background - SEQUENTIAL only
  // Only prefetch if no other prefetch is in progress
  const prefetchDay = useCallback((dayNumber: number) => {
    // Skip if already cached or if THIS specific day is already being fetched
    if (prefetchCacheRef.current.has(dayNumber) || prefetchPromiseRef.current.has(dayNumber)) {
      return
    }
    
    // Limit concurrency: max 2 requests in flight
    if (prefetchPromiseRef.current.size >= 2) {
      return
    }
    
    console.log(`[Prefetch] Starting day ${dayNumber}...`)
    
    const promise = simulationService.executeCollapseVisualDay(dayNumber)
      .then(result => {
        prefetchCacheRef.current.set(dayNumber, result)
        console.log(`[Prefetch] Day ${dayNumber} cached ✓`)
        
        // Chain next prefetch if needed (keep buffer full)
        if (result.continueSimulation && !result.hasReachedCollapse) {
           // Try to prefetch next day if buffer allows
           // We can't call prefetchDay directly here easily due to closure/deps, 
           // but the main loop will trigger it.
        }
        return result
      })
      .catch(err => {
        console.error(`[Prefetch] Day ${dayNumber} failed:`, err)
        throw err
      })
      .finally(() => {
        prefetchPromiseRef.current.delete(dayNumber)
      })
      
    prefetchPromiseRef.current.set(dayNumber, promise)
  }, [])

  // Get cached result or fetch synchronously
  const getOrFetchDay = useCallback(async (dayNumber: number) => {
    // Check cache first
    if (prefetchCacheRef.current.has(dayNumber)) {
      console.log(`[Prefetch] Cache HIT for day ${dayNumber}`)
      const result = prefetchCacheRef.current.get(dayNumber)!
      prefetchCacheRef.current.delete(dayNumber) // Remove from cache after use
      return result
    }
    
    // Check if prefetch is in progress
    if (prefetchPromiseRef.current.has(dayNumber)) {
       console.log(`[Prefetch] Joining in-progress fetch for day ${dayNumber}`)
       return await prefetchPromiseRef.current.get(dayNumber)
    }
    
    // Cache miss - fetch synchronously
    console.log(`[Prefetch] Cache MISS for day ${dayNumber}, fetching...`)
    return await simulationService.executeCollapseVisualDay(dayNumber)
  }, [])

  // Process a single day - uses prefetch cache
  const processDay = useCallback(async (dayNumber: number) => {
    // Only show loading indicator if we actually have to wait
    // If it's a cache hit or in-flight promise, we might not want to flash the UI
    const isCached = prefetchCacheRef.current.has(dayNumber)
    
    // Only show loading screen for the VERY FIRST day (Day 1)
    // For subsequent days, we rely on prefetching and background loading
    if (dayNumber === 1 && !isCached) {
      setIsProcessingDay(true)
    }
    
    try {
      console.log(`Processing day ${dayNumber}...`)
      
      // Get from cache or fetch
      const result = await getOrFetchDay(dayNumber)
      
      if (!result.success) {
        toast.error(`Error en día ${dayNumber}: ${result.message}`)
        pauseCollapseVisual()
        return false
      }

      // Trigger prefetch for next FEW days (buffer)
      if (result.continueSimulation && !result.hasReachedCollapse) {
        // Prefetch next 3 days
        prefetchDay(dayNumber + 1)
        prefetchDay(dayNumber + 2)
        prefetchDay(dayNumber + 3)
      }

      // Update store with results
      setCollapseVisualProgress(result.collapseProgress, result.statusLabel, result.cumulativeBacklog)
      
      // Check for collapse
      if (result.hasReachedCollapse) {
        setCollapseVisualCollapsed(result.collapseReason || 'UNKNOWN')
        toast.warning(`¡Sistema colapsó en día ${dayNumber}!`, { autoClose: false })
        return false
      }

      // Add flight instances from the actual algorithm solution
      // MERGE STRATEGY: Combine real flights (with cargo) with scheduled flights (empty)
      // This ensures the map looks alive even if flights are empty
      
      // 1. Get real instances from backend (flights with cargo)
      const realInstances = (result.assignedFlightInstances || [])
        .map((dto: FlightInstanceDTO) => convertToFlightInstance(dto, airports))
        .filter((inst: FlightInstance | null): inst is FlightInstance => inst !== null)
      
      // 2. Generate ALL scheduled instances for this day (background traffic)
      let allScheduledInstances: FlightInstance[] = []
      if (flightStatusesRef.current.length > 0 && airports.length > 0) {
        const dayStart = new Date(DEFAULT_START_DATE.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000)
        allScheduledInstances = simulationService.generateFlightInstances(
          flightStatusesRef.current,
          dayStart,
          24, // 1 day duration
          airports
        )
      }
      
      // 3. Merge them: Use real instance if available, otherwise use scheduled one
      // Create a map of real instances by ID for fast lookup
      const realInstanceMap = new Map<string, FlightInstance>(realInstances.map((i: FlightInstance) => [i.instanceId, i]))
      
      const mergedInstances: FlightInstance[] = allScheduledInstances.map((scheduled): FlightInstance => {
        // If we have a real version of this flight (with cargo info), use it
        if (realInstanceMap.has(scheduled.instanceId)) {
          return realInstanceMap.get(scheduled.instanceId)!
        }
        // Otherwise use the scheduled one (empty)
        return scheduled
      })
      
      // Also add any real instances that might not have matched (safety fallback)
      realInstances.forEach((real: FlightInstance) => {
        if (!mergedInstances.find(m => m.instanceId === real.instanceId)) {
          mergedInstances.push(real)
        }
      })
      
      console.log(`[Day ${dayNumber}] Merged flights: ${realInstances.length} real + ${allScheduledInstances.length} scheduled = ${mergedInstances.length} total`)
      
      // Update state (keep buffer of past flights)
      setFlightInstances(prev => {
        // Keep last 500 flights to avoid memory issues, but ensure we have current day's flights
        const oldFlights = prev.slice(-200) 
        return [...oldFlights, ...mergedInstances]
      })

      // Mark processing complete (only if it was showing)
      if (dayNumber === 1) {
        setIsProcessingDay(false)
      }
      
      return result.continueSimulation
      
    } catch (error) {
      console.error(`Error processing day ${dayNumber}:`, error)
      toast.error('Error al procesar día')
      pauseCollapseVisual()
      setIsProcessingDay(false)
      return false
    }
  }, [airports, pauseCollapseVisual, setCollapseVisualProgress, setCollapseVisualCollapsed, getOrFetchDay, prefetchDay, convertToFlightInstance])

  // Start visual simulation
  const handleStartVisual = useCallback(async () => {
    setShowStartModal(false)
    
    // Clear prefetch cache on new start
    prefetchCacheRef.current.clear()
    prefetchPromiseRef.current.clear()
    
    // Clear previous flight instances
    setFlightInstances([])
    
    try {
      toast.info('Inicializando simulación visual...')
      
      // Initialize backend
      const initResult = await simulationService.initCollapseVisual({
        simulationStartTime: DEFAULT_START_DATE.toISOString()
      })
      
      if (!initResult.success) {
        toast.error('Error al inicializar: ' + initResult.message)
        return
      }

      // Start store state
      startCollapseVisual(DEFAULT_START_DATE, collapseVisualSpeed)
      
      // Process first day
      const day1Success = await processDay(1)
      
      if (!day1Success) {
        toast.error('Error al procesar día 1')
        resetCollapseVisual()
        setShowStartModal(true)
        return
      }
      
      advanceCollapseVisualDay(1)
      
      // IMPORTANT: Start prefetching days 2 and 3 immediately after day 1
      // Start prefetching day 2 (sequential - only one at a time)
      console.log('[Prefetch] Starting prefetch for day 2...')
      prefetchDay(2)
      prefetchDay(3)
      prefetchDay(4)
      
      toast.success('Simulación iniciada - Día 1')
      
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast.error('Error al iniciar simulación')
      resetCollapseVisual()
      setShowStartModal(true)
    }
  }, [collapseVisualSpeed, startCollapseVisual, advanceCollapseVisualDay, processDay, resetCollapseVisual])

  // Track if we're waiting for a day to be processed
  const waitingForDayRef = useRef<number>(0)

  // Time advancement interval - runs continuously, doesn't stop for processing
  useEffect(() => {
    if (!isRunning || hasCollapsed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Advance time every 100ms (10fps) for smoother animation but less CPU load
    intervalRef.current = setInterval(() => {
      const prevTime = collapseVisualCurrentTime ? new Date(collapseVisualCurrentTime) : DEFAULT_START_DATE
      // Calculate time increment based on speed (minutes/sec) and interval (100ms)
      // speed * 60 * 1000 = ms per real second
      // * (100 / 1000) = ms per interval
      const timeToAddMs = collapseVisualSpeed * 60 * 100 
      const newTime = new Date(prevTime.getTime() + timeToAddMs)
      
      updateCollapseVisualTime(newTime)
      
      // Check if we've crossed into a new day
      const prevDay = Math.floor((prevTime.getTime() - DEFAULT_START_DATE.getTime()) / (24 * 60 * 60 * 1000)) + 1
      const newDay = Math.floor((newTime.getTime() - DEFAULT_START_DATE.getTime()) / (24 * 60 * 60 * 1000)) + 1
      
      if (newDay > prevDay && newDay > collapseVisualCurrentDay) {
        // Don't process if we're already waiting for this day
        if (waitingForDayRef.current === newDay) {
          return
        }
        
        waitingForDayRef.current = newDay
        advanceCollapseVisualDay(newDay)
        
        // Process day - if prefetch is ready, this is instant
        processDay(newDay).then(() => {
          waitingForDayRef.current = 0
        })
      }
      
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, hasCollapsed, collapseVisualSpeed, collapseVisualCurrentTime, collapseVisualCurrentDay, updateCollapseVisualTime, advanceCollapseVisualDay, processDay])

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (isRunning) {
      pauseCollapseVisual()
    } else if (isPaused) {
      resumeCollapseVisual()
    }
  }, [isRunning, isPaused, pauseCollapseVisual, resumeCollapseVisual])

  // Handle stop/reset
  const handleStop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Clear flight instances
    setFlightInstances([])
    
    // Clear prefetch cache
    prefetchCacheRef.current.clear()
    prefetchPromiseRef.current.clear()
    
    try {
      await simulationService.resetCollapseVisual()
    } catch (e) {
      console.error('Error resetting backend:', e)
    }
    
    resetCollapseVisual()
    setShowStartModal(true)
    toast.info('Simulación detenida')
  }, [resetCollapseVisual])

  // Handle Demo (batch collapse for professor)
  const handleRunDemo = useCallback(async () => {
    setShowStartModal(false)
    setIsDemoRunning(true)
    
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      toast.info('Ejecutando demo rápido (esto puede tomar varios minutos)...')
      
      const result = await simulationService.runCollapseScenario(
        { simulationStartTime: DEFAULT_START_DATE.toISOString(), useDatabase: true },
        { signal: controller.signal }
      )
      
      setDemoResult(result)
      setShowDemoResultModal(true)
      
      if (result.hasCollapsed) {
        toast.warning(`Demo: Sistema colapsó en día ${result.collapseDay}`)
      } else {
        toast.success('Demo completado sin colapso')
      }
      
    } catch (error: any) {
      if (error?.name !== 'CanceledError') {
        console.error('Demo error:', error)
        toast.error('Error en demo')
      }
    } finally {
      setIsDemoRunning(false)
      abortControllerRef.current = null
    }
  }, [])

  // Cancel demo
  const handleCancelDemo = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Get status for badge
  const getStatusLabel = (): 'idle' | 'running' | 'paused' | 'collapsed' | 'completed' => {
    if (isDemoRunning) return 'running'
    if (hasCollapsed) return 'collapsed'
    if (isRunning) return 'running'
    if (isPaused) return 'paused'
    if (collapseVisualStatus === 'completed') return 'completed'
    return 'idle'
  }

  const getStatusText = () => {
    if (isDemoRunning) return '● Demo en ejecución'
    if (hasCollapsed) return '✕ Colapsado'
    if (isRunning) return '● Simulando'
    if (isPaused) return '◐ Pausado'
    if (collapseVisualStatus === 'completed') return '✓ Completado'
    return '○ Detenido'
  }

  return (
    <Wrapper>
      {/* Start Modal */}
      <ModalOverlay $show={showStartModal && !isDemoRunning && collapseVisualStatus === 'idle'}>
        <ModalContent>
          <ModalTitle>Simulación de Colapso</ModalTitle>
          <ModalSubtitle>
            Observa cómo el sistema acumula órdenes día a día hasta alcanzar el punto de colapso,
            donde ya no puede cumplir con los SLA de entrega.
          </ModalSubtitle>

          <ModalInfoBox>
            <ModalInfoTitle>Inicio de simulación</ModalInfoTitle>
            <ModalInfoText>
              📅 2 de Enero, 2025 a las 00:00 (inicio de data)
            </ModalInfoText>
          </ModalInfoBox>

          <ModalInfoBox>
            <ModalInfoTitle>Reglas de colapso (SLA)</ModalInfoTitle>
            <ModalInfoText>
              • Continental: máximo 48 horas<br/>
              • Intercontinental: máximo 72 horas<br/>
              • Colapso cuando &gt;10% productos sin asignar
            </ModalInfoText>
          </ModalInfoBox>

          <ButtonRow>
            <ModalButton onClick={() => navigate('/planificacion')}>
              Cancelar
            </ModalButton>
            <ModalButton $danger onClick={handleRunDemo}>
              🎬 Demo Rápido
            </ModalButton>
            <ModalButton $primary onClick={handleStartVisual}>
              ▶ Iniciar Visual
            </ModalButton>
          </ButtonRow>
        </ModalContent>
      </ModalOverlay>

      {/* Demo Result Modal */}
      <ModalOverlay $show={showDemoResultModal}>
        <ResultModal>
          {demoResult && (
            <>
              <ResultHeader $collapsed={demoResult.hasCollapsed}>
                <ResultIcon>{demoResult.hasCollapsed ? '💥' : '✓'}</ResultIcon>
                <ResultTitle>
                  {demoResult.hasCollapsed ? 'Sistema Colapsado' : 'Sin Colapso'}
                </ResultTitle>
                <ResultSubtitle>
                  {demoResult.hasCollapsed
                    ? `Colapsó en el día ${demoResult.collapseDay}`
                    : `${demoResult.totalDaysSimulated} días simulados`}
                </ResultSubtitle>
              </ResultHeader>

              <ResultBody>
                <ResultGrid>
                  <ResultCard>
                    <ResultCardValue>{demoResult.totalDaysSimulated}</ResultCardValue>
                    <ResultCardLabel>Días simulados</ResultCardLabel>
                  </ResultCard>
                  <ResultCard>
                    <ResultCardValue>{demoResult.totalOrdersProcessed}</ResultCardValue>
                    <ResultCardLabel>Órdenes procesadas</ResultCardLabel>
                  </ResultCard>
                  <ResultCard>
                    <ResultCardValue>{demoResult.assignedProducts}</ResultCardValue>
                    <ResultCardLabel>Productos asignados</ResultCardLabel>
                  </ResultCard>
                  <ResultCard $highlight={(demoResult.unassignedProducts || 0) > 0}>
                    <ResultCardValue $danger={(demoResult.unassignedProducts || 0) > 0}>
                      {demoResult.unassignedProducts}
                    </ResultCardValue>
                    <ResultCardLabel>Sin asignar</ResultCardLabel>
                  </ResultCard>
                </ResultGrid>

                <ResultGrid>
                  <ResultCard>
                    <ResultCardValue>
                      {(demoResult.unassignedPercentage || 0).toFixed(1)}%
                    </ResultCardValue>
                    <ResultCardLabel>% Sin asignar</ResultCardLabel>
                  </ResultCard>
                  <ResultCard>
                    <ResultCardValue>
                      {demoResult.executionTimeSeconds.toFixed(0)}s
                    </ResultCardValue>
                    <ResultCardLabel>Tiempo ejecución</ResultCardLabel>
                  </ResultCard>
                </ResultGrid>
              </ResultBody>

              <ResultFooter>
                <ModalButton onClick={() => {
                  setShowDemoResultModal(false)
                  setShowStartModal(true)
                }}>
                  Nueva Simulación
                </ModalButton>
                <ModalButton $primary onClick={() => navigate('/reportes')}>
                  Ver Reportes
                </ModalButton>
              </ResultFooter>
            </>
          )}
        </ResultModal>
      </ModalOverlay>

      {/* Header */}
      <Header>
        <TitleBlock>
          <Title>Simulación de Colapso</Title>
          <Subtitle>
            Simulación visual día a día hasta el punto de colapso del sistema
          </Subtitle>
        </TitleBlock>

        <HeaderRight>
          <StatusBadge $status={getStatusLabel()}>
            {getStatusText()}
          </StatusBadge>

          {(isRunning || isPaused) && !hasCollapsed && (
            <>
              <ControlButton $variant={isRunning ? 'pause' : 'play'} onClick={handlePauseResume}>
                {isRunning ? '⏸ Pausar' : '▶ Continuar'}
              </ControlButton>
              <ControlButton $variant="stop" onClick={handleStop}>
                ⏹ Detener
              </ControlButton>
            </>
          )}

          {hasCollapsed && (
            <ControlButton $variant="reset" onClick={handleStop}>
              🔄 Reiniciar
            </ControlButton>
          )}

          {collapseVisualStatus === 'idle' && !isDemoRunning && (
            <ControlButton $variant="play" onClick={() => setShowStartModal(true)}>
              Configurar
            </ControlButton>
          )}
        </HeaderRight>
      </Header>

      {/* Map */}
      <MapWrapper $collapsed={hasCollapsed}>
        {/* Loading Overlay for Demo */}
        {isDemoRunning && (
          <LoadingOverlay>
            <Spinner />
            <LoadingText>Ejecutando Demo Rápido</LoadingText>
            <LoadingSubtext>Procesando todos los días hasta el colapso...</LoadingSubtext>
            <ControlButton $variant="stop" onClick={handleCancelDemo} style={{ marginTop: 20 }}>
              Cancelar
            </ControlButton>
          </LoadingOverlay>
        )}

        {/* Processing Day Indicator */}
        {isProcessingDay && !isDemoRunning && (
          <LoadingOverlay style={{ background: 'rgba(15, 23, 42, 0.85)' }}>
            <Spinner />
            <LoadingText>Ejecutando ALNS - Día {collapseVisualCurrentDay > 0 ? collapseVisualCurrentDay : 1}</LoadingText>
            <LoadingSubtext>El algoritmo está procesando las órdenes...</LoadingSubtext>
            <LoadingSubtext style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
              Esto puede tomar entre 30 segundos y 2 minutos
            </LoadingSubtext>
          </LoadingOverlay>
        )}

        {/* Collapse Overlay */}
        {hasCollapsed && (
          <CollapseOverlay>
            <CollapseIcon>💥</CollapseIcon>
            <CollapseTitle>SISTEMA COLAPSADO</CollapseTitle>
            <CollapseSubtitle>
              Día {collapseVisualCurrentDay} - {collapseVisualCollapseReason === 'SLA_BREACH' 
                ? 'Demasiados pedidos sin asignar' 
                : 'Capacidad agotada'}
            </CollapseSubtitle>
          </CollapseOverlay>
        )}

        {/* Controls Panel */}
        {(isRunning || isPaused || hasCollapsed) && (
          <SimulationControls>
            <ClockBox $danger={hasCollapsed}>
              <ClockLabel>Tiempo Simulación</ClockLabel>
              <ClockValue>{formatTime(currentTime)}</ClockValue>
              <ClockSubvalue>{formatDate(currentTime)}</ClockSubvalue>
            </ClockBox>

            <DayCounter>
              <DayNumber>{collapseVisualCurrentDay}</DayNumber>
              <DayLabel>días</DayLabel>
            </DayCounter>

            <ProgressSection>
              <ProgressLabel>Progreso hacia colapso</ProgressLabel>
              <ProgressBar>
                <ProgressFill $percent={collapseVisualProgress} $status={collapseVisualStatusLabel} />
              </ProgressBar>
              <ProgressValue>
                {collapseVisualProgress.toFixed(0)}% - {getStatusLabelSpanish(collapseVisualStatusLabel)}
              </ProgressValue>
            </ProgressSection>

            <StatsGrid>
              <StatCard>
                <StatValue>{collapseVisualBacklog}</StatValue>
                <StatLabel>Pedidos Pendientes</StatLabel>
              </StatCard>
              <StatCard $highlight={collapseVisualProgress > 50}>
                <StatValue $danger={collapseVisualProgress > 70}>
                  {collapseVisualProgress > 70 ? '⚠️' : collapseVisualProgress > 40 ? '⚡' : '✓'}
                </StatValue>
                <StatLabel>Salud Sistema</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{activeFlightsCount}</StatValue>
                <StatLabel>Vuelos Activos</StatLabel>
              </StatCard>
            </StatsGrid>

            {!hasCollapsed && (
              <SpeedControl>
                <div style={{ 
                  padding: '10px', 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <SpeedLabel style={{ color: '#15803d', marginBottom: '4px' }}>Monitor de Riesgo SLA</SpeedLabel>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: collapseVisualProgress > 70 ? '#dc2626' : collapseVisualProgress > 40 ? '#d97706' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {collapseVisualProgress > 70 ? '🔴' : collapseVisualProgress > 40 ? '🟡' : '🟢'}
                    </span>
                    {collapseVisualProgress > 70 
                      ? 'CRÍTICO - Colapso inminente' 
                      : collapseVisualProgress > 40 
                        ? 'ALERTA - Backlog creciendo' 
                        : 'ESTABLE - Operación normal'}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#374151' }}>
                    <strong>Carga Activa:</strong> {flightInstances.filter(f => (f.assignedProducts || 0) > 0).reduce((acc, curr) => acc + (curr.assignedProducts || 0), 0)} productos
                  </div>
                </div>

                <SpeedLabel>Velocidad</SpeedLabel>
                <SpeedButtons>
                  {SPEED_OPTIONS.map((opt) => (
                    <SpeedButton
                      key={opt.value}
                      $active={collapseVisualSpeed === opt.value}
                      onClick={() => setCollapseVisualSpeed(opt.value)}
                      disabled={isProcessingDay}
                    >
                      {opt.label}
                    </SpeedButton>
                  ))}
                </SpeedButtons>
              </SpeedControl>
            )}
          </SimulationControls>
        )}

        {/* Flight Drawer - Removed as it requires missing props */}

        <MapContainer
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          minZoom={2}
          maxZoom={8}
        >
          <Pane name="airports" style={{ zIndex: 500 }} />
          <Pane name="main-hubs" style={{ zIndex: 600 }} />
          <Pane name="flights" style={{ zIndex: 550 }} />

          <TileLayer attribution={tileAttribution} url={tileUrl} noWrap={true} />

          {/* Animated Flights - Show during running, paused, OR processing */}
          {(isRunning || isPaused || isProcessingDay) && !hasCollapsed && flightInstances.length > 0 && (
            <AnimatedFlights
              flightInstances={flightInstances.filter(f => (f.assignedProducts || 0) > 0)}
              currentSimTime={currentTime}
              isPlaying={isRunning && !isProcessingDay}
              playbackSpeed={collapseVisualSpeed}
            />
          )}

          {/* Main warehouses */}
          {mainWarehouses.map((airport: any) => {
            const center: LatLngTuple = [parseFloat(airport.latitude), parseFloat(airport.longitude)]
            return (
              <CircleMarker
                key={`hub-${airport.id}`}
                center={center}
                radius={10}
                color="#ebc725"
                fillColor="#f6b53b"
                fillOpacity={0.95}
                weight={2.5}
                pane="main-hubs"
                eventHandlers={{ click: () => setSelectedAirport(mapAirportToSimAirport(airport)) }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{airport.cityName}</strong>
                    <div style={{ fontSize: '11px', color: '#ebc725', fontWeight: 700 }}>
                      Hub principal ({airport.codeIATA})
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}

          {/* Regular airports */}
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
              eventHandlers={{ click: () => setSelectedAirport(mapAirportToSimAirport(airport)) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div>
                  <strong>{airport.cityName}</strong>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{airport.codeIATA}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
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
            <img src="/airplane.png" alt="✈" style={{ width: 16, height: 16, objectFit: 'contain' }} />
            <span>Vuelo activo</span>
          </LegendItem>
        </MapLegend>

        {/* Affected Airports Panel - Removed as it requires missing props */}
      </MapWrapper>

      {/* Modals */}
      {selectedAirport && (
        <AirportDetailsModal
          airport={selectedAirport}
          onClose={() => setSelectedAirport(null)}
          readOnly
          flightInstances={flightInstances}
          instanceHasProducts={{}}
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