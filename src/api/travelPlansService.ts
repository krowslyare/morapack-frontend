import { api } from './client'
import type { TravelPlanSchema } from '../types'

export interface GetTravelPlansParams {
  ids?: number[]
  productId?: number
  orderId?: number
  isActive?: boolean
}

export const travelPlansService = {
  /**
   * Get a single travel plan by ID
   */
  getById: async (id: number): Promise<TravelPlanSchema> => {
    const { data } = await api.get<TravelPlanSchema>(`/travel-plans/${id}`)
    return data
  },

  /**
   * Get multiple travel plans with optional filters
   */
  getAll: async (params?: GetTravelPlansParams): Promise<TravelPlanSchema[]> => {
    const { data } = await api.get<TravelPlanSchema[]>('/travel-plans', {
      params,
    })
    return data
  },

  /**
   * Get travel plan for a specific product
   */
  getByProduct: async (productId: number): Promise<TravelPlanSchema[]> => {
    const { data } = await api.get<TravelPlanSchema[]>('/travel-plans', {
      params: { productId },
    })
    return data
  },

  /**
   * Get travel plans for a specific order
   */
  getByOrder: async (orderId: number): Promise<TravelPlanSchema[]> => {
    const { data } = await api.get<TravelPlanSchema[]>('/travel-plans', {
      params: { orderId },
    })
    return data
  },

  /**
   * Get only active travel plans
   */
  getActive: async (): Promise<TravelPlanSchema[]> => {
    const { data } = await api.get<TravelPlanSchema[]>('/travel-plans', {
      params: { isActive: true },
    })
    return data
  },

  /**
   * Create a new travel plan
   */
  create: async (plan: Omit<TravelPlanSchema, 'id'>): Promise<TravelPlanSchema> => {
    const { data } = await api.post<TravelPlanSchema>('/travel-plans', plan)
    return data
  },

  /**
   * Create multiple travel plans at once
   */
  createBulk: async (plans: Omit<TravelPlanSchema, 'id'>[]): Promise<TravelPlanSchema[]> => {
    const { data } = await api.post<TravelPlanSchema[]>('/travel-plans/bulk', plans)
    return data
  },

  /**
   * Update an existing travel plan
   */
  update: async (id: number, updates: Partial<TravelPlanSchema>): Promise<TravelPlanSchema> => {
    const { data } = await api.put<TravelPlanSchema>(`/travel-plans/${id}`, updates)
    return data
  },

  /**
   * Delete a travel plan
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/travel-plans/${id}`)
  },
}
