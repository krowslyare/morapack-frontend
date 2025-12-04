import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import styled from "styled-components"
import { MapContainer, TileLayer, CircleMarker, Tooltip, Pane, Polyline } from "react-leaflet"
import L, { DivIcon, Marker, type LatLngTuple } from "leaflet"
import gsap from "gsap"
import { useAirports } from "../../hooks/api/useAirports"
import { simulationService, type FlightInstance } from "../../api/simulationService"
import { WeeklyKPICard } from "../../components/ui/WeeklyKPICard"
import { toast } from "react-toastify"
import { useMap } from "react-leaflet"
import { useSimulationStore } from "../../store/useSimulationStore"
import type { Continent } from '../../types/Continent'

import type { SimAirport } from '../../hooks/useFlightSimulation'
import { AirportDetailsModal } from '../../components/AirportDetailsModal'
import { FlightPackagesModal } from '../../components/FlightPackagesModal'
import './index.css' 
import { FlightDrawer } from './FlightDrawer'
import { useOrders } from '../../hooks/api/useOrders'
import { useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '../../hooks/api/useOrders'

// ====================== Styled Components =========================
const Wrapper = styled.div`
  padding: 16px;
`

const Header = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`
const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
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
  justify-content: flex-end;
`

const DayBadge = styled.div`
  padding: 6px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
`

const StatusBadge = styled.div<{ $running: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => (p.$running ? '#d1fae5' : '#f3f4f6')};
  color: ${(p) => (p.$running ? '#065f46' : '#6b7280')};
`

const ControlButton = styled.button<{ $variant?: 'play' | 'stop' }>`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${(p) => (p.$variant === 'play' ? '#10b981' : '#ef4444')};
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`

const MapWrapper = styled.div`
  width: 100%;
  height: 70vh;  // Ya está así, perfecto
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

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
  min-width: 260px;
`



const Clock = styled.div`
  font-size: 24px;
  font-weight: 900;
  color: #111827;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 10px;
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
  color: #111827; // o #000000
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

// ============= AnimatedFlights (sin cambios) =============
import { bezierPoint, bezierTangent, computeControlPoint, calculateBearing } from "../../components/ui/bezierUtils"

interface AnimatedFlightsProps {
  flightInstances: FlightInstance[]
  simulationStartTime: Date
  currentSimTime: Date
  isPlaying: boolean
  playbackSpeed: number
  speedRef: React.MutableRefObject<number>
  onFlightClick: (flight: FlightInstance) => void
  onFlightHover: (flight: FlightInstance | null) => void
  instanceHasProducts: Record<string, number>  // instanceId -> productCount (from algorithm)
  showOnlyWithProducts: boolean
}

function AnimatedFlights(props: AnimatedFlightsProps) {
  const { 
    flightInstances, 
    simulationStartTime, 
    currentSimTime, 
    isPlaying, 
    playbackSpeed,
    speedRef,
    onFlightClick,
    onFlightHover,
    instanceHasProducts,
    showOnlyWithProducts,
  } = props

  const map = useMap()
  const markersRef = useRef<Partial<Record<string, Marker>>>({})
  const flightAnimationsRef = useRef<Partial<Record<string, gsap.core.Tween>>>({})
  const departureTimesRef = useRef<Partial<Record<string, number>>>({})
  const arrivalTimesRef = useRef<Partial<Record<string, number>>>({})

  const MAX_FLIGHTS = 300

  // Limpiar al desmontar
  useEffect(() => {
    if (!map) return
    return () => {
      Object.values(flightAnimationsRef.current).forEach(t => {
        if (t) t.kill()
      })
      Object.values(markersRef.current).forEach(m => {
        if (m) m.remove()
      })
      markersRef.current = {}
      flightAnimationsRef.current = {}
      departureTimesRef.current = {}
      arrivalTimesRef.current = {}
    }
  }, [map])

  // Gestionar vuelos basándose en el tiempo actual de simulación
  useEffect(() => {
    if (!map || flightInstances.length === 0 || !currentSimTime) return

    const now = currentSimTime.getTime()

    flightInstances.forEach(f => {
      const depDate = new Date(f.departureTime)
      const depMs = depDate.getTime()
      const arrMs = new Date(f.arrivalTime).getTime()

      // Usar instanceId del objeto (generado consistentemente con backend)
      const productCount = instanceHasProducts[f.instanceId] ?? 0
      const hasProducts = productCount > 0

      // ==========================================
      // CASO 1: Vuelo vacío cuando toggle está activo → ELIMINAR
      // ==========================================
      if (showOnlyWithProducts && !hasProducts) {
        if (markersRef.current[f.id]) {
          markersRef.current[f.id]?.remove()
          delete markersRef.current[f.id]
        }
        const tween = flightAnimationsRef.current[f.id]
        if (tween) {
          tween.kill()
          delete flightAnimationsRef.current[f.id]
        }
        delete departureTimesRef.current[f.id]
        delete arrivalTimesRef.current[f.id]
        return
      }

      // ==========================================
      // CASO 2: Vuelo ya llegó → ELIMINAR
      // ==========================================
      if (now > arrMs) {
        if (markersRef.current[f.id]) {
          markersRef.current[f.id]?.remove()
          delete markersRef.current[f.id]
        }
        const tween = flightAnimationsRef.current[f.id]
        if (tween) {
          tween.kill()
          delete flightAnimationsRef.current[f.id]
        }
        delete departureTimesRef.current[f.id]
        delete arrivalTimesRef.current[f.id]
        return
      }

      // ==========================================
      // CASO 3: Vuelo aún NO ha despegado → NO CREAR (esperar)
      // ==========================================
      if (now < depMs) {
        // No hacer nada - el vuelo se creará cuando llegue su hora
        return
      }

      // ==========================================
      // CASO 4: Vuelo YA está en el aire y ya está animándose → NADA
      // ==========================================
      if (markersRef.current[f.id]) {
        return
      }

      // ==========================================
      // CASO 5: Vuelo ACABA DE despegar o estamos en medio del vuelo → CREAR
      // ==========================================
      const flightDurationMs = arrMs - depMs
      const origin: LatLngTuple = [f.originAirport.latitude, f.originAirport.longitude]
      const dest: LatLngTuple = [f.destinationAirport.latitude, f.destinationAirport.longitude]
      const ctrl = computeControlPoint(origin, dest)

      // Calcular progreso actual (si la simulación empezó en medio del vuelo)
      const elapsedSinceDepart = now - depMs
      const initialProgress = Math.min(1, Math.max(0, elapsedSinceDepart / flightDurationMs))
      
      // Posición inicial basada en el progreso
      const startPos = bezierPoint(initialProgress, origin, ctrl, dest)
      
      // Ángulo inicial
      const tangent = bezierTangent(initialProgress, origin, ctrl, dest)
      const initialAngle = (Math.atan2(tangent[1], tangent[0]) * 180 / Math.PI + 90) % 360

      const icon = new DivIcon({
        className: hasProducts ? 'plane-icon plane-icon--loaded' : 'plane-icon plane-icon--empty',
        html: `<img src="/airplane.png"
                    style="width:20px;height:20px;display:block;
                          transform-origin:50% 50%;
                          transform:rotate(${initialAngle}deg);" />`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      // Crear marker visible inmediatamente (ya despegó)
      const marker = L.marker(startPos, { icon }).addTo(map)
      marker.setOpacity(1)

      markersRef.current[f.id] = marker
      departureTimesRef.current[f.id] = depMs
      arrivalTimesRef.current[f.id] = arrMs

      marker.on('click', () => onFlightClick(f))
      marker.on('mouseover', () => onFlightHover(f))
      marker.on('mouseout', () => onFlightHover(null))

      // Calcular duración restante en tiempo REAL (considerando velocidad actual)
      const remainingFlightMs = arrMs - now
      const currentSpeed = speedRef.current
      const remainingDurationSec = remainingFlightMs / (currentSpeed * 1000)

      // Crear animación desde el progreso actual hasta el final
      const animObj = { t: initialProgress }

      const tween = gsap.to(animObj, {
        t: 1,
        duration: remainingDurationSec,
        ease: 'none',
        paused: !isPlaying,
        onUpdate() {
          const pos = bezierPoint(animObj.t, origin, ctrl, dest)
          marker.setLatLng(pos)

          const tan = bezierTangent(animObj.t, origin, ctrl, dest)
          const angle = (Math.atan2(tan[1], tan[0]) * 180) / Math.PI
          const adj = (angle + 90) % 360

          const img = marker.getElement()?.querySelector('img') as HTMLImageElement | null
          if (img) img.style.transform = `rotate(${adj}deg)`
        },
        onComplete() {
          // Eliminar al llegar
          const m = markersRef.current[f.id]
          if (m) {
            m.remove()
            delete markersRef.current[f.id]
          }
          delete flightAnimationsRef.current[f.id]
          delete departureTimesRef.current[f.id]
          delete arrivalTimesRef.current[f.id]
        },
      })

      flightAnimationsRef.current[f.id] = tween
    })

  }, [flightInstances, currentSimTime, map, isPlaying, instanceHasProducts, showOnlyWithProducts, onFlightClick, onFlightHover])

  // Control de play/pause y velocidad - transición suave
  useEffect(() => {
    Object.values(flightAnimationsRef.current).forEach(tween => {
      if (!tween) return  // ← TS feliz, gsap feliz

      gsap.to(tween, {
        timeScale: playbackSpeed,
        duration: 0.3,
        ease: "power2.out",
      })

      if (isPlaying) {
        tween.play()
      } else {
        tween.pause()
      }
    })
  }, [isPlaying, playbackSpeed])

  // Limpiar vuelos que ya llegaron (respaldo)
  useEffect(() => {
    if (!currentSimTime) return

    const now = currentSimTime.getTime()

    Object.entries(arrivalTimesRef.current).forEach(([id, arrMs]) => {
      if (arrMs === undefined) return

      if (now > arrMs + 5000) {
        const marker = markersRef.current[id]
        if (marker) {
          marker.remove()
          delete markersRef.current[id]
        }

        const tween = flightAnimationsRef.current[id]
        if (tween) {
          tween.kill()
          delete flightAnimationsRef.current[id]
        }

        delete departureTimesRef.current[id]
        delete arrivalTimesRef.current[id]
      }
    })
  }, [currentSimTime])

  return null
}

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

const INITIAL_KPI = {
  totalFlights: 0,          // total planificado semana (si lo quieres guardar)
  avgCapacityUsage: 0,      // uso actual de capacidad (%)
  deliveredOrders: 0,       // pedidos realmente entregados
  deliveredProducts: 0,     // si luego tienes dato real, por ahora queda en 0
  assignmentRate: 0,
  totalProductsWeek: 0,
  assignedProductsWeek: 0,
  totalOrdersWeek: 0,
  assignedOrdersWeek: 0,
}


function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, delay - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, delay])

  return throttledValue
}



