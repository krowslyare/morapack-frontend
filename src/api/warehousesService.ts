import { api } from './client'
import type { Warehouse } from '../types'

export interface GetWarehousesParams {
  ids?: number[]
  airportId?: number
  mainOnly?: boolean
  minCapacity?: number
  maxUsed?: number
}

export const warehousesService = {
  /**
   * Get a single warehouse by ID
   */
  getById: async (id: number): Promise<Warehouse> => {
    const { data } = await api.get<Warehouse>(`/warehouses/${id}`)
    return data
  },

  /**
   * Get multiple warehouses with optional filters
   */
  getAll: async (params?: GetWarehousesParams): Promise<Warehouse[]> => {
    const { data } = await api.get<Warehouse[]>('/warehouses', { params })
    return data
  },

  /**
   * Get warehouse by airport ID
   */
  getByAirport: async (airportId: number): Promise<Warehouse[]> => {
    const { data } = await api.get<Warehouse[]>('/warehouses', {
      params: { airportId },
    })
    return data
  },

  /**
   * Create a new warehouse
   */
  create: async (warehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
    const { data } = await api.post<Warehouse>('/warehouses', warehouse)
    return data
  },

  /**
   * Create multiple warehouses at once
   */
  createBulk: async (warehouses: Omit<Warehouse, 'id'>[]): Promise<Warehouse[]> => {
    const { data } = await api.post<Warehouse[]>('/warehouses/bulk', warehouses)
    return data
  },

  /**
   * Update an existing warehouse
   */
  update: async (id: number, updates: Partial<Warehouse>): Promise<Warehouse> => {
    const { data } = await api.put<Warehouse>(`/warehouses/${id}`, updates)
    return data
  },

  /**
   * Delete a warehouse
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`)
  },
}
