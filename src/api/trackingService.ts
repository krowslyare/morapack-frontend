import { api } from './client'

// TODO: Create TrackingEventSchema type in types folder if not exists
export interface TrackingEventSchema {
  id?: number
  productId?: number
  orderId?: number
  eventType?: string
  locationCityId?: number
  locationCityName?: string
  timestamp?: string
  description?: string
  flightId?: number
  createdAt?: string
}

export interface GetTrackingEventsParams {
  ids?: number[]
  productId?: number
  orderId?: number
  eventType?: string
  locationCityId?: number
  startDate?: string
  endDate?: string
}

export const trackingService = {
  /**
   * Get a single tracking event by ID
   */
  getById: async (id: number): Promise<TrackingEventSchema> => {
    const { data } = await api.get<TrackingEventSchema>(`/tracking-events/${id}`)
    return data
  },

  /**
   * Get multiple tracking events with optional filters
   */
  getAll: async (params?: GetTrackingEventsParams): Promise<TrackingEventSchema[]> => {
    const { data } = await api.get<TrackingEventSchema[]>('/tracking-events', {
      params,
    })
    return data
  },

  /**
   * Get tracking events for a specific product
   */
  getByProduct: async (productId: number): Promise<TrackingEventSchema[]> => {
    const { data } = await api.get<TrackingEventSchema[]>('/tracking-events', {
      params: { productId },
    })
    return data
  },

  /**
   * Get tracking events for a specific order
   */
  getByOrder: async (orderId: number): Promise<TrackingEventSchema[]> => {
    const { data } = await api.get<TrackingEventSchema[]>('/tracking-events', {
      params: { orderId },
    })
    return data
  },

  /**
   * Get tracking events by event type
   */
  getByEventType: async (eventType: string): Promise<TrackingEventSchema[]> => {
    const { data } = await api.get<TrackingEventSchema[]>('/tracking-events', {
      params: { eventType },
    })
    return data
  },

  /**
   * Get tracking events by location
   */
  getByLocation: async (locationCityId: number): Promise<TrackingEventSchema[]> => {
    const { data } = await api.get<TrackingEventSchema[]>('/tracking-events', {
      params: { locationCityId },
    })
    return data
  },

  /**
   * Create a new tracking event
   */
  create: async (event: Omit<TrackingEventSchema, 'id'>): Promise<TrackingEventSchema> => {
    const { data } = await api.post<TrackingEventSchema>('/tracking-events', event)
    return data
  },

  /**
   * Create multiple tracking events at once
   */
  createBulk: async (events: Omit<TrackingEventSchema, 'id'>[]): Promise<TrackingEventSchema[]> => {
    const { data } = await api.post<TrackingEventSchema[]>('/tracking-events/bulk', events)
    return data
  },

  /**
   * Delete a tracking event
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tracking-events/${id}`)
  },
}
