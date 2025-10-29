import { api, apiLongRunning } from './client'
import type { AlgorithmRequest, AlgorithmResultSchema } from '../types'

export const algorithmService = {
  /**
   * Execute the optimization algorithm with custom parameters
   * Uses long-running client (90 min timeout)
   */
  execute: async (request: AlgorithmRequest): Promise<AlgorithmResultSchema> => {
    const { data } = await apiLongRunning.post<AlgorithmResultSchema>('/algorithm/execute', request)
    return data
  },

  /**
   * Execute quick optimization with default Tabu Search parameters
   * Optimized for faster execution (500 iterations)
   */
  executeQuick: async (): Promise<AlgorithmResultSchema> => {
    const { data } = await api.post<AlgorithmResultSchema>('/algorithm/execute/quick')
    return data
  },

  /**
   * Execute ALNS algorithm with default parameters
   * Uses long-running client (90 min timeout) as ALNS can take 30-90 minutes
   */
  executeALNS: async (): Promise<AlgorithmResultSchema> => {
    const { data } = await apiLongRunning.post<AlgorithmResultSchema>('/algorithm/execute/alns')
    return data
  },

  /**
   * Execute Tabu Search algorithm with default parameters
   */
  executeTabu: async (): Promise<AlgorithmResultSchema> => {
    const { data } = await apiLongRunning.post<AlgorithmResultSchema>('/algorithm/execute/tabu')
    return data
  },
}
