import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehousesService, type GetWarehousesParams } from '../../api/warehousesService'
import type { Warehouse } from '../../types'

// Query keys
export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (params?: GetWarehousesParams) => [...warehouseKeys.lists(), params] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: number) => [...warehouseKeys.details(), id] as const,
  byAirport: (airportId: number) => [...warehouseKeys.all, 'airport', airportId] as const,
}

/**
 * Get a single warehouse by ID
 */
export function useWarehouse(id: number, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehousesService.getById(id),
    enabled,
  })
}

/**
 * Get multiple warehouses with optional filters
 */
export function useWarehouses(params?: GetWarehousesParams, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehousesService.getAll(params),
    enabled,
  })
}

/**
 * Get warehouse by airport ID
 */
export function useWarehouseByAirport(
  airportId: number,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: warehouseKeys.byAirport(airportId),
    queryFn: () => warehousesService.getByAirport(airportId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Create a new warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (warehouse: Omit<Warehouse, 'id'>) => warehousesService.create(warehouse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}

/**
 * Update an existing warehouse
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Warehouse> }) =>
      warehousesService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}

/**
 * Delete a warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehousesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() })
    },
  })
}
