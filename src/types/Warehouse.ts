import { AirportSchema } from './AirportSchema'

export interface Warehouse {
  id: number
  airportSchema: AirportSchema
  maxCapacity: number
  usedCapacity: number
  name: string
  isMainWarehouse: boolean
}
