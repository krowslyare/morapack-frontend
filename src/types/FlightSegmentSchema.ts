export interface FlightSegmentSchema {
  id?: number
  estimateTimeDestination?: string // LocalDateTime in Java maps to string in TS
  estimatedTimeArrival?: string // LocalDateTime in Java maps to string in TS
  reservedCapacity: number
  createdAt?: string // LocalDateTime in Java maps to string in TS
  planId: number
  orderId: number
  orderName: string
}
