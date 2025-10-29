import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  trackingService,
  type GetTrackingEventsParams,
  type TrackingEventSchema,
} from '../../api/trackingService'

// Query keys
export const trackingKeys = {
  all: ['tracking'] as const,
  lists: () => [...trackingKeys.all, 'list'] as const,
  list: (params?: GetTrackingEventsParams) => [...trackingKeys.lists(), params] as const,
  details: () => [...trackingKeys.all, 'detail'] as const,
  detail: (id: number) => [...trackingKeys.details(), id] as const,
  byProduct: (productId: number) => [...trackingKeys.all, 'product', productId] as const,
  byOrder: (orderId: number) => [...trackingKeys.all, 'order', orderId] as const,
  byEventType: (eventType: string) => [...trackingKeys.all, 'eventType', eventType] as const,
  byLocation: (locationId: number) => [...trackingKeys.all, 'location', locationId] as const,
}

/**
 * Get a single tracking event by ID
 */
export function useTrackingEvent(id: number, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.detail(id),
    queryFn: () => trackingService.getById(id),
    enabled,
  })
}

/**
 * Get multiple tracking events with optional filters
 */
export function useTrackingEvents(params?: GetTrackingEventsParams, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.list(params),
    queryFn: () => trackingService.getAll(params),
    enabled,
  })
}

/**
 * Get tracking events for a specific product
 */
export function useTrackingEventsByProduct(productId: number, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.byProduct(productId),
    queryFn: () => trackingService.getByProduct(productId),
    enabled,
  })
}

/**
 * Get tracking events for a specific order
 */
export function useTrackingEventsByOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.byOrder(orderId),
    queryFn: () => trackingService.getByOrder(orderId),
    enabled,
  })
}

/**
 * Get tracking events by event type
 */
export function useTrackingEventsByType(eventType: string, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.byEventType(eventType),
    queryFn: () => trackingService.getByEventType(eventType),
    enabled,
  })
}

/**
 * Get tracking events by location
 */
export function useTrackingEventsByLocation(locationId: number, enabled = true) {
  return useQuery({
    queryKey: trackingKeys.byLocation(locationId),
    queryFn: () => trackingService.getByLocation(locationId),
    enabled,
  })
}

/**
 * Create a new tracking event
 */
export function useCreateTrackingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (event: Omit<TrackingEventSchema, 'id'>) => trackingService.create(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all })
    },
  })
}

/**
 * Create multiple tracking events at once
 */
export function useCreateTrackingEventsBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (events: Omit<TrackingEventSchema, 'id'>[]) => trackingService.createBulk(events),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all })
    },
  })
}

/**
 * Delete a tracking event
 */
export function useDeleteTrackingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => trackingService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: trackingKeys.lists() })
    },
  })
}
