import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  solutionsService,
  type GetSolutionsParams,
  type SolutionSchema,
} from '../../api/solutionsService'

// Query keys
export const solutionKeys = {
  all: ['solutions'] as const,
  lists: () => [...solutionKeys.all, 'list'] as const,
  list: (params?: GetSolutionsParams) => [...solutionKeys.lists(), params] as const,
  details: () => [...solutionKeys.all, 'detail'] as const,
  detail: (id: number) => [...solutionKeys.details(), id] as const,
  byCostRange: (minCost: number, maxCost: number) =>
    [...solutionKeys.all, 'cost', minCost, maxCost] as const,
  byTimeRange: (minTime: number, maxTime: number) =>
    [...solutionKeys.all, 'time', minTime, maxTime] as const,
  byFitnessRange: (minFitness: number, maxFitness: number) =>
    [...solutionKeys.all, 'fitness', minFitness, maxFitness] as const,
}

/**
 * Get a single solution by ID
 */
export function useSolution(id: number, enabled = true) {
  return useQuery({
    queryKey: solutionKeys.detail(id),
    queryFn: () => solutionsService.getById(id),
    enabled,
  })
}

/**
 * Get multiple solutions with optional filters
 */
export function useSolutions(params?: GetSolutionsParams, enabled = true) {
  return useQuery({
    queryKey: solutionKeys.list(params),
    queryFn: () => solutionsService.getAll(params),
    enabled,
  })
}

/**
 * Get solutions by cost range
 */
export function useSolutionsByCostRange(minCost: number, maxCost: number, enabled = true) {
  return useQuery({
    queryKey: solutionKeys.byCostRange(minCost, maxCost),
    queryFn: () => solutionsService.getByCostRange(minCost, maxCost),
    enabled,
  })
}

/**
 * Get solutions by time range
 */
export function useSolutionsByTimeRange(minTime: number, maxTime: number, enabled = true) {
  return useQuery({
    queryKey: solutionKeys.byTimeRange(minTime, maxTime),
    queryFn: () => solutionsService.getByTimeRange(minTime, maxTime),
    enabled,
  })
}

/**
 * Get solutions by fitness range
 */
export function useSolutionsByFitnessRange(minFitness: number, maxFitness: number, enabled = true) {
  return useQuery({
    queryKey: solutionKeys.byFitnessRange(minFitness, maxFitness),
    queryFn: () => solutionsService.getByFitnessRange(minFitness, maxFitness),
    enabled,
  })
}

/**
 * Create a new solution
 */
export function useCreateSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (solution: SolutionSchema) => solutionsService.create(solution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all })
    },
  })
}

/**
 * Create multiple solutions at once
 */
export function useCreateSolutionsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (solutions: SolutionSchema[]) => solutionsService.createBulk(solutions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all })
    },
  })
}

/**
 * Update an existing solution
 */
export function useUpdateSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<SolutionSchema> }) =>
      solutionsService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: solutionKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() })
    },
  })
}

/**
 * Delete a solution
 */
export function useDeleteSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => solutionsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: solutionKeys.lists() })
    },
  })
}

/**
 * Delete multiple solutions
 */
export function useDeleteSolutionsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => solutionsService.deleteBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all })
    },
  })
}
