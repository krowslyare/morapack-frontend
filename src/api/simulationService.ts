import { api, apiLongRunning } from './client'
import type { ProductSchema } from '../types'

// ===== Types =====

export interface DailyAlgorithmRequest {
  simulationStartTime: string // ISO 8601 format
  simulationDurationHours: number
  useDatabase: boolean
  simulationSpeed?: number // Optional: 1 = normal, 60 = 60x faster, etc.
  persist?: boolean // Optional: If false, don't save assignments to DB (for collapse simulation)
}

export interface DailyAlgorithmResponse {
  success: boolean
  message: string
  executionStartTime: string
  executionEndTime: string
  executionTimeSeconds: number
  simulationStartTime: string
  simulationEndTime: string
  totalOrders: number
  assignedOrders: number
  unassignedOrders: number
  totalProducts: number
  assignedProducts: number
  unassignedProducts: number
  score: number
  productRoutes: null // null because we query DB directly
  slaViolationPercentage?: number // Percentage of orders violating SLA
  ordersLate?: number // Number of orders that violated SLA (delivered after deadline)
}

export interface UpdateStatesRequest {
  currentTime: string // ISO 8601 format
}

export interface UpdateStatesResponse {
  success: boolean
  currentSimulationTime: string
  transitions: {
    pendingToInTransit: number
    inTransitToArrived: number
    arrivedToDelivered: number
    total: number
  }
  capacityStats?: {
    usedCapacity: number
    totalCapacity: number
    averageUtilization: number
  }
}

export interface FlightStatus {
  id: number
  code: string
  originAirport: {
    codeIATA: string
    city: { name: string }
    latitude?: number
    longitude?: number
  }
  destinationAirport: {
    codeIATA: string
    city: { name: string }
    latitude?: number
    longitude?: number
  }
  maxCapacity: number
  usedCapacity: number
  availableCapacity: number
  transportTimeDays: number
  dailyFrequency: number
  utilizationPercentage: number
  assignedProducts: number
  assignedOrders: number
  // Horarios reales del vuelo (formato HH:mm:ss o HH:mm)
  departureTime?: string  // e.g., "03:34:00"
  arrivalTime?: string    // e.g., "05:21:00"
}

export interface FlightInstance {
  id: string
  flightId: number
  flightCode: string
  departureTime: string // ISO 8601
  arrivalTime: string // ISO 8601
  instanceId: string // e.g., "FL-123-DAY-0-0334" - matches backend format
  originAirportId: number
  destinationAirportId: number
  originAirport: {
    codeIATA: string
    city: { name: string }
    latitude: number
    longitude: number
  }
  destinationAirport: {
    codeIATA: string
    city: { name: string }
    latitude: number
    longitude: number
  }
  status: 'SCHEDULED' | 'IN_FLIGHT' | 'ARRIVED' | 'CANCELLED'
  assignedProducts: number
}

export interface FlightStatusResponse {
  success: boolean
  totalFlights: number
  flights: FlightStatus[]
  statistics: {
    totalCapacity: number
    totalUsedCapacity: number
    averageUtilization: number
  }
}

export interface OrderOnFlight {
  id: number
  name: string
  status: string
  productsOnFlight: number
  totalProducts: number
  origin: { name: string }
  destination: { name: string }
}

export interface FlightOrdersResponse {
  success: boolean
  flightCode: string
  totalOrders: number
  orders: OrderOnFlight[]
  flight: {
    code: string
    usedCapacity: number
    maxCapacity: number
  }
}

export interface LoadOrdersRequest {
  startDate: string // ISO 8601 format
  endDate: string // ISO 8601 format
}

export interface LoadOrdersResponse {
  success: boolean
  message: string
  ordersLoaded: number
}

export interface SimulationReportRequest {
  startTime?: string // ISO 8601 format (optional)
  endTime?: string // ISO 8601 format (optional)
}

export interface CollapseScenarioRequest {
  airportId: number
  collapseStartTime: string // ISO 8601 format
  collapseDurationHours: number
}

