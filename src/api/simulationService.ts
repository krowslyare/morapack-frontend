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
}
