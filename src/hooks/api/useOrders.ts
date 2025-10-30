import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService, type GetOrdersParams } from '../../api/ordersService'
import type { OrderSchema, PackageStatus } from '../../types'

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: GetOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  byStatus: (status: PackageStatus) => [...orderKeys.all, 'status', status] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [...orderKeys.all, 'dateRange', startDate, endDate] as const,
}

/**
 * Get a single order by ID
 */
export function useOrder(id: number, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getById(id),
    enabled,
  })
}

/**
 * Get multiple orders with optional filters
 */
export function useOrders(params?: GetOrdersParams, enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersService.getAll(params),
    enabled,
  })
}

/**
 * Get orders by status
 */
export function useOrdersByStatus(status: PackageStatus, enabled = true) {
  return useQuery({
    queryKey: orderKeys.byStatus(status),
    queryFn: () => ordersService.getByStatus(status),
    enabled,
  })
}

/**
 * Get orders by delivery date range
 */
export function useOrdersByDateRange(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.byDateRange(startDate, endDate),
    queryFn: () => ordersService.getByDateRange(startDate, endDate),
    enabled,
  })
}

/**
 * Create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: Omit<OrderSchema, 'id'>) => ordersService.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

/**
 * Create multiple orders at once
 */
export function useCreateOrdersBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orders: Omit<OrderSchema, 'id'>[]) => ordersService.createBulk(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

/**
 * Update an existing order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<OrderSchema> }) =>
      ordersService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PackageStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ordersService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}
