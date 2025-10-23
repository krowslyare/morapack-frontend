import { CitySchema } from './CitySchema';

export interface CustomerSchema {
  id?: number;
  phone: string;
  fiscalAddress: string;
  createdAt?: string; // LocalDateTime in Java maps to string in TS
  personId: number;
  personName: string;
  personLastName: string;

  // Legacy fields for algorithm compatibility
  name?: string;
  email?: string;
  deliveryCitySchema?: CitySchema;
}
