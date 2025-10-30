import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersService, type GetCustomersParams } from '../../api/customersService'
import type { CustomerSchema } from '../../types'

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: GetCustomersParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  byEmail: (email: string) => [...customerKeys.all, 'email', email] as const,
  search: (name: string) => [...customerKeys.all, 'search', name] as const,
}

/**
 * Get a single customer by ID
 */
export function useCustomer(id: number, enabled = true) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersService.getById(id),
    enabled,
  })
}

/**
 * Get multiple customers with optional filters
 */
export function useCustomers(params?: GetCustomersParams, enabled = true) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersService.getAll(params),
    enabled,
  })
}

/**
 * Search customer by email
 */
export function useCustomerByEmail(email: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.byEmail(email),
    queryFn: () => customersService.getByEmail(email),
    enabled: enabled && email.length > 0,
  })
}

/**
 * Search customers by name
 */
export function useSearchCustomers(name: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.search(name),
    queryFn: () => customersService.searchByName(name),
    enabled: enabled && name.length > 0,
  })
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customer: Omit<CustomerSchema, 'id'>) => customersService.create(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

/**
 * Create multiple customers at once
 */
export function useCreateCustomersBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customers: Omit<CustomerSchema, 'id'>[]) => customersService.createBulk(customers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<CustomerSchema> }) =>
      customersService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

/**
 * Delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => customersService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
