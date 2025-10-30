import { api } from './client'
import type { CustomerSchema } from '../types'

export interface GetCustomersParams {
  ids?: number[]
  email?: string
  name?: string
}

export const customersService = {
  /**
   * Get a single customer by ID
   */
  getById: async (id: number): Promise<CustomerSchema> => {
    const { data } = await api.get<CustomerSchema>(`/customers/${id}`)
    return data
  },

  /**
   * Get multiple customers with optional filters
   */
  getAll: async (params?: GetCustomersParams): Promise<CustomerSchema[]> => {
    const { data } = await api.get<CustomerSchema[]>('/customers', { params })
    return data
  },

  /**
   * Search customer by email
   */
  getByEmail: async (email: string): Promise<CustomerSchema | null> => {
    const { data } = await api.get<CustomerSchema[]>('/customers', {
      params: { email },
    })
    return data[0] || null
  },

  /**
   * Search customers by name
   */
  searchByName: async (name: string): Promise<CustomerSchema[]> => {
    const { data } = await api.get<CustomerSchema[]>('/customers', {
      params: { name },
    })
    return data
  },

  /**
   * Create a new customer
   */
  create: async (customer: Omit<CustomerSchema, 'id'>): Promise<CustomerSchema> => {
    const { data } = await api.post<CustomerSchema>('/customers', customer)
    return data
  },

  /**
   * Create multiple customers at once
   */
  createBulk: async (customers: Omit<CustomerSchema, 'id'>[]): Promise<CustomerSchema[]> => {
    const { data } = await api.post<CustomerSchema[]>('/customers/bulk', customers)
    return data
  },

  /**
   * Update an existing customer
   */
  update: async (id: number, updates: Partial<CustomerSchema>): Promise<CustomerSchema> => {
    const { data } = await api.put<CustomerSchema>(`/customers/${id}`, updates)
    return data
  },

  /**
   * Delete a customer
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`)
  },
}
