import { FlightSchema } from './FlightSchema';

export interface ProductRouteSchema {
  productId?: number;
  orderId: number;
  orderName: string;
  flights: FlightSchema[];
  originCity: string;
  destinationCity: string;
  flightCount: number;
}
