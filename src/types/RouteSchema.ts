import { FlightSchema } from './FlightSchema'
import { CitySchema } from './CitySchema'
import { OrderSchema } from './OrderSchema'

export interface RouteSchema {
  id: number
  flightSchemas: FlightSchema[]
  originCitySchema: CitySchema
  destinationCitySchema: CitySchema
  totalTime: number
  totalCost: number
  orderSchemas: OrderSchema[]
}
