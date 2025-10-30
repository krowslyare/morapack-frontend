import { api } from './client'
import type { OrderSchema, PackageStatus } from '../types'

export interface GetOrdersParams {
  ids?: number[]
  status?: PackageStatus
  startDate?: string
  endDate?: string
}

export const ordersService = {
  /**
   * Get a single order by ID
   */
  getById: async (id: number): Promise<OrderSchema> => {
    const { data } = await api.get<OrderSchema>(`/orders/${id}`)
    return data
  },

  /**
   * Get multiple orders with optional filters
   */
  getAll: async (params?: GetOrdersParams): Promise<OrderSchema[]> => {
    const { data } = await api.get<OrderSchema[]>('/orders', { params })
    return data
  },

  /**
   * Get orders by status
   */
  getByStatus: async (status: PackageStatus): Promise<OrderSchema[]> => {
    const { data } = await api.get<OrderSchema[]>('/orders', {
      params: { status },
    })
    return data
  },

  /**
   * Get orders by delivery date range
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<OrderSchema[]> => {
    const { data } = await api.get<OrderSchema[]>('/orders', {
      params: { startDate, endDate },
    })
    return data
  },

  /**
   * Create a new order
   */
  create: async (order: Omit<OrderSchema, 'id'>): Promise<OrderSchema> => {
    const { data } = await api.post<OrderSchema>('/orders', order)
    return data
  },

  /**
   * Create multiple orders at once
   */
  createBulk: async (orders: Omit<OrderSchema, 'id'>[]): Promise<OrderSchema[]> => {
    const { data } = await api.post<OrderSchema[]>('/orders/bulk', orders)
    return data
  },

  /**
   * Update an existing order
   */
  update: async (id: number, updates: Partial<OrderSchema>): Promise<OrderSchema> => {
    const { data } = await api.put<OrderSchema>(`/orders/${id}`, updates)
    return data
  },

  /**
   * Update order status
   */
  updateStatus: async (id: number, status: PackageStatus): Promise<OrderSchema> => {
    const { data } = await api.patch<OrderSchema>(`/orders/${id}/status`, null, {
      params: { status },
    })
    return data
  },

  /**
   * Delete an order
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`)
  },
}
