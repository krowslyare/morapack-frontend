import { useMemo } from 'react'
import type { ActiveFlight } from './useTemporalSimulation'

export interface CullingOptions {
  maxFlightsToRender?: number // Maximum number of flights to show (default: 100)
  prioritizeNewerFlights?: boolean // Show newer flights first
  viewportBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Hook to optimize flight rendering by:
 * 1. Limiting the number of rendered flights
 * 2. Filtering flights outside viewport (spatial culling)
 * 3. Prioritizing flights based on criteria
 * 
 * This prevents lag when dealing with 1000+ flights
 */
export function useFlightCulling(
  allFlights: ActiveFlight[],
  airports: Array<{ id: number; latitude: number; longitude: number }>,
  options: CullingOptions = {}
) {
  const {
    maxFlightsToRender = 100,
    prioritizeNewerFlights = true,
    viewportBounds
  } = options

  const airportById = useMemo(() => {
    const map = new Map<number, { latitude: number; longitude: number }>()
    airports.forEach(a => map.set(a.id, { latitude: a.latitude, longitude: a.longitude }))
    return map
  }, [airports])

  const culledFlights = useMemo(() => {
    if (allFlights.length === 0) return []

    // Step 1: Spatial culling - filter flights outside viewport
    let visibleFlights = allFlights

    if (viewportBounds) {
      visibleFlights = allFlights.filter(flight => {
        const origin = airportById.get(flight.originAirportId)
        const dest = airportById.get(flight.destinationAirportId)
        
        if (!origin || !dest) return false

        // Check if either origin or destination is in viewport
        const originInView = 
          origin.latitude >= viewportBounds.south &&
          origin.latitude <= viewportBounds.north &&
          origin.longitude >= viewportBounds.west &&
          origin.longitude <= viewportBounds.east

        const destInView =
          dest.latitude >= viewportBounds.south &&
          dest.latitude <= viewportBounds.north &&
          dest.longitude >= viewportBounds.west &&
          dest.longitude <= viewportBounds.east

        // Also check if the flight path intersects the viewport
        // For simplicity, include if either endpoint is visible
        return originInView || destInView
      })
    }

    // Step 2: Prioritization
    const sortedFlights = [...visibleFlights]
    if (prioritizeNewerFlights) {
      // Sort by departure time (newer first)
      sortedFlights.sort((a, b) => 
        b.departureTime.getTime() - a.departureTime.getTime()
      )
    } else {
      // Sort by progress (flights further along first)
      sortedFlights.sort((a, b) => b.progress - a.progress)
    }

    // Step 3: Limit number of rendered flights
    const limitedFlights = sortedFlights.slice(0, maxFlightsToRender)

    // Debug info
    if (allFlights.length > maxFlightsToRender) {
      console.log(
        `[CULLING] ${allFlights.length} total flights → ${visibleFlights.length} visible → ${limitedFlights.length} rendered (max: ${maxFlightsToRender})`
      )
    }

    return limitedFlights
  }, [allFlights, airportById, viewportBounds, maxFlightsToRender, prioritizeNewerFlights])

  return {
    culledFlights,
    totalFlights: allFlights.length,
    renderedFlights: culledFlights.length,
    culledCount: allFlights.length - culledFlights.length
  }
}

