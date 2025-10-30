export interface FlightTimelineEvent {
  eventId: string
  eventType: 'DEPARTURE' | 'ARRIVAL'
  eventTime: string // ISO datetime
  flightId?: number
  flightCode?: string
  productId?: number
  orderId?: number
  originCity?: string
  destinationCity?: string
  originAirportId?: number
  destinationAirportId?: number
  transportTimeDays?: number
}

import type { ProductRouteSchema } from './ProductRouteSchema'

export interface SimulationTimelineResult {
  simulationStartTime: string // ISO datetime
  simulationEndTime: string // ISO datetime
  totalDurationMinutes: number
  events: FlightTimelineEvent[]
  productRoutes: ProductRouteSchema[] // ProductRouteDTO[]
  totalProducts: number
  totalFlights: number
  totalAirports: number
}