// ===============================
//  REPLICANDO SCRIPT PYTHON 
// ===============================
export function WeeklySimulationPage() {


    const queryClient = useQueryClient()
    const [showPanel, setShowPanel] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState<"orders"|"flights">("flights");
    const [showOnlyWithProducts, setShowOnlyWithProducts] = useState(false);

    // ✅ AGREGAR estos refs para control de cancelación
    const abortControllersRef = useRef<AbortController[]>([])
    const pendingRequestsRef = useRef(0)

    const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false)

    const TOTAL_DAYS = 7
    const SPEED_SLOW = 60      // 10 min simulados por segundo real
    const SPEED_FAST = 600    // 1 hora simulada por segundo real
    
    // 🐍 PYTHON REPLICA: Pasos discretos de 4 horas
    const STEP_HOURS = 0.5 //speedRef
    const STEP_MIN = 0.05 //speedRef
    const TOTAL_HOURS = 24 * TOTAL_DAYS  // 168 horas

    const { simulationStartDate, hasValidConfig } = useSimulationStore()

    const startTime = useMemo(() => {
      const raw = simulationStartDate ?? new Date();
      // Usar la hora en UTC
      return new Date(Date.UTC(
        raw.getUTCFullYear(),
        raw.getUTCMonth(),
        raw.getUTCDate(),
        0, 0, 0, 0
      ));
    }, [simulationStartDate]);

    const { 
      data: ordersData, 
      isLoading: loadingOrders 
    } = useOrders(
      simulationStartDate ? {
        // Filtrar pedidos de la semana de simulación
        startDate: simulationStartDate.toISOString(),
        endDate: new Date(simulationStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } : undefined,
      !!simulationStartDate
    )

    // ✅ Extraer los pedidos del resultado
    const orders = useMemo(() => ordersData ?? [], [ordersData])
    // ✅ KPIs derivados de los pedidos reales

    // Conteo por estado en base a los pedidos que ya tienes en memoria
    const ordersByStatus = useMemo(() => {
      const base = {
        PENDING: 0,
        IN_TRANSIT: 0,
        ARRIVED: 0,
        DELIVERED: 0,
      }

      for (const o of orders) {
        const s = (o.status || '').toUpperCase() as keyof typeof base
        if (s in base) {
          base[s] += 1
        }
      }

      return base
    }, [orders])
    
    // Total pedidos (suma de todos los estados)
    const totalOrdersFromDb = useMemo(
      () =>
        ordersByStatus.PENDING +
        ordersByStatus.IN_TRANSIT +
        ordersByStatus.ARRIVED +
        ordersByStatus.DELIVERED,
      [ordersByStatus]
    )

    // Si para ti "con ruta asignada" = todo lo que NO está pendiente:
    const ordersWithRoute = useMemo(
      () =>
        ordersByStatus.IN_TRANSIT +
        ordersByStatus.ARRIVED +
        ordersByStatus.DELIVERED,
      [ordersByStatus]
    )

    // Entregados desde BD (por estado)
    const deliveredOrdersFromDb = useMemo(
      () => ordersByStatus.DELIVERED,
      [ordersByStatus]
    )
    

    const [playbackSpeed, setPlaybackSpeed] = useState(SPEED_SLOW)
    const speedRef = useRef(SPEED_SLOW)

    useEffect(() => {
        speedRef.current = playbackSpeed
    }, [playbackSpeed])
    
    const updatesInProgressRef = useRef(0);

    // ✅ Mapeo de instanceId -> cantidad de productos (del algoritmo)
    const [instanceHasProducts, setInstanceHasProducts] = useState<Record<string, number>>({})
    const [hoveredFlight, setHoveredFlight] = useState<FlightInstance | null>(null)
    const [selectedAirport, setSelectedAirport] = useState<SimAirport | null>(null)
    const [selectedFlight, setSelectedFlight] = useState<{ id: number; code: string } | null>(null)

    const handleFlightClick = (flight: FlightInstance) => {
        setSelectedFlight({
          id: flight.flightId,
          code: flight.flightCode,
        })
    }

    const { data: airports } = useAirports()
    const MAIN_HUB_CODES = ["SPIM", "EBCI", "UBBB"]
    const mainWarehouses =
        airports?.filter(
          (a: any) =>
            a.codeIATA && MAIN_HUB_CODES.includes(a.codeIATA.toUpperCase())
        ) ?? []

    const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [dayIndex, setDayIndex] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    // ✅ Refs para control
    const visualClockIntervalRef = useRef<any>(null)  // Reloj visual (1 seg)
    const lastAlgorithmDayRef = useRef(-1)
    const lastUpdateHoursRef = useRef(0)  // Última vez que ejecutamos update-states
    const isUpdatingStatesRef = useRef(false)
    const pausedRef = useRef(false)

    const intervalRef = useRef<any>(null)

    // 🐍 PYTHON REPLICA: Control de pasos discretos
    const currentStepHoursRef = useRef(0)  // step actual en horas (0, 4, 8, 12, ...)
    const pendingUpdateRef = useRef(false)

    const [kpi, setKpi] = useState(INITIAL_KPI)

    const loadWeeklyFlights = useCallback(async () => {
        try {
            // Cargar vuelos y sus instancias asignadas en paralelo
            const [flightResponse, instancesResponse] = await Promise.all([
              simulationService.getFlightStatuses(),
              simulationService.getAssignedFlightInstances()
            ])

            if (!airports || airports.length === 0) {
              toast.error("No hay aeropuertos cargados")
              return
            }

            const inst = simulationService.generateFlightInstances(
              flightResponse.flights,
              startTime,
              168,
              airports,
              { baseDay: 1 }   // 👈 día 1..7
            )

            setFlightInstances(inst)

            // ✅ Usar instancias reales del algoritmo (no vuelos base)
            // instancesResponse.instances = { "FL-123-DAY-0-0800": 5, ... }
            setInstanceHasProducts(instancesResponse.instances ?? {})
            
            console.log(`📦 Instancias con productos: ${Object.keys(instancesResponse.instances ?? {}).length}`)
            
            // DEBUG: Mostrar primeras instancias del backend vs frontend
            const backendInstances = Object.keys(instancesResponse.instances ?? {}).slice(0, 5)
            console.log('🔍 Backend instanceIds (primeros 5):', backendInstances)
            
            // DEBUG: Mostrar instanceIds generados por el frontend
            if (inst.length > 0) {
              const frontendInstanceIds = inst.slice(0, 5).map(f => f.instanceId)
              console.log('🔍 Frontend instanceIds (primeros 5):', frontendInstanceIds)
              
              // Verificar cuántos coinciden
              const backendSet = new Set(Object.keys(instancesResponse.instances ?? {}))
              const matches = inst.filter(f => backendSet.has(f.instanceId)).length
              console.log(`✅ Vuelos con productos asignados detectados: ${matches} de ${backendSet.size}`)
            }

            // KPIs
            const flightsByAirport: Record<string, number> = {}

            inst.forEach((f) => {
                const rawCode =
                    f.originAirport.codeIATA ??
                    (typeof f.originAirport.city === 'string'
                      ? f.originAirport.city
                      : f.originAirport.city?.name)

                if (!rawCode) return

                const code = String(rawCode)
                flightsByAirport[code] = (flightsByAirport[code] ?? 0) + 1
            })

            let busiestAirport = "-"
            let maxFlightsAirport = 0

            Object.entries(flightsByAirport).forEach(([code, count]) => {
                if (count > maxFlightsAirport) {
                    maxFlightsAirport = count
                    busiestAirport = `${code} (${count} vuelos)`
                }
            })

            const flightsByDay = Array(TOTAL_DAYS).fill(0)

            inst.forEach(f => {
              const dep = new Date(f.departureTime)
              const d = Math.floor(
                  (dep.getTime() - startTime.getTime()) / (24 * 3600 * 1000)
              )
              if (d >= 0 && d < TOTAL_DAYS) {
                  flightsByDay[d] += 1
              }
            })

            let busiestDay = "-"
            let maxFlightsDay = 0
            for (let i = 0; i < TOTAL_DAYS; i++) {
              if (flightsByDay[i] > maxFlightsDay) {
                  maxFlightsDay = flightsByDay[i]
                  busiestDay = `Día ${i + 1} (${flightsByDay[i]} vuelos)`
              }
            }

            setKpi(prev => ({
              ...prev,
              totalFlights: inst.length,
            }))

        } catch (error) {
            console.error('Error cargando vuelos semanales:', error)
            toast.error("Error cargando vuelos semanales")
        }
    }, [airports, startTime])

    // Helper para crear peticiones cancelables
    const createCancelableRequest = useCallback((requestFn: (signal: AbortSignal) => Promise<any>) => {
      const controller = new AbortController()
      abortControllersRef.current.push(controller)
      pendingRequestsRef.current += 1
      
      return requestFn(controller.signal)
        .finally(() => {
          pendingRequestsRef.current -= 1
          const index = abortControllersRef.current.indexOf(controller)
          if (index > -1) {
            abortControllersRef.current.splice(index, 1)
          }
        })
    }, [])

    // 🐍 PYTHON REPLICA: Algoritmo diario
    const runDailyAlgorithm = useCallback(
      async (dayStart: Date, dayNumber: number) => {
        if (!simulationStartDate) return

        console.group(`🐍 PYTHON REPLICA - Day ${dayNumber + 1}`)

        console.log('📅 Day Start (UTC):', dayStart.toISOString())
        console.log('📅 Day Start (local):', dayStart.toLocaleString('es-PE', { hour12: false }))
        
        // ✅ Formatear como Python: solo fecha + T00:00:00
        const year = dayStart.getUTCFullYear()
        const month = String(dayStart.getUTCMonth() + 1).padStart(2, '0')
        const day = String(dayStart.getUTCDate()).padStart(2, '0')
        const dateTimeStr = `${year}-${month}-${day}T00:00:00`

        console.log('📅 Sending to backend:', dateTimeStr)

        try {

          // ✅ Usar petición cancelable
          const response = await createCancelableRequest(async (signal) => {
            return await simulationService.executeDaily({
              simulationStartTime: dateTimeStr,
              simulationDurationHours: 24,
              useDatabase: true,
            }, signal)  // ⚠️ Asegúrate que tu service acepte signal
          })
          
          // ✅ Refrescar pedidos después de ejecutar el algoritmo
          queryClient.invalidateQueries({ queryKey: orderKeys.all })

          if (!response) {
            toast.error('Error: respuesta del algoritmo inválida')
            console.groupEnd()
            return
          }

          console.log('✅ Algorithm Stats:', {
            totalOrders: response.totalOrders,
            assignedOrders: response.assignedOrders,
            totalProducts: response.totalProducts,
            assignedProducts: response.assignedProducts,
            score: response.score,
          })

          const assignedOrders = Number(response.assignedOrders ?? 0)
          const assignedProducts = Number(response.assignedProducts ?? 0)
          const totalOrders = Number(response.totalOrders ?? 0)
          const totalProducts = Number(response.totalProducts ?? 0)

          setKpi(prev => {
            const newAssignedProductsWeek = prev.assignedProductsWeek + assignedProducts
            const newTotalProductsWeek = prev.totalProductsWeek + totalProducts
            const newAssignedOrdersWeek = prev.assignedOrdersWeek + assignedOrders
            const newTotalOrdersWeek = prev.totalOrdersWeek + totalOrders

            const rate =
              newTotalProductsWeek > 0
                ? (newAssignedProductsWeek / newTotalProductsWeek) * 100
                : 0

            return {
              ...prev,
              assignedProductsWeek: newAssignedProductsWeek,
              totalProductsWeek: newTotalProductsWeek,
              assignedOrdersWeek: newAssignedOrdersWeek,
              totalOrdersWeek: newTotalOrdersWeek,
              assignmentRate: Number(rate.toFixed(2)),
              // ❌ NO tocamos deliveredOrders / deliveredProducts aquí
            }
          })
          
          console.groupEnd()

          // ✅ Solo toast si hay algo asignado ese día
          if (assignedProducts > 0 || assignedOrders > 0) {
            const partes: string[] = []

            if (assignedOrders > 0) {
              partes.push(
                `${assignedOrders} pedido${assignedOrders !== 1 ? 's' : ''}`
              )
            }
            if (assignedProducts > 0) {
              partes.push(
                `${assignedProducts} producto${assignedProducts !== 1 ? 's' : ''}`
              )
            }

            toast.success(`Día ${dayNumber + 1}: ${partes.join(' y ')} asignados`)
          }

        } catch (error: any) {

          // ✅ Ignorar errores de cancelación
          if (error.name === 'AbortError') {
            console.log('❌ Petición cancelada por el usuario')
            console.groupEnd()
            return
          }


          console.error('❌ Error ejecutando algoritmo:', error)
          console.groupEnd()
          toast.error('Error al ejecutar el algoritmo diario')
        }
      },
      [simulationStartDate, createCancelableRequest, queryClient]
    )

    // 🐍 PYTHON REPLICA: Update states
    const runUpdateStates = useCallback(async (simTime: Date) => {
      
      updatesInProgressRef.current += 1;
      setIsBackgroundProcessing(true)

      try {
        console.group('%c🐍 update-states', 'color:#0ea5e9;font-weight:bold;')
        console.log('⏰ Current Time (UTC):', simTime.toISOString())

        // ✅ También formatear correctamente
        const year = simTime.getUTCFullYear()
        const month = String(simTime.getUTCMonth() + 1).padStart(2, '0')
        const day = String(simTime.getUTCDate()).padStart(2, '0')
        const hours = String(simTime.getUTCHours()).padStart(2, '0')
        const minutes = String(simTime.getUTCMinutes()).padStart(2, '0')
        const seconds = String(simTime.getUTCSeconds()).padStart(2, '0')
        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

        console.log('⏰ Current Time (sending):', dateTimeStr)
        
        // ✅ Con signal
        const controller = new AbortController()
        abortControllersRef.current.push(controller)
        
        const response = await simulationService.updateStates({
          currentTime: dateTimeStr,
        }, controller.signal)  // ✅ Pasar signal

        const transitions = response?.transitions ?? 0
        console.log('✅ Transitions:', transitions)

        if (response.capacityStats) {
          const used = Number(response.capacityStats.usedCapacity ?? 0)
          const total = Number(response.capacityStats.totalCapacity ?? 0)
          const percent = total > 0 ? (used / total) * 100 : 0

          setKpi(prev => ({
            ...prev,
            avgCapacityUsage: Number(percent.toFixed(2)), // uso actual de capacidad
          }))
        }
        
        // 👉 Lo que se entregó en este paso (productos / pedidos, según tu modelo)
        const deliveredThisStep = Number(response.transitions?.arrivedToDelivered ?? 0)

       if (deliveredThisStep > 0) {
        setKpi(prev => ({
          ...prev,
          deliveredOrders:
            (Number.isFinite(prev.deliveredOrders) ? prev.deliveredOrders : 0) +
            deliveredThisStep,
        }))
      }


        console.groupEnd()
        
      } catch (error: any) {

        // ✅ Manejar cancelación de Axios
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('❌ update-states cancelado')
          console.groupEnd()
          return
        }

        console.error('❌ Error en update-states:', error)
        console.groupEnd()
      } finally {
        updatesInProgressRef.current -= 1;

        // 🔥 Se oculta solo cuando realmente NO hay trabajos en curso
        if (updatesInProgressRef.current === 0) {
          setIsBackgroundProcessing(false);
        }
      }
    }, [])

    

    // 🐍 DECLARAR STOP PRIMERO (para evitar error de orden)
    const stop = useCallback((reset: boolean = true) => {
      console.log(`🛑 Deteniendo simulación (reset: ${reset})`)

      // ✅ CANCELAR TODAS LAS PETICIONES PENDIENTES
      console.log(`🔥 Cancelando ${abortControllersRef.current.length} peticiones pendientes...`)
      abortControllersRef.current.forEach(controller => {
        try {
          controller.abort()
        } catch (e) {
          console.error('Error al cancelar:', e)
        }
      })
      abortControllersRef.current = []

      // ✅ Forzar fin del procesamiento en background
      updatesInProgressRef.current = 0
      setIsBackgroundProcessing(false)
      
      setIsRunning(false)
      setIsPaused(false)
      
      if (visualClockIntervalRef.current) {
        clearInterval(visualClockIntervalRef.current)
        visualClockIntervalRef.current = null
      }
      
      if (reset) {
        setCurrentTime(null)
        setDayIndex(0)
        setFlightInstances([])
        setKpi(INITIAL_KPI)
        lastAlgorithmDayRef.current = -1
        lastUpdateHoursRef.current = 0
        //isUpdatingStatesRef.current = false
        //pausedRef.current = false
      }
    }, [])  

    const hasShownCompletionToastRef = useRef(false);

    // ✅ AHORA SÍ PODEMOS USAR stop EN setupVisualClock
    const setupVisualClock = useCallback(() => {
      if (visualClockIntervalRef.current) {
        clearInterval(visualClockIntervalRef.current)
      }

      visualClockIntervalRef.current = setInterval(() => {
        if (pausedRef.current) return

        setCurrentTime(prev => {
          if (!prev) return prev

          const next = new Date(prev.getTime() + speedRef.current * 1000)
          const elapsedMs = next.getTime() - startTime.getTime()
          const elapsedHours = elapsedMs / (60 * 60 * 1000)
          const dayNumber = Math.floor(elapsedHours / 24)

          if (dayNumber >= TOTAL_DAYS) {

            // Detén el reloj visual
            if (visualClockIntervalRef.current) {
              clearInterval(visualClockIntervalRef.current);
              visualClockIntervalRef.current = null;
            }

            setIsRunning(false);
            setIsPaused(false);

            // Mantén el banner hasta que backend termine
            if (updatesInProgressRef.current === 0) {
              setIsBackgroundProcessing(false);
            }

            // Mostrar toast solo UNA VEZ
            if (!hasShownCompletionToastRef.current) {
              hasShownCompletionToastRef.current = true;
              toast.info("Simulación semanal completada");
            }

            return prev;
          }

          setDayIndex(dayNumber)

          // Algoritmo diario
          if (dayNumber > lastAlgorithmDayRef.current) {
            lastAlgorithmDayRef.current = dayNumber
            const dayStart = new Date(startTime.getTime() + dayNumber * 24 * 60 * 60 * 1000)
            console.log(`🔔 Nuevo día ${dayNumber + 1} detectado`)
            void runDailyAlgorithm(dayStart, dayNumber)
          }

          // Update-states cada 4h
          const currentStepHours = Math.floor(elapsedHours / (speedRef.current === SPEED_SLOW? STEP_MIN : STEP_HOURS)) * (speedRef.current === SPEED_SLOW? STEP_MIN : STEP_HOURS)
          
          if (currentStepHours > lastUpdateHoursRef.current && currentStepHours > 0) {
            lastUpdateHoursRef.current = currentStepHours
            console.log(`🔄 Update-states en hora ${currentStepHours}`)
            void runUpdateStates(next)
          }

          return next
        })
      }, 1000)
    }, [startTime, runDailyAlgorithm, runUpdateStates, stop])  // ✅ stop en dependencies


    const start = useCallback(async () => {
      if (!hasValidConfig() || !simulationStartDate) {
        toast.error("Debes configurar la fecha en Planificación primero")
        return
      }

      if (!airports || airports.length === 0) {
        toast.error("Cargar aeropuertos primero")
        return
      }

      console.group('%c🐍 INICIANDO SIMULACIÓN', 'color:#10b981;font-weight:bold;')
      console.log('📅 Start Time (UTC):', startTime.toISOString())
      
      hasShownCompletionToastRef.current = false;
      stop(false)
      lastAlgorithmDayRef.current = -1
      lastUpdateHoursRef.current = 0
      pausedRef.current = false

      try {
        console.log('🔄 Ejecutando algoritmo día 1...')
        await runDailyAlgorithm(startTime, 0)
        lastAlgorithmDayRef.current = 0

        await loadWeeklyFlights()
        
        console.log('✅ Setup completado')
        console.groupEnd()

        setCurrentTime(startTime)
        setIsRunning(true)
        setIsPaused(false)
        setupVisualClock()
        
      } catch (error) {
        console.error('❌ Error al iniciar simulación:', error)
        console.groupEnd()
        toast.error('Error al iniciar la simulación semanal')
      }
    }, [
      hasValidConfig,
      simulationStartDate,
      airports,
      startTime,
      stop,
      runDailyAlgorithm,
      loadWeeklyFlights,
      setupVisualClock
    ])

    const togglePause = useCallback(() => {
      if (!isRunning) return
      
      pausedRef.current = !pausedRef.current
      setIsPaused(pausedRef.current)
      
      if (pausedRef.current) {
        toast.info('⏸️ Simulación pausada')
      } else {
        toast.info('▶️ Simulación reanudada')
      }
    }, [isRunning])

    useEffect(() => {
      return () => {
        if (visualClockIntervalRef.current) {
          clearInterval(visualClockIntervalRef.current)
        }
      }
    }, [])

    // 🐍 PYTHON REPLICA: Paso discreto (ejecuta un tick del script Python)
    const executeStep = useCallback(async (stepHours: number) => {

      currentStepHoursRef.current = stepHours  // ✅ Actualizar

      const currentTime = new Date(startTime.getTime() + stepHours * 60 * 60 * 1000);
      const dayNumber = Math.floor(stepHours / 24);  // Cálculo del día de simulación

      if (dayNumber >= TOTAL_DAYS) {
        stop(false);
        toast.info('✅ Simulación semanal completada');
        return;
      }

      setCurrentTime(currentTime); // Establece la hora actual de la simulación
      setDayIndex(dayNumber);  // Actualiza el índice del día

      console.group(
        `%c🐍 STEP ${stepHours}h (Day ${dayNumber + 1})`,
        'color:#8b5cf6;font-weight:bold;'
      );
      console.log('⏰ Simulation Time (UTC):', currentTime.toISOString());
      console.log('⏰ Simulation Time (local):', currentTime.toLocaleString('es-PE', { hour12: false }));

      // Ejecutar el algoritmo al inicio de un nuevo día
      if (dayNumber > lastAlgorithmDayRef.current) {
        console.log('🔔 Nuevo día detectado - ejecutando algoritmo');
        lastAlgorithmDayRef.current = dayNumber;

        const dayStart = new Date(startTime.getTime() + dayNumber * 24 * 60 * 60 * 1000);
        await runDailyAlgorithm(dayStart, dayNumber);

        // En el paso 0, no ejecutamos update-states
        if (stepHours === 0) {
          console.log('⏭️ Step 0: Saltando update-states (igual que Python)');
          console.groupEnd();
          return;
        }
      }

      // Ejecutar update-states en todos los pasos después del 0
      console.log('🔄 Ejecutando update-states...');
      await runUpdateStates(currentTime);

      console.groupEnd();
    }, [startTime, runDailyAlgorithm, runUpdateStates, stop]);

    // 🐍 PYTHON REPLICA: Loop secuencial (espera a que termine cada paso)
    const runSimulationLoop = useCallback(async () => {
      const msPerStep = ((speedRef.current === SPEED_SLOW? STEP_MIN : STEP_HOURS) * 3600 * 1000) / speedRef.current;

      for (let stepHours = (speedRef.current === SPEED_SLOW? STEP_MIN : STEP_HOURS); stepHours <= TOTAL_HOURS; stepHours += (speedRef.current === SPEED_SLOW? STEP_MIN : STEP_HOURS)) {

        // ✅ Esperar mientras esté pausado
        while (pausedRef.current && intervalRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }


        if (!intervalRef.current) {
          console.log('🛑 Loop interrumpido');
          break;
        }

        await new Promise(resolve => setTimeout(resolve, msPerStep));

        if (!intervalRef.current) {
          console.log('🛑 Loop interrumpido después de timeout');
          break;
        }

        try {
          await executeStep(stepHours);
        } catch (err) {
          console.error('Error en executeStep:', err);
        }
      }

      stop(false);
      toast.info('✅ Simulación semanal completada');
    }, [executeStep, stop]);

    // Lógica para iniciar la simulación
    const startSimulationLoop = useCallback(() => {
      intervalRef.current = true;
      runSimulationLoop();
    }, [runSimulationLoop]);

    
    useEffect(() => {
      return () => {
        // Limpiar el loop al desmontar
        intervalRef.current = null
      }
    }, [])

    useEffect(() => {
      if (hoveredFlight && currentTime) {
        const dep = new Date(hoveredFlight.departureTime).getTime()
        const arr = new Date(hoveredFlight.arrivalTime).getTime()
        const now = currentTime.getTime()
        
        // Limpiar si el vuelo ya terminó o aún no ha salido
        if (now < dep - 60000 || now > arr + 60000) {  // 1 min de margen
          setHoveredFlight(null)
        }
      }
    }, [currentTime, hoveredFlight])

    const flightsOfDay = flightInstances.filter(f => {
        const dep = new Date(f.departureTime)
        const d = Math.floor((dep.getTime() - startTime.getTime()) / (24 * 3600 * 1000))
        return d === dayIndex
    })

    const activeFlightsCountRaw = currentTime
      ? flightsOfDay.filter(f => {
          const dep = new Date(f.departureTime)
          const arr = new Date(f.arrivalTime)
          return currentTime >= dep && currentTime <= arr
        }).length
      : 0

    // ✅ Solo actualiza cada 5 segundos
    const activeFlightsCount = useThrottle(activeFlightsCountRaw, 5000)
    
    const activeFlights = useMemo(() => {
      if (!currentTime) return []
      
      return flightInstances.filter(f => {
        const dep = new Date(f.departureTime).getTime()
        const arr = new Date(f.arrivalTime).getTime()
        const now = currentTime.getTime()
        return now >= dep && now <= arr
      })
    }, [flightInstances, currentTime])

    const flightsStartedSoFar = useMemo(() => {
      if (!currentTime) return 0
      const now = currentTime.getTime()
      return flightInstances.filter(f =>
        new Date(f.departureTime).getTime() <= now
      ).length
    }, [flightInstances, currentTime])

    const bounds = airports?.length
        ? L.latLngBounds(airports.map(a => [Number(a.latitude), Number(a.longitude)] as LatLngTuple))
        : L.latLngBounds([[-60, -180], [60, 180]])

    return (
        <Wrapper>


            <Header>

              <TitleBlock>
                  <Title>Simulación semanal</Title>
                  <Subtitle>
                    Simulación semanal de la red aérea con actualización de estados cada 4 horas
                  </Subtitle>
              </TitleBlock>

              <HeaderRight>
                  <DayBadge>Día {Math.min(dayIndex + 1, 7)} / 7</DayBadge>

                  <StatusBadge $running={isRunning && !isPaused}>
                    {!isRunning
                        ? '○ Detenido'
                        : isPaused
                        ? '▮▮ Pausado'
                        : '● Ejecutando'}
                  </StatusBadge>

                  <ControlButton
                    $variant="play"
                    onClick={togglePause}
                    disabled={!isRunning}
                  >
                    {isPaused ? 'Reanudar' : 'Pausar'}
                  </ControlButton>

                  <ControlButton
                    $variant={isRunning ? 'stop' : 'play'}
                    onClick={isRunning ? () => stop() : start}
                    disabled={!airports || airports.length === 0}
                  >
                    {isRunning ? 'Detener simulación' : 'Iniciar simulación'}
                  </ControlButton>
              </HeaderRight>
            </Header>

            <KPIPanel>
              <KPIPanelHeader>
                  <KPIPanelTitle>Indicadores de la semana</KPIPanelTitle>
                  <KPIPanelSubtitle>
                    Corte del día {Math.min(dayIndex + 1, 7)} / 7
                  </KPIPanelSubtitle>
              </KPIPanelHeader>

              <KPIContainer>
                <WeeklyKPICard
                  label="Vuelos activos"
                  value={activeFlightsCount}
                />
                <WeeklyKPICard
                  label="Pedidos con ruta asignada"
                  value={ordersWithRoute}
                />
                <WeeklyKPICard
                  label="Pedidos entregados"
                  value={deliveredOrdersFromDb + kpi.deliveredOrders}
                />
                <WeeklyKPICard
                  label="Uso actual de capacidad"
                  value={kpi.avgCapacityUsage.toFixed(1) + "%"}
                />
                {/* Si quieres, puedes cambiar alguno por:
                    <WeeklyKPICard
                      label="Tasa de asignación"
                      value={kpi.assignmentRate.toFixed(1) + "%"}
                    />
                */}
              </KPIContainer>
            </KPIPanel>

            <MapWrapper>
              <SimulationControls>
                  <div>
                    <ClockLabel>Tiempo de simulación</ClockLabel>
                    <Clock>
                      {currentTime
                        ? currentTime.toLocaleDateString('es-ES', {
                            timeZone: 'UTC',  // ✅ Forzar UTC
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '--/--/----'}
                    </Clock>
                    <Clock style={{ marginTop: '8px', fontSize: '20px' }}>
                      {currentTime
                        ? currentTime.toLocaleTimeString('es-ES', {
                            timeZone: 'UTC',  // ✅ Forzar UTC
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : '--:--:--'}
                    </Clock>
                  </div>

                  <StatsRow>
                    <StatLine>
                        <span>Día de la semana:</span>
                        <strong>{Math.min(dayIndex + 1, 7)} / 7</strong>
                    </StatLine>
                    <StatLine>
                        <span>Vuelos del día:</span>
                        <strong>{flightsOfDay.length}</strong>
                    </StatLine>
                    <StatLine>
                        <span>Vuelos activos ahora:</span>
                        <strong>{activeFlightsCount}</strong>
                    </StatLine>
                  </StatsRow>

                  <SpeedControlContainer>
                      <SpeedLabel>Velocidad de reproducción</SpeedLabel>
                      <SpeedButtonGroup>
                          <SpeedButton
                            $active={playbackSpeed === SPEED_SLOW}
                            onClick={() => setPlaybackSpeed(SPEED_SLOW)}
                            disabled={!isRunning}
                          >
                            {SPEED_SLOW / 60} min/seg
                          </SpeedButton>
                          <SpeedButton
                            $active={playbackSpeed === SPEED_FAST}
                            onClick={() => setPlaybackSpeed(SPEED_FAST)}
                            disabled={!isRunning}
                          >
                            {SPEED_FAST / 60} min/seg
                          </SpeedButton>
                      </SpeedButtonGroup>
                      <SpeedHint>
                          {playbackSpeed === SPEED_SLOW && `${SPEED_SLOW / 60} minuto simulado = 1 segundo real`}
                          {playbackSpeed === SPEED_FAST && `${SPEED_FAST / 60} minutos simulados = 1 segundo real`}
                      </SpeedHint>
                  </SpeedControlContainer>

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
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
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
                  <Pane name="airports" style={{ zIndex: 450 }} />
                  <Pane name="main-hubs" style={{ zIndex: 500 }} />

                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" noWrap={true} />

                  {mainWarehouses.map((airport: any) => {
                    const center: LatLngTuple = [
                        Number(airport.latitude),
                        Number(airport.longitude),
                    ]
                    const hubFill = '#f6b53b'
                    const hubStroke = '#ebc725'

                    return (
                        <g key={`hub-${airport.id}`}>
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

                  {airports?.map((airport: any) => (
                      <CircleMarker
                          key={airport.id}
                          center={[Number(airport.latitude), Number(airport.longitude)]}
                          radius={6}
                          color="#14b8a6"
                          fillColor="#14b8a6"
                          fillOpacity={0.8}
                          weight={2}
                          pane="airports"
                          eventHandlers={{
                            click: () => setSelectedAirport(mapAirportToSimAirport(airport)),
                          }}
                      />
                  ))}

                  {hoveredFlight && (
                      (() => {
                          const origin: LatLngTuple = [
                            hoveredFlight.originAirport.latitude,
                            hoveredFlight.originAirport.longitude,
                          ]
                          const dest: LatLngTuple = [
                            hoveredFlight.destinationAirport.latitude,
                            hoveredFlight.destinationAirport.longitude,
                          ]
                          const ctrl = computeControlPoint(origin, dest)

                          const samples = 30
                          const arc: LatLngTuple[] = Array.from({ length: samples + 1 }, (_, i) => {
                            const t = i / samples
                            return bezierPoint(t, origin, ctrl, dest)
                          })

                          return (
                            <Polyline
                                positions={arc}
                                color="#3b82f6"
                                weight={2.5}
                                opacity={0.85}
                                pane="routes"
                            />
                          )
                      })()
                  )}

                  {isRunning && currentTime && (
                    <AnimatedFlights
                      flightInstances={flightInstances}
                      currentSimTime={currentTime}
                      simulationStartTime={startTime}
                      isPlaying={isRunning && !isPaused}
                      playbackSpeed={playbackSpeed}
                      speedRef={speedRef}
                      onFlightClick={handleFlightClick}
                      onFlightHover={setHoveredFlight}
                      instanceHasProducts={instanceHasProducts}
                      showOnlyWithProducts={showOnlyWithProducts}
                    />
                  )}
              </MapContainer>

              {/* ✅ Drawer como componente separado */}
              <FlightDrawer
                isOpen={panelOpen}
                onToggle={() => setPanelOpen(!panelOpen)}
                panelTab={panelTab}
                onTabChange={setPanelTab}
                flightInstances={activeFlights}
                instanceHasProducts={instanceHasProducts}
                simulationStartTime={startTime}
                activeFlightsCount={activeFlightsCount}
                onFlightClick={handleFlightClick}
                orders={orders}
                loadingOrders={loadingOrders}
              />


            </MapWrapper>

            {selectedAirport && (
                <AirportDetailsModal
                  airport={selectedAirport}
                  onClose={() => setSelectedAirport(null)}
                  flightInstances={flightInstances}
                  instanceHasProducts={instanceHasProducts}
                />
            )}

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