import { api } from './client'
import type { ProductSchema, PackageStatus } from '../types'

export interface GetProductsParams {
  ids?: number[]
  orderId?: number
  status?: PackageStatus
  minWeight?: number
  maxWeight?: number
  originCityId?: number
  destinationCityId?: number
}

export const productsService = {
  /**
   * Get a single product by ID
   */
  getById: async (id: number): Promise<ProductSchema> => {
    const { data } = await api.get<ProductSchema>(`/products/${id}`)
    return data
  },

  /**
   * Get multiple products with optional filters
   */
  getAll: async (params?: GetProductsParams): Promise<ProductSchema[]> => {
    const { data } = await api.get<ProductSchema[]>('/products', { params })
    return data
  },

  /**
   * Get products by order ID
   */
  getByOrder: async (orderId: number): Promise<ProductSchema[]> => {
    const { data } = await api.get<ProductSchema[]>('/products', {
      params: { orderId },
    })
    return data
  },

  /**
   * Get products by status
   */
  getByStatus: async (status: PackageStatus): Promise<ProductSchema[]> => {
    const { data } = await api.get<ProductSchema[]>('/products', {
      params: { status },
    })
    return data
  },

  /**
   * Get products by weight range
   */
  getByWeightRange: async (minWeight: number, maxWeight: number): Promise<ProductSchema[]> => {
    const { data } = await api.get<ProductSchema[]>('/products', {
      params: { minWeight, maxWeight },
    })
    return data
  },

  /**
   * Create a new product
   */
  create: async (product: Omit<ProductSchema, 'id'>): Promise<ProductSchema> => {
    const { data } = await api.post<ProductSchema>('/products', product)
    return data
  },

  /**
   * Create multiple products at once
   */
  createBulk: async (products: Omit<ProductSchema, 'id'>[]): Promise<ProductSchema[]> => {
    const { data } = await api.post<ProductSchema[]>('/products/bulk', products)
    return data
  },

  /**
   * Update an existing product
   */
  update: async (id: number, updates: Partial<ProductSchema>): Promise<ProductSchema> => {
    const { data } = await api.put<ProductSchema>(`/products/${id}`, updates)
    return data
  },

  /**
   * Update product status
   */
  updateStatus: async (id: number, status: PackageStatus): Promise<ProductSchema> => {
    const { data } = await api.patch<ProductSchema>(`/products/${id}/status`, null, {
      params: { status },
    })
    return data
  },

  /**
   * Delete a product
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}
