import { useMutation } from '@tanstack/react-query'
import { algorithmService } from '../../api/algorithmService'
import type { AlgorithmRequest } from '../../types'

/**
 * Execute the optimization algorithm with custom parameters
 */
export function useExecuteAlgorithm() {
  return useMutation({
    mutationFn: (request: AlgorithmRequest) => algorithmService.execute(request),
  })
}

/**
 * Execute quick optimization with default Tabu Search parameters
 * Optimized for faster execution (500 iterations)
 */
export function useExecuteQuickAlgorithm() {
  return useMutation({
    mutationFn: () => algorithmService.executeQuick(),
  })
}

/**
 * Execute ALNS algorithm with default parameters
 */
export function useExecuteALNS() {
  return useMutation({
    mutationFn: () => algorithmService.executeALNS(),
  })
}

/**
 * Execute Tabu Search algorithm with default parameters
 */
export function useExecuteTabu() {
  return useMutation({
    mutationFn: () => algorithmService.executeTabu(),
  })
}
