import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, type GetProductsParams } from '../../api/productsService'
import type { ProductSchema, PackageStatus } from '../../types'

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: GetProductsParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  byOrder: (orderId: number) => [...productKeys.all, 'order', orderId] as const,
  byStatus: (status: PackageStatus) => [...productKeys.all, 'status', status] as const,
}

/**
 * Get a single product by ID
 */
export function useProduct(id: number, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled,
  })
}

/**
 * Get multiple products with optional filters
 */
export function useProducts(params?: GetProductsParams, enabled = true) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params),
    enabled,
  })
}

/**
 * Get products by order ID
 */
export function useProductsByOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: productKeys.byOrder(orderId),
    queryFn: () => productsService.getByOrder(orderId),
    enabled,
  })
}

/**
 * Get products by status
 */
export function useProductsByStatus(status: PackageStatus, enabled = true) {
  return useQuery({
    queryKey: productKeys.byStatus(status),
    queryFn: () => productsService.getByStatus(status),
    enabled,
  })
}

/**
 * Create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: Omit<ProductSchema, 'id'>) => productsService.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/**
 * Create multiple products at once
 */
export function useCreateProductsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (products: Omit<ProductSchema, 'id'>[]) => productsService.createBulk(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/**
 * Update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ProductSchema> }) =>
      productsService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Update product status
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PackageStatus }) =>
      productsService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
