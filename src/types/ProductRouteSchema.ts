// Simplified Flight DTO (matches backend FlightDTO)
export interface FlightDTO {
  id?: number
  code?: string
  routeType?: string
  maxCapacity?: number
  transportTimeDays?: number
  status?: string
  originCity?: string
  destinationCity?: string
  originAirportId?: number
  destinationAirportId?: number
}

export interface ProductRouteSchema {
  productId?: number
  orderId: number
  orderName: string
  flights: FlightDTO[] // Using FlightDTO instead of FlightSchema to avoid circular refs
  originCity: string
  destinationCity: string
  flightCount: number
}
