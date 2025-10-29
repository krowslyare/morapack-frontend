import { Status } from './Status'

export interface ProductSchema {
  id?: number
  name: string
  weight: number
  volume: number
  creationDate?: string // LocalDateTime in Java maps to string in TS
  orderId: number
  assignedFlight?: string // StringBuilder in Java maps to string in TS
  status: Status
}
