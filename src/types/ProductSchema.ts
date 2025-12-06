import { Status } from './Status'

export interface ProductSchema {
  id?: number
  name: string
  weight: number
  volume: number
  creationDate?: string // LocalDateTime in Java maps to string in TS
  orderId: number
  assignedFlight?: string // Ruta del vuelo, ej: "SPIM-SPZO"
  assignedFlightInstance?: string // Instance ID, ej: "FL-45-DAY-0-2000"
  status: Status
}
