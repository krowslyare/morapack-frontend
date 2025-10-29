import type { Continent } from './Continent'

export interface CitySchema {
  id: number
  name: string
  country?: string
  continent: Continent
}
