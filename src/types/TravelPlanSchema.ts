import { FlightSegmentSchema } from './FlightSegmentSchema'

export interface TravelPlanSchema {
  id?: number
  planningDate?: string // LocalDateTime in Java maps to string in TS
  status: string
  selectedAlgorithm: string
  datasetVersion: string
  createdAt?: string // LocalDateTime in Java maps to string in TS
  updatedAt?: string // LocalDateTime in Java maps to string in TS
  orderId: number
  orderName: string
  flightSegments: FlightSegmentSchema[]
}