export interface SimulationReportResponse {
  reportGeneratedAt: string
  analysisTimeRange: {
    start: string | 'All time'
    end: string | 'All time'
  }
  unassignedOrders: {
    totalProducts: number
    unassignedProducts: number
    unassignedOrders: number
    unassignedPercentage: number
  }
  warehouseSaturation: {
    totalWarehouses: number
    saturatedWarehouses: number
    details: Array<{
      warehouseId: number
      city: string
      currentCapacity: number
      maxCapacity: number
      utilizationPercent: number
    }>
  }
  flightUtilization: {
    totalFlights: number
    underutilized: number
    wellUtilized: number
    overUtilized: number
    averageUtilization: number
  }
  delayedProducts: {
    arrivedNotDelivered: number
    inTransit: number
    delivered: number
  }
  systemHealth: {
    overallScore: number
    unassignedScore: number
    warehouseScore: number
    flightUtilizationScore: number
    deliveryScore: number
    criticalIssues: number
  }
  recommendations: string[]
}

export interface BottlenecksReportResponse {
  bottlenecksFound: number
  bottlenecks: Array<{
    type: string
    severity: string
    location?: string
    description: string
    [key: string]: any
  }>
}

export interface FailuresReportResponse {
  failuresFound: number
  failures: Array<{
    type: string
    severity: string
    description: string
    [key: string]: any
  }>
}

export interface CollapseScenarioResponse {
  collapsedHub: {
    airportId: number
    cityName: string
    collapseStart: string
    collapseEnd: string
  }
  affectedFlights: {
    count: number
    flightCodes: string[]
  }
  affectedProducts: number
  affectedOrders: number
  estimatedImpact: {
    currency: string
    amount: number
    description: string
  }
  alternativeHubs: Array<{
    airportId: number
    cityName: string
    availableCapacity: number
  }>
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  recommendation: string
}

// ===== Collapse Simulation Types =====

export interface CollapseSimulationRequest {
  simulationStartTime: string // ISO 8601 format
  useDatabase: boolean
}

export interface CollapseDayStatistics {
  dayNumber: number
  dayStart: string
  ordersProcessed: number
  productsAssigned: number
  productsUnassigned: number
  assignmentRate: number
}

export interface AffectedAirport {
  airportCode: string
  airportName: string
  cityName: string
  latitude: number
  longitude: number
  unassignedProducts: number
  affectedOrders: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  reason: string
}

export interface CollapseSimulationResult {
  success: boolean
  message: string
  hasCollapsed: boolean
  collapseDay: number
  collapseTime: string | null
  collapseReason: 'UNASSIGNED_ORDERS' | 'WAREHOUSE_SATURATED' | 'NO_FLIGHTS' | 'MAX_DAYS_REACHED' | 'ERROR' | 'NONE' | 'SLA_BREACH'
  executionStartTime: string
  executionEndTime: string
  executionTimeSeconds: number
  simulationStartTime: string
  totalDaysSimulated: number
  totalOrdersProcessed: number
  totalProductsProcessed: number
  assignedProducts: number
  unassignedProducts: number
  unassignedPercentage: number
  dailyStatistics?: CollapseDayStatistics[]
  // For demo visualization
  slaCompliancePercentage?: number
  slaViolationPercentage?: number
  productsOnTime?: number
  productsLate?: number
  continentalSlaCompliance?: number
  intercontinentalSlaCompliance?: number
  affectedAirports?: AffectedAirport[]
}

// ===== Service =====

