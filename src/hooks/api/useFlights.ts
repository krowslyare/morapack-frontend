import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flightsService, type GetFlightsParams } from '../../api/flightsService'
import type { FlightSchema } from '../../types'

// Query keys
export const flightKeys = {
  all: ['flights'] as const,
  lists: () => [...flightKeys.all, 'list'] as const,
  list: (params?: GetFlightsParams) => [...flightKeys.lists(), params] as const,
  details: () => [...flightKeys.all, 'detail'] as const,
  detail: (id: number) => [...flightKeys.details(), id] as const,
  byAirplane: (airplaneId: number) => [...flightKeys.all, 'airplane', airplaneId] as const,
  byOrigin: (originAirportId: number) => [...flightKeys.all, 'origin', originAirportId] as const,
  byDestination: (destinationAirportId: number) =>
    [...flightKeys.all, 'destination', destinationAirportId] as const,
  byStatus: (status: string) => [...flightKeys.all, 'status', status] as const,
  count: (status?: string) => [...flightKeys.all, 'count', status] as const,
}

/**
 * Get a single flight by ID
 */
export function useFlight(id: number, enabled = true) {
  return useQuery({
    queryKey: flightKeys.detail(id),
    queryFn: () => flightsService.getById(id),
    enabled,
  })
}

/**
 * Get multiple flights with optional filters
 */
export function useFlights(params?: GetFlightsParams, enabled = true) {
  return useQuery({
    queryKey: flightKeys.list(params),
    queryFn: () => flightsService.getAll(params),
    enabled,
  })
}

/**
 * Get flights by origin airport
 */
export function useFlightsByOrigin(originAirportId: number, enabled = true) {
  return useQuery({
    queryKey: flightKeys.byOrigin(originAirportId),
    queryFn: () => flightsService.getByOrigin(originAirportId),
    enabled,
  })
}

/**
 * Get flights by destination airport
 */
export function useFlightsByDestination(destinationAirportId: number, enabled = true) {
  return useQuery({
    queryKey: flightKeys.byDestination(destinationAirportId),
    queryFn: () => flightsService.getByDestination(destinationAirportId),
    enabled,
  })
}

/**
 * Get flights count
 */
export function useFlightsCount(status?: string, enabled = true) {
  return useQuery({
    queryKey: flightKeys.count(status),
    queryFn: () => flightsService.getCount(status),
    enabled,
  })
}

/**
 * Create a new flight
 */
export function useCreateFlight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (flight: Omit<FlightSchema, 'id'>) => flightsService.create(flight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightKeys.all })
    },
  })
}

/**
 * Create multiple flights at once
 */
export function useCreateFlightsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (flights: Omit<FlightSchema, 'id'>[]) => flightsService.createBulk(flights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightKeys.all })
    },
  })
}

/**
 * Update an existing flight
 */
export function useUpdateFlight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<FlightSchema> }) =>
      flightsService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: flightKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: flightKeys.lists() })
    },
  })
}

/**
 * Delete a flight
 */
export function useDeleteFlight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => flightsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: flightKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flightKeys.lists() })
    },
  })
}
