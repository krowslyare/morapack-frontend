// src/utils/flightMapper.ts

import type { FlightSchema } from '../types/FlightSchema'
import type { AirportSchema } from '../types/AirportSchema'

interface TimelineFlight {
  flightId: number
  originAirportId: number
  destinationAirportId: number
  progress: number
  status: string
}

interface TimelineEntry {
  time: number
  flights: TimelineFlight[]
}

interface SimulationWaypoint {
  lat: number
  lng: number
  timestamp: number
}

interface SimulationRoute {
  flightId: number
  code: string
  originAirportId: number
  destinationAirportId: number
  maxCapacity: number
  dailyFrequency: number
  waypoints: SimulationWaypoint[]
}

export interface SimulationResults {
  assignedOrders: number
  productRoutes: SimulationRoute[]
  timeline: TimelineEntry[]
}

export function mapFlightsToSimulationResults(
  flights: FlightSchema[],
  airports: AirportSchema[],
): SimulationResults {
  const airportMap = new Map<number, AirportSchema>(
    airports.map((a) => [a.id!, a]),
  )

  const now = Date.now()

  const productRoutes: SimulationRoute[] = flights
    .map((f) => {
      const origin = airportMap.get(f.originAirportId)
      const dest = airportMap.get(f.destinationAirportId)
      if (!origin || !dest) return null

      const oLat = Number(origin.latitude)
      const oLng = Number(origin.longitude)
      const dLat = Number(dest.latitude)
      const dLng = Number(dest.longitude)

      const travelMs = (f.transportTimeDays ?? 0) * 24 * 60 * 60 * 1000

      return {
        flightId: f.id!,
        code: f.code,
        originAirportId: f.originAirportId,
        destinationAirportId: f.destinationAirportId,
        maxCapacity: f.maxCapacity,
        dailyFrequency: f.dailyFrequency,
        waypoints: [
          { lat: oLat, lng: oLng, timestamp: now },
          { lat: dLat, lng: dLng, timestamp: now + travelMs },
        ],
      }
    })
    .filter((r): r is SimulationRoute => r !== null)

  // === TIMELINE REAL ===
  const timeline: TimelineEntry[] = [
    {
      time: 0,
      flights: productRoutes.map((r) => ({
        flightId: r.flightId,
        originAirportId: r.originAirportId,
        destinationAirportId: r.destinationAirportId,
        progress: 0,
        status: 'IN_FLIGHT',
      })),
    },
  ]

  return {
    assignedOrders: 0,
    productRoutes,
    timeline,
  }
}
