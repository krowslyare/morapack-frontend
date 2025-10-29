import { api } from './client'

// TODO: Create SolutionSchema type in types folder
export interface SolutionSchema {
  id?: number
  algorithmType?: string
  totalCost?: number
  totalTime?: number
  fitness?: number
  undeliveredCount?: number
  assignedCount?: number
  executionTimeMs?: number
  createdAt?: string
  updatedAt?: string
}

export interface GetSolutionsParams {
  ids?: number[]
  minCost?: number
  maxCost?: number
  minTime?: number
  maxTime?: number
  minFitness?: number
  maxFitness?: number
  maxUndelivered?: number
}

export const solutionsService = {
  /**
   * Get a single solution by ID
   */
  getById: async (id: number): Promise<SolutionSchema> => {
    const { data } = await api.get<SolutionSchema>(`/solutions/${id}`)
    return data
  },

  /**
   * Get multiple solutions with optional filters
   */
  getAll: async (params?: GetSolutionsParams): Promise<SolutionSchema[]> => {
    const { data } = await api.get<SolutionSchema[]>('/solutions', { params })
    return data
  },

  /**
   * Get solutions by cost range
   */
  getByCostRange: async (minCost: number, maxCost: number): Promise<SolutionSchema[]> => {
    const { data } = await api.get<SolutionSchema[]>('/solutions', {
      params: { minCost, maxCost },
    })
    return data
  },

  /**
   * Get solutions by time range
   */
  getByTimeRange: async (minTime: number, maxTime: number): Promise<SolutionSchema[]> => {
    const { data } = await api.get<SolutionSchema[]>('/solutions', {
      params: { minTime, maxTime },
    })
    return data
  },

  /**
   * Get solutions by fitness range
   */
  getByFitnessRange: async (minFitness: number, maxFitness: number): Promise<SolutionSchema[]> => {
    const { data } = await api.get<SolutionSchema[]>('/solutions', {
      params: { minFitness, maxFitness },
    })
    return data
  },

  /**
   * Create a new solution
   */
  create: async (solution: SolutionSchema): Promise<SolutionSchema> => {
    const { data } = await api.post<SolutionSchema>('/solutions', solution)
    return data
  },

  /**
   * Create multiple solutions at once
   */
  createBulk: async (solutions: SolutionSchema[]): Promise<SolutionSchema[]> => {
    const { data } = await api.post<SolutionSchema[]>('/solutions/bulk', solutions)
    return data
  },

  /**
   * Update an existing solution
   */
  update: async (id: number, updates: Partial<SolutionSchema>): Promise<SolutionSchema> => {
    const { data } = await api.put<SolutionSchema>(`/solutions/${id}`, updates)
    return data
  },

  /**
   * Delete a solution
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/solutions/${id}`)
  },

  /**
   * Delete multiple solutions
   */
  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.delete('/solutions', { params: { ids } })
  },
}
