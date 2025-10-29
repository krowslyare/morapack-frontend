import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { travelPlansService, type GetTravelPlansParams } from '../../api/travelPlansService'
import type { TravelPlanSchema } from '../../types'

// Query keys
export const travelPlanKeys = {
  all: ['travelPlans'] as const,
  lists: () => [...travelPlanKeys.all, 'list'] as const,
  list: (params?: GetTravelPlansParams) => [...travelPlanKeys.lists(), params] as const,
  details: () => [...travelPlanKeys.all, 'detail'] as const,
  detail: (id: number) => [...travelPlanKeys.details(), id] as const,
  byProduct: (productId: number) => [...travelPlanKeys.all, 'product', productId] as const,
  byOrder: (orderId: number) => [...travelPlanKeys.all, 'order', orderId] as const,
  active: () => [...travelPlanKeys.all, 'active'] as const,
}

/**
 * Get a single travel plan by ID
 */
export function useTravelPlan(id: number, enabled = true) {
  return useQuery({
    queryKey: travelPlanKeys.detail(id),
    queryFn: () => travelPlansService.getById(id),
    enabled,
  })
}

/**
 * Get multiple travel plans with optional filters
 */
export function useTravelPlans(params?: GetTravelPlansParams, enabled = true) {
  return useQuery({
    queryKey: travelPlanKeys.list(params),
    queryFn: () => travelPlansService.getAll(params),
    enabled,
  })
}

/**
 * Get travel plan for a specific product
 */
export function useTravelPlansByProduct(productId: number, enabled = true) {
  return useQuery({
    queryKey: travelPlanKeys.byProduct(productId),
    queryFn: () => travelPlansService.getByProduct(productId),
    enabled,
  })
}

/**
 * Get travel plans for a specific order
 */
export function useTravelPlansByOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: travelPlanKeys.byOrder(orderId),
    queryFn: () => travelPlansService.getByOrder(orderId),
    enabled,
  })
}

/**
 * Get only active travel plans
 */
export function useActiveTravelPlans(enabled = true) {
  return useQuery({
    queryKey: travelPlanKeys.active(),
    queryFn: () => travelPlansService.getActive(),
    enabled,
  })
}

/**
 * Create a new travel plan
 */
export function useCreateTravelPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plan: Omit<TravelPlanSchema, 'id'>) => travelPlansService.create(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.all })
    },
  })
}

/**
 * Create multiple travel plans at once
 */
export function useCreateTravelPlansBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (plans: Omit<TravelPlanSchema, 'id'>[]) => travelPlansService.createBulk(plans),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.all })
    },
  })
}

/**
 * Update an existing travel plan
 */
export function useUpdateTravelPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<TravelPlanSchema> }) =>
      travelPlansService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: travelPlanKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.lists() })
    },
  })
}

/**
 * Delete a travel plan
 */
export function useDeleteTravelPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => travelPlansService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: travelPlanKeys.lists() })
    },
  })
}
