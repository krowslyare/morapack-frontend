import type { Continent } from './Continent';

export interface CitySchema {
  id: number;
  name: string;
  continent: Continent;
}
