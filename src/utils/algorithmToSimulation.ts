import type { AlgorithmResultSchema, ProductRouteSchema } from '../types'
import type { SimAirport, SimFlight } from '../hooks/useFlightSimulation'
import type { FlightDTO } from '../types/ProductRouteSchema'

/**
 * Convert algorithm results (ProductRouteSchema[]) to simulation format for FlightMonitor
 */
export function convertAlgorithmResultToSimulation(result: AlgorithmResultSchema | null): {
  airports: SimAirport[]
  flights: SimFlight[]
  speed: number
} {
  if (!result || !result.productRoutes || result.productRoutes.length === 0) {
    // Return empty data if no results
    return {
      airports: [],
      flights: [],
      speed: 1,
    }
  }

  // Extract unique airports from all flights in all product routes
  const airportMap = new Map<number, SimAirport>()
  const flightSet = new Map<string, SimFlight>()

  // Process each product route
  result.productRoutes.forEach((productRoute: ProductRouteSchema) => {
    const { flights, productId, orderId } = productRoute

    // Process each flight in the route
    flights.forEach((flight: FlightDTO, flightIndex: number) => {
      // Add origin airport (using simplified data from FlightDTO)
      if (flight.originAirportId && flight.originCity) {
        if (!airportMap.has(flight.originAirportId)) {
          airportMap.set(flight.originAirportId, {
            id: flight.originAirportId,
            city: flight.originCity,
            country: 'Unknown',
            continent: 'Unknown',
            latitude: 0,
            longitude: 0,
            capacityPercent: 50,
          })
        }
      }

      // Add destination airport (using simplified data from FlightDTO)
      if (flight.destinationAirportId && flight.destinationCity) {
        if (!airportMap.has(flight.destinationAirportId)) {
          airportMap.set(flight.destinationAirportId, {
            id: flight.destinationAirportId,
            city: flight.destinationCity,
            country: 'Unknown',
            continent: 'Unknown',
            latitude: 0,
            longitude: 0,
            capacityPercent: 50,
          })
        }
      }

      // Create SimFlight from FlightDTO
      // Use flight ID + product/order for uniqueness
      const flightKey = `${flight.id}-P${productId || 'unknown'}-O${orderId}-${flightIndex}`

      if (!flightSet.has(flightKey) && flight.originAirportId && flight.destinationAirportId) {
        const simFlight: SimFlight = {
          id: flightKey,
          code: flight.code || `FLIGHT-${flight.id}`,
          originAirportId: flight.originAirportId,
          destinationAirportId: flight.destinationAirportId,
          progress: 0, // Will be animated by GSAP
          maxCapacity: flight.maxCapacity || 300,
          usedCapacity: Math.floor(Math.random() * (flight.maxCapacity || 300) * 0.7), // Estimate 70% capacity
          status: flight.status || 'En ruta',
          transportTimeDays: flight.transportTimeDays || 1.0,
          description: `Producto ${productId} - ${productRoute.originCity} → ${productRoute.destinationCity}`,
        }

        flightSet.set(flightKey, simFlight)
      }
    })
  })

  // Calculate animation speed based on total execution time
  // Longer algorithm runs = slower animation for better visualization
  const speed = calculateAnimationSpeed(result)

  return {
    airports: Array.from(airportMap.values()),
    flights: Array.from(flightSet.values()),
    speed,
  }
}

/**
 * Calculate animation speed based on algorithm execution time
 * Longer executions = more data = slower animation for clarity
 */
function calculateAnimationSpeed(result: AlgorithmResultSchema): number {
  // executionSeconds not used in calculation
  // const executionSeconds = result.executionTimeSeconds || 0
  const productCount = result.totalProducts || 1

  // Base speed on product count
  if (productCount > 100) return 1.5 // Many products: slower to see detail
  if (productCount > 50) return 1.2
  if (productCount > 20) return 1.0
  return 0.8 // Few products: faster animation
}