export const simulationService = {
  /**
   * Execute daily algorithm for incremental scheduling
   * Uses long-running client (90 min timeout)
   */
  executeDaily: async (
    request: DailyAlgorithmRequest, 
    signal?: AbortSignal  // ✅ Agregar parámetro opcional
  ): Promise<DailyAlgorithmResponse> => {
    const { data } = await apiLongRunning.post<DailyAlgorithmResponse>(
      '/algorithm/daily',
      request,
      { signal }  // ✅ Pasar signal a axios
    )
    return data
  },

  /**
   * Update product states based on current simulation time
   */
  updateStates: async (
    request: UpdateStatesRequest,
    signal?: AbortSignal  // ✅ Agregar parámetro opcional
  ): Promise<UpdateStatesResponse> => {
    const { data } = await apiLongRunning.post<UpdateStatesResponse>(
      '/simulation/update-states',
      request,
      { signal }  // ✅ Pasar signal a axios
    )
    return data
  },

  /**
   * Get all flight statuses for map display
   */
  getFlightStatuses: async (): Promise<FlightStatusResponse> => {
    const { data } = await api.get<FlightStatusResponse>('/query/flights/status')
    return data
  },

  /**
   * Get all flight instances that have products assigned
   * Returns instance IDs like "FL-123-DAY-0-0800" with product counts
   * Used for accurate simulation visualization
   */
  getAssignedFlightInstances: async (): Promise<{
    success: boolean
    totalInstances: number
    instances: Record<string, number>  // instanceId -> productCount
  }> => {
    const { data } = await api.get('/query/flights/instances/assigned')
    return data
  },

  /**
   * Get products for a specific order (includes assignedFlightInstance)
   */
  getProductsByOrderId: async (orderId: number): Promise<ProductSchema[]> => {
    const { data } = await api.get<{ success: boolean; products: ProductSchema[] }>(`/query/products/${orderId}`)
    return data.products || []
  },

  /**
   * Get orders assigned to a specific flight
   */
  getFlightOrders: async (flightCode: string): Promise<FlightOrdersResponse> => {
    const { data } = await api.get<FlightOrdersResponse>(`/query/flights/${flightCode}/orders`)
    return data
  },

  /**
   * Load orders for a specific time window (used for DB reset)
   */
  loadOrders: async (request: LoadOrdersRequest): Promise<LoadOrdersResponse> => {
    const { data } = await api.post<LoadOrdersResponse>('/data/load-orders', request)
    return data
  },

  /**
   * Load orders for Daily Simulation with automatic cleanup and 10-minute timeframe
   * This endpoint automatically clears old data and loads orders within the simulation window
   * USE THIS FOR INITIAL START ONLY
   */
  loadForDailySimulation: async (startTime: string): Promise<{
    success: boolean
    message: string
    statistics: {
      ordersLoaded: number
      ordersCreated: number
      ordersFiltered: number
      customersCreated: number
      parseErrors: number
      fileErrors: number
      durationSeconds: number
    }
    timeWindow: {
      startTime: string
      endTime: string
      durationMinutes: number
    }
  }> => {
    const { data } = await api.post('/data/load-for-daily', null, {
      params: { startTime },
    })
    return data
  },

  /**
   * Refresh orders for Daily Simulation WITHOUT clearing existing orders
   * Use this when re-running the algorithm during simulation (e.g., when new order is added)
   * - Does NOT clear existing orders
   * - Loads new orders from files within the 10-minute window
   * - Skips duplicates (orders already in DB)
   */
  refreshOrdersForDaily: async (startTime: string): Promise<{
    success: boolean
    message: string
    statistics: {
      ordersLoaded: number
      ordersCreated: number
      ordersFiltered: number
      duplicatesSkipped: number
      customersCreated: number
      parseErrors: number
      fileErrors: number
      durationSeconds: number
    }
    timeWindow: {
      startTime: string
      endTime: string
      durationMinutes: number
    }
  }> => {
    const { data } = await api.post('/data/refresh-orders-for-daily', null, {
      params: { startTime },
    })
    return data
  },

  /**
   * Reset database by clearing all orders (if endpoint exists)
   */
  resetDatabase: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // First, try to call a reset endpoint if it exists
      const { data } = await api.post('/data/reset-orders')
      return data
    } catch (error) {
      // If no reset endpoint, we can trigger load-orders with empty range or similar
      console.warn('No reset endpoint available, using alternative method')
      throw new Error('Reset endpoint not available')
    }
  },

  /**
   * Generate flight instances for a time window using REAL departure/arrival times
   * Each flight operates once per day at its scheduled time from flights.txt
   * Handles midnight-crossing flights properly (e.g., departs 22:00, arrives 02:00 next day)
   */
  /**
 * Generate flight instances for a time window using REAL departure/arrival times
 * Each flight operates once per day at its scheduled time from flights.txt
 * Handles midnight-crossing flights properly (e.g., departs 22:00, arrives 02:00 next day)
 */
  generateFlightInstances: (
    flights: FlightStatus[],
    startTime: Date,
    durationHours: number,
    airports: any[],
    options?: { baseDay?: number }
  ): FlightInstance[] => {
    const instances: FlightInstance[] = []

    // Validate inputs
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      console.warn('No flights provided to generateFlightInstances')
      return instances
    }

    if (!airports || !Array.isArray(airports) || airports.length === 0) {
      console.warn('No airports provided to generateFlightInstances')
      return instances
    }

    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
    const durationDays = Math.ceil(durationHours / 24)
    const baseDay = options?.baseDay ?? 0  // ✅ Default is 0 for weekly simulation

    // Helper to parse time string "HH:mm:ss" or "HH:mm" to hours and minutes
    const parseTimeString = (timeStr?: string) => {
      if (!timeStr) return null
      const [h, m] = timeStr.split(':')
      return {
        hours: Number(h),
        minutes: Number(m),
      }
    }

    flights.forEach((flight) => {
      // Find airport coordinates: prefer matching by IATA code (más fiable),
      // fallback a cityName por compatibilidad con datos antiguos
      const originAirport = airports.find((a: any) => {
        try {
          if (a.codeIATA && flight.originAirport?.codeIATA) {
            return String(a.codeIATA).toUpperCase() === String(flight.originAirport.codeIATA).toUpperCase()
          }
        } catch (e) {
          /* ignore and fallback */
        }
        return a.cityName === flight.originAirport.city.name
      })

      const destAirport = airports.find((a: any) => {
        try {
          if (a.codeIATA && flight.destinationAirport?.codeIATA) {
            return String(a.codeIATA).toUpperCase() === String(flight.destinationAirport.codeIATA).toUpperCase()
          }
        } catch (e) {
          /* ignore and fallback */
        }
        return a.cityName === flight.destinationAirport.city.name
      })

      if (!originAirport || !destAirport) return

      if (!flight.departureTime) return

      const depTime = parseTimeString(flight.departureTime)
      const arrTime = parseTimeString(flight.arrivalTime)

      const hasRealTimes = flight.departureTime != null && flight.departureTime !== ""

      // Generate one instance per day (each flight operates once per day at its scheduled time)
      for (let day = 0; day < durationDays; day++) {
        // Get the start of this simulation day in UTC
        const dayStart = new Date(Date.UTC(
          startTime.getUTCFullYear(),
          startTime.getUTCMonth(),
          startTime.getUTCDate() + day,
          0, 0, 0, 0
        ))

        let departureDateTime: Date
        let arrivalDateTime: Date

        if (hasRealTimes) {
          // 1) Salida: usa la hora real de la BD
          const hours = depTime?.hours ?? 0
          const minutes = depTime?.minutes ?? 0

          departureDateTime = new Date(Date.UTC(
            dayStart.getUTCFullYear(),
            dayStart.getUTCMonth(),
            dayStart.getUTCDate(),
            hours,
            minutes,
            0, 0
          ))

          // 2) Duración real del vuelo según transport_time_days
          const flightDurationMs =
            (flight.transportTimeDays || 0) * 24 * 60 * 60 * 1000

          // 3) Llegada = salida + duración
          arrivalDateTime = new Date(departureDateTime.getTime() + flightDurationMs)

        } else {
          // Fallback: use transport time
          const flightDurationMs = (flight.transportTimeDays || 0.5) * 24 * 60 * 60 * 1000
          departureDateTime = new Date(dayStart.getTime())
          arrivalDateTime = new Date(departureDateTime.getTime() + flightDurationMs)
        }

        // Only include if departure is within simulation window
        if (departureDateTime >= startTime && departureDateTime < endTime) {
          // ✅ CRITICAL FIX: Backend usa day 1-based (DAY-1, DAY-2, ...)
          // El loop itera day=0,1,2... así que sumamos baseDay+1
          const backendDayNumber = baseDay + day 
          
          const instanceHours = depTime ? depTime.hours : 0
          const instanceMinutes = depTime ? depTime.minutes : 0

          // ✅ Generate instanceId matching backend format EXACTLY
          const instanceId =
            `FL-${flight.id}-DAY-${backendDayNumber}-${String(instanceHours).padStart(2,'0')}${String(instanceMinutes).padStart(2,'0')}`

          instances.push({
            id: `${flight.code}-D${day}-${departureDateTime.getTime()}`,
            flightId: flight.id,
            flightCode: flight.code,
            departureTime: departureDateTime.toISOString(),
            arrivalTime: arrivalDateTime.toISOString(),
            instanceId: instanceId,
            originAirportId: originAirport.id,
            destinationAirportId: destAirport.id,
            originAirport: {
              codeIATA: originAirport.codeIATA,
              city: { name: originAirport.cityName },
              latitude: parseFloat(originAirport.latitude),
              longitude: parseFloat(originAirport.longitude),
            },
            destinationAirport: {
              codeIATA: destAirport.codeIATA,
              city: { name: destAirport.cityName },
              latitude: parseFloat(destAirport.latitude),
              longitude: parseFloat(destAirport.longitude),
            },
            status: 'SCHEDULED',
            assignedProducts: flight.assignedProducts || 0,
          })
        }
      }
    })

    // Sort instances by departure time for predictable ordering
    instances.sort((a, b) => 
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    )

    console.log(`✈️ Generated ${instances.length} flight instances for ${durationDays} days`)
    if (instances.length > 0) {
      const firstFlight = instances[0]
      const lastFlight = instances[instances.length - 1]
      console.log(`   First: ${firstFlight.flightCode} (${firstFlight.instanceId}) at ${new Date(firstFlight.departureTime).toLocaleString()}`)
      console.log(`   Last: ${lastFlight.flightCode} (${lastFlight.instanceId}) at ${new Date(lastFlight.departureTime).toLocaleString()}`)
    }

    return instances
  },

  /**
   * Add instances for next day (rolling window)
   * Used to maintain continuous flight animations
   */
  addNextDayInstances: (
    flights: FlightStatus[],
    currentInstances: FlightInstance[],
    simulationStartTime: Date,
    currentDay: number,  // 👈 0-based: 0=day1, 1=day2, etc.
    airports: any[]
  ): FlightInstance[] => {
    // Validate inputs
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      console.warn('No flights provided to addNextDayInstances')
      return currentInstances || []
    }

    if (!currentInstances || !Array.isArray(currentInstances)) {
      console.warn('Invalid currentInstances in addNextDayInstances')
      currentInstances = []
    }

    // Get the start of the next day to add
    const nextDayStart = new Date(
      simulationStartTime.getTime() + (currentDay + 1) * 24 * 60 * 60 * 1000
    )

    // Generate instances for the next day (24 hours)
    const newInstances = simulationService.generateFlightInstances(
      flights,
      nextDayStart,
      24,
      airports,
      { baseDay: currentDay + 1 }   // 👈 si currentDay=0 → DAY-2; si=1 → DAY-3, etc.
    )

    // Clean up old instances (more than 1 day old)
    const cleanupThreshold = new Date(
      simulationStartTime.getTime() + (currentDay - 1) * 24 * 60 * 60 * 1000
    )

    const cleanedInstances = currentInstances.filter((instance) => {
      const arrivalTime = new Date(instance.arrivalTime)
      // Keep if arrival is after cleanup threshold
      return arrivalTime > cleanupThreshold
    })

    console.log(
      `Rolling window: Cleaned ${currentInstances.length - cleanedInstances.length} old instances, added ${newInstances.length} new instances`
    )

    // Return combined instances
    return [...cleanedInstances, ...newInstances]
  },

  /**
   * Get comprehensive system analysis report
   * Includes: unassigned orders, warehouse saturation, flight utilization, delayed products
   */
  getSystemReport: async (
    request?: SimulationReportRequest
  ): Promise<SimulationReportResponse> => {
    const params = new URLSearchParams()
    if (request?.startTime) params.append('startTime', request.startTime)
    if (request?.endTime) params.append('endTime', request.endTime)

    const { data } = await api.get<SimulationReportResponse>(
      `/simulation/report/analysis${params.toString() ? '?' + params.toString() : ''}`
    )
    return data
  },

  /**
   * Get system bottlenecks report
   */
  getBottlenecksReport: async (): Promise<BottlenecksReportResponse> => {
    const { data } = await api.get<BottlenecksReportResponse>(
      '/simulation/report/bottlenecks'
    )
    return data
  },

  /**
   * Get system failures report
   */
  getFailuresReport: async (): Promise<FailuresReportResponse> => {
    const { data } = await api.get<FailuresReportResponse>('/simulation/report/failures')
    return data
  },

  /**
   * Simulate hub collapse scenario and analyze impact
   */
  simulateHubCollapse: async (
    request: CollapseScenarioRequest
  ): Promise<CollapseScenarioResponse> => {
    const { data } = await api.post<CollapseScenarioResponse>(
      '/simulation/report/collapse-scenario',
      request
    )
    return data
  },

  /**
   * Execute collapse simulation (backend endpoint)
   */
  runCollapseScenario: async (
    request: CollapseSimulationRequest,
    options?: { signal?: AbortSignal }
  ): Promise<CollapseSimulationResult> => {
    const { data } = await apiLongRunning.post<CollapseSimulationResult>(
      '/algorithm/collapse',
      request,
      { signal: options?.signal }
    )
    return data
  },
}
