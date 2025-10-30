import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citiesService, type GetCitiesParams } from '../../api/citiesService'
import type { CitySchema, Continent } from '../../types'

// Query keys
export const cityKeys = {
  all: ['cities'] as const,
  lists: () => [...cityKeys.all, 'list'] as const,
  list: (params?: GetCitiesParams) => [...cityKeys.lists(), params] as const,
  details: () => [...cityKeys.all, 'detail'] as const,
  detail: (id: number) => [...cityKeys.details(), id] as const,
  byContinent: (continent: Continent) => [...cityKeys.all, 'continent', continent] as const,
  search: (name: string) => [...cityKeys.all, 'search', name] as const,
}

/**
 * Get a single city by ID
 */
export function useCity(id: number, enabled = true) {
  return useQuery({
    queryKey: cityKeys.detail(id),
    queryFn: () => citiesService.getById(id),
    enabled,
  })
}

/**
 * Get multiple cities with optional filters
 */
export function useCities(params?: GetCitiesParams, enabled = true) {
  return useQuery({
    queryKey: cityKeys.list(params),
    queryFn: () => citiesService.getAll(params),
    enabled,
  })
}

/**
 * Get cities by continent
 */
export function useCitiesByContinent(continent: Continent, enabled = true) {
  return useQuery({
    queryKey: cityKeys.byContinent(continent),
    queryFn: () => citiesService.getByContinent(continent),
    enabled,
  })
}

/**
 * Search cities by name
 */
export function useSearchCities(name: string, enabled = true) {
  return useQuery({
    queryKey: cityKeys.search(name),
    queryFn: () => citiesService.searchByName(name),
    enabled: enabled && name.length > 0,
  })
}

/**
 * Create a new city
 */
export function useCreateCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (city: Omit<CitySchema, 'id'>) => citiesService.create(city),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}

/**
 * Create multiple cities at once
 */
export function useCreateCitiesBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cities: Omit<CitySchema, 'id'>[]) => citiesService.createBulk(cities),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
  })
}

/**
 * Update an existing city
 */
export function useUpdateCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<CitySchema> }) =>
      citiesService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: cityKeys.lists() })
    },
  })
}

/**
 * Delete a city
 */
export function useDeleteCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => citiesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: cityKeys.lists() })
    },
  })
}
