import { Status } from './Status'

// Representa un tramo de vuelo en una ruta multi-escala
export interface ProductFlightLeg {
  flightId: number
  flightCode: string
  originAirportCode: string
  destinationAirportCode: string
  sequenceOrder: number
  instanceId?: string
  departureTime?: string
  arrivalTime?: string
}

export interface ProductSchema {
  id?: number
  name: string
  weight: number
  volume: number
  creationDate?: string // LocalDateTime in Java maps to string in TS
  orderId: number
  assignedFlight?: string // Ruta del vuelo, ej: "SPIM-SKBO -> SKBO-SUAA"
  assignedFlightInstance?: string // Instance ID del último vuelo, ej: "FL-45-DAY-0-2000"
  status: Status
  // Nuevo: lista de todos los vuelos en la ruta (desde product_flights)
  flightLegs?: ProductFlightLeg[]
}
