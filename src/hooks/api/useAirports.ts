import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { airportsService, type GetAirportsParams } from '../../api/airportsService'
import type { AirportSchema } from '../../types'

// Query keys
export const airportKeys = {
  all: ['airports'] as const,
  lists: () => [...airportKeys.all, 'list'] as const,
  list: (params?: GetAirportsParams) => [...airportKeys.lists(), params] as const,
  details: () => [...airportKeys.all, 'detail'] as const,
  detail: (id: number) => [...airportKeys.details(), id] as const,
  byCity: (cityId: number) => [...airportKeys.all, 'city', cityId] as const,
  headquarters: () => [...airportKeys.all, 'headquarters'] as const,
}

/**
 * Get a single airport by ID
 */
export function useAirport(id: number, enabled = true) {
  return useQuery({
    queryKey: airportKeys.detail(id),
    queryFn: () => airportsService.getById(id),
    enabled,
  })
}

/**
 * Get multiple airports with optional filters
 */
export function useAirports(params?: GetAirportsParams, enabled = true) {
  return useQuery({
    queryKey: airportKeys.list(params),
    queryFn: () => airportsService.getAll(params),
    enabled,
  })
}

/**
 * Get airports by city
 */
export function useAirportsByCity(cityId: number, enabled = true) {
  return useQuery({
    queryKey: airportKeys.byCity(cityId),
    queryFn: () => airportsService.getByCity(cityId),
    enabled,
  })
}

/**
 * Get headquarters airports only
 */
export function useHeadquartersAirports(enabled = true) {
  return useQuery({
    queryKey: airportKeys.headquarters(),
    queryFn: () => airportsService.getHeadquarters(),
    enabled,
  })
}

/**
 * Create a new airport
 */
export function useCreateAirport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (airport: Omit<AirportSchema, 'id'>) => airportsService.create(airport),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: airportKeys.all })
    },
  })
}

/**
 * Create multiple airports at once
 */
export function useCreateAirportsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (airports: Omit<AirportSchema, 'id'>[]) => airportsService.createBulk(airports),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: airportKeys.all })
    },
  })
}

/**
 * Update an existing airport
 */
export function useUpdateAirport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<AirportSchema> }) =>
      airportsService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: airportKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: airportKeys.lists() })
    },
  })
}

/**
 * Delete an airport
 */
export function useDeleteAirport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => airportsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: airportKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: airportKeys.lists() })
    },
  })
}
