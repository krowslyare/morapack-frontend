import { api, apiLongRunning } from './client'

// ===== Types =====

export interface DailyAlgorithmRequest {
  simulationStartTime: string // ISO 8601 format
  simulationDurationHours: number
  useDatabase: boolean
  simulationSpeed?: number // Optional: 1 = normal, 60 = 60x faster, etc.
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
}

export interface FlightInstance {
  id: string
  flightId: number
  flightCode: string
  departureTime: string // ISO 8601
  arrivalTime: string // ISO 8601
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

export interface CollapseSimulationResult {
  success: boolean
  message: string
  hasCollapsed: boolean
  collapseDay: number
  collapseTime: string | null
  collapseReason: 'UNASSIGNED_ORDERS' | 'WAREHOUSE_SATURATED' | 'NO_FLIGHTS' | 'MAX_DAYS_REACHED' | 'ERROR' | 'NONE'
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
}

// ===== Service =====

export const simulationService = {
  /**
   * Execute daily algorithm for incremental scheduling
   * Uses long-running client (90 min timeout)
   */
  executeDaily: async (request: DailyAlgorithmRequest): Promise<DailyAlgorithmResponse> => {
    const { data } = await apiLongRunning.post<DailyAlgorithmResponse>(
      '/algorithm/daily',
      request
    )
    return data
  },

  /**
   * Update product states based on current simulation time
   */
  updateStates: async (request: UpdateStatesRequest): Promise<UpdateStatesResponse> => {
    const { data } = await apiLongRunning.post<UpdateStatesResponse>(
      '/simulation/update-states',
      request
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
   * Generate flight instances for a time window with cyclic daily repetition
   * This creates scheduled flights based on flight data and simulation time
   * Handles midnight-crossing flights properly
   */
  generateFlightInstances: (
    flights: FlightStatus[],
    startTime: Date,
    durationHours: number,
    airports: any[]
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

    // Calculate how many full days we need
    const durationDays = Math.ceil(durationHours / 24)

    flights.forEach((flight) => {
      // Generate instances based on daily frequency
      const frequency = flight.dailyFrequency || 1
      const intervalHours = 24 / frequency
      const flightDurationMs = flight.transportTimeDays * 24 * 60 * 60 * 1000

      // Find airport coordinates
      const originAirport = airports.find(
        (a: any) => a.cityName === flight.originAirport.city.name
      )
      const destAirport = airports.find(
        (a: any) => a.cityName === flight.destinationAirport.city.name
      )

      if (!originAirport || !destAirport) return

      // Generate instances for each day in the window
      for (let day = 0; day < durationDays; day++) {
        const dayStart = new Date(startTime.getTime() + day * 24 * 60 * 60 * 1000)

        // Generate instances for this day based on frequency
        for (let i = 0; i < frequency; i++) {
          const departureTime = new Date(
            dayStart.getTime() + i * intervalHours * 60 * 60 * 1000
          )

          // Only include if departure is within window
          // But allow arrival to extend beyond (for midnight-crossing flights)
          if (departureTime >= startTime && departureTime < endTime) {
            const arrivalTime = new Date(departureTime.getTime() + flightDurationMs)

            instances.push({
              id: `${flight.code}-D${day}-F${i}-${departureTime.getTime()}`,
              flightId: flight.id,
              flightCode: flight.code,
              departureTime: departureTime.toISOString(),
              arrivalTime: arrivalTime.toISOString(),
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
      }
    })

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
    currentDay: number,
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
      airports
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
