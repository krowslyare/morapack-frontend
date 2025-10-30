import { api } from './client'
import type { CitySchema, Continent } from '../types'

export interface GetCitiesParams {
  ids?: number[]
  continent?: Continent
  name?: string
}

export const citiesService = {
  /**
   * Get a single city by ID
   */
  getById: async (id: number): Promise<CitySchema> => {
    const { data } = await api.get<CitySchema>(`/cities/${id}`)
    return data
  },

  /**
   * Get multiple cities with optional filters
   */
  getAll: async (params?: GetCitiesParams): Promise<CitySchema[]> => {
    const { data } = await api.get<CitySchema[]>('/cities', { params })
    return data
  },

  /**
   * Get cities by continent
   */
  getByContinent: async (continent: Continent): Promise<CitySchema[]> => {
    const { data } = await api.get<CitySchema[]>('/cities', {
      params: { continent },
    })
    return data
  },

  /**
   * Search cities by name
   */
  searchByName: async (name: string): Promise<CitySchema[]> => {
    const { data } = await api.get<CitySchema[]>('/cities', {
      params: { name },
    })
    return data
  },

  /**
   * Create a new city
   */
  create: async (city: Omit<CitySchema, 'id'>): Promise<CitySchema> => {
    const { data } = await api.post<CitySchema>('/cities', city)
    return data
  },

  /**
   * Create multiple cities at once
   */
  createBulk: async (cities: Omit<CitySchema, 'id'>[]): Promise<CitySchema[]> => {
    const { data } = await api.post<CitySchema[]>('/cities/bulk', cities)
    return data
  },

  /**
   * Update an existing city
   */
  update: async (id: number, updates: Partial<CitySchema>): Promise<CitySchema> => {
    const { data } = await api.put<CitySchema>(`/cities/${id}`, updates)
    return data
  },

  /**
   * Delete a city
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/cities/${id}`)
  },
}
