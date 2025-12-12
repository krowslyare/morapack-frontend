import { AirportSchema } from './AirportSchema'

export interface FlightSchema {
  id?: number
  code: string
  routeType: string
  maxCapacity: number
  transportTimeDays: number
  dailyFrequency: number
  status: string
  createdAt?: string // LocalDateTime in Java maps to string in TS
  airplaneId: number
  originAirportId: number
  originAirportCode: string
  destinationAirportId: number
  destinationAirportCode: string

  // Horarios de vuelo (del archivo flights.txt: formato HH:mm)
  departureTime?: string  // e.g., "03:34"
  arrivalTime?: string    // e.g., "05:21"

  // ✅ Agregar esta propiedad
  assignedProducts?: number

  // Legacy fields for algorithm compatibility
  frequencyPerDay?: number
  originAirportSchema?: AirportSchema
  destinationAirportSchema?: AirportSchema
  usedCapacity?: number
  transportTime?: number
  cost?: number
}
