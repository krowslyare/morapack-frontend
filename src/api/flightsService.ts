import { api } from './client'
import type { FlightSchema } from '../types'

export interface GetFlightsParams {
  ids?: number[]
  airplaneId?: number
  originAirportId?: number
  destinationAirportId?: number
  status?: string
  minCapacity?: number
  minTransportTime?: number
  maxTransportTime?: number
  minFrequency?: number
  maxFrequency?: number
  startDate?: string
  endDate?: string
}

export const flightsService = {
  /**
   * Get a single flight by ID
   */
  getById: async (id: number): Promise<FlightSchema> => {
    const { data } = await api.get<FlightSchema>(`/flights/${id}`)
    return data
  },

  /**
   * Get multiple flights with optional filters
   */
  getAll: async (params?: GetFlightsParams): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', { params })
    return data
  },

  /**
   * Get flights by airplane
   */
  getByAirplane: async (airplaneId: number): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', {
      params: { airplaneId },
    })
    return data
  },

  /**
   * Get flights by origin airport
   */
  getByOrigin: async (originAirportId: number): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', {
      params: { originAirportId },
    })
    return data
  },

  /**
   * Get flights by destination airport
   */
  getByDestination: async (destinationAirportId: number): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', {
      params: { destinationAirportId },
    })
    return data
  },

  /**
   * Get flights by status
   */
  getByStatus: async (status: string): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', {
      params: { status },
    })
    return data
  },

  /**
   * Get flights with minimum capacity
   */
  getByCapacity: async (minCapacity: number): Promise<FlightSchema[]> => {
    const { data } = await api.get<FlightSchema[]>('/flights', {
      params: { minCapacity },
    })
    return data
  },

  /**
   * Create a new flight
   */
  create: async (flight: Omit<FlightSchema, 'id'>): Promise<FlightSchema> => {
    const { data } = await api.post<FlightSchema>('/flights', flight)
    return data
  },

  /**
   * Create multiple flights at once
   */
  createBulk: async (flights: Omit<FlightSchema, 'id'>[]): Promise<FlightSchema[]> => {
    const { data } = await api.post<FlightSchema[]>('/flights/bulk', flights)
    return data
  },

  /**
   * Update an existing flight
   */
  update: async (id: number, updates: Partial<FlightSchema>): Promise<FlightSchema> => {
    const { data } = await api.put<FlightSchema>(`/flights/${id}`, updates)
    return data
  },

  /**
   * Delete a flight
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/flights/${id}`)
  },

  /**
   * Get count of all flights or filtered by status
   */
  getCount: async (status?: string): Promise<number> => {
    const { data } = await api.get<number>('/flights/count', {
      params: status ? { status } : undefined,
    })
    return data
  },
}
