import { api } from './client'
import type { AirportSchema } from '../types'

export interface GetAirportsParams {
  ids?: number[]
  cityId?: number
  minCapacity?: number
  maxCapacity?: number
  isHeadquarters?: boolean
}

export const airportsService = {
  /**
   * Get a single airport by ID
   */
  getById: async (id: number): Promise<AirportSchema> => {
    const { data } = await api.get<AirportSchema>(`/airports/${id}`)
    return data
  },

  /**
   * Get multiple airports with optional filters
   */
  getAll: async (params?: GetAirportsParams): Promise<AirportSchema[]> => {
    const { data } = await api.get<AirportSchema[]>('/airports', { params })
    console.log(data[0].citySchema?.country)
    return data
  },

  /**
   * Get airports by city
   */
  getByCity: async (cityId: number): Promise<AirportSchema[]> => {
    const { data } = await api.get<AirportSchema[]>('/airports', {
      params: { cityId },
    })
    return data
  },

  /**
   * Get headquarters airports only
   */
  getHeadquarters: async (): Promise<AirportSchema[]> => {
    const { data } = await api.get<AirportSchema[]>('/airports', {
      params: { isHeadquarters: true },
    })
    return data
  },

  /**
   * Get airports by capacity range
   */
  getByCapacityRange: async (
    minCapacity: number,
    maxCapacity: number,
  ): Promise<AirportSchema[]> => {
    const { data } = await api.get<AirportSchema[]>('/airports', {
      params: { minCapacity, maxCapacity },
    })
    return data
  },

  /**
   * Create a new airport
   */
  create: async (airport: Omit<AirportSchema, 'id'>): Promise<AirportSchema> => {
    const { data } = await api.post<AirportSchema>('/airports', airport)
    return data
  },

  /**
   * Create multiple airports at once
   */
  createBulk: async (airports: Omit<AirportSchema, 'id'>[]): Promise<AirportSchema[]> => {
    const { data } = await api.post<AirportSchema[]>('/airports/bulk', airports)
    return data
  },

  /**
   * Update an existing airport
   */
  update: async (id: number, updates: Partial<AirportSchema>): Promise<AirportSchema> => {
    const { data } = await api.put<AirportSchema>(`/airports/${id}`, updates)
    return data
  },

  /**
   * Delete an airport
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/airports/${id}`)
  },
}
