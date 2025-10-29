import { CitySchema } from './CitySchema'
import { AirportState } from './AirportState'
import { Warehouse } from './Warehouse'

export interface AirportSchema {
  id?: number
  codeIATA: string
  alias: string
  timezoneUTC: number
  latitude: string
  longitude: string
  cityId: number
  cityName: string
  state: AirportState
  warehouseId?: number

  // Legacy fields for algorithm compatibility
  citySchema?: CitySchema
  warehouse?: Warehouse
}
