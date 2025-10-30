import { PackageStatus } from './PackageStatus'
import { CustomerSchema } from './CustomerSchema'
import { CitySchema } from './CitySchema'
import { RouteSchema } from './RouteSchema'
import { ProductSchema } from './ProductSchema'

export interface OrderSchema {
  id?: number
  name: string
  originCityId: number
  originCityName: string
  destinationCityId: number
  destinationCityName: string
  deliveryDate: string // LocalDateTime in Java maps to string in TS
  status: PackageStatus
  pickupTimeHours?: number
  creationDate?: string // LocalDateTime in Java maps to string in TS
  updatedAt?: string // LocalDateTime in Java maps to string in TS
  customerId: number

  // Legacy fields for algorithm compatibility
  customerSchema?: CustomerSchema
  destinationCitySchema?: CitySchema
  orderDate?: string // LocalDateTime in Java maps to string in TS
  deliveryDeadline?: string // LocalDateTime in Java maps to string in TS
  currentLocation?: CitySchema
  assignedRouteSchema?: RouteSchema
  priority?: number
  productSchemas?: ProductSchema[]
}
