import { AirportSchema } from './AirportSchema';

export interface FlightSchema {
  id?: number;
  code: string;
  routeType: string;
  maxCapacity: number;
  transportTimeDays: number;
  dailyFrequency: number;
  status: string;
  createdAt?: string; // LocalDateTime in Java maps to string in TS
  airplaneId: number;
  originAirportId: number;
  originAirportCode: string;
  destinationAirportId: number;
  destinationAirportCode: string;

  // Legacy fields for algorithm compatibility
  frequencyPerDay?: number;
  originAirportSchema?: AirportSchema;
  destinationAirportSchema?: AirportSchema;
  usedCapacity?: number;
  transportTime?: number;
  cost?: number;
}
