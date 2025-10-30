import { useState, useCallback, useMemo, useRef } from 'react'
import { useAirports } from './api/useAirports'
import type { SimAirport } from './useFlightSimulation'
import type { Continent } from '../types/Continent'

// Coordinate mapping for cities (fallback if DB doesn't have coordinates)
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // América del Sur
  Bogota: { latitude: 4.7014, longitude: -74.1469 },
  Quito: { latitude: 0.1133, longitude: -78.3586 },
  Caracas: { latitude: 10.6031, longitude: -66.9906 },
  Brasilia: { latitude: -15.8647, longitude: -47.9178 },
  Lima: { latitude: -12.0219, longitude: -77.1143 },
  'La Paz': { latitude: -16.5133, longitude: -68.1922 },
  Santiago: { latitude: -33.3964, longitude: -70.7947 },
  'Buenos Aires': { latitude: -34.5594, longitude: -58.4156 },
  Asunción: { latitude: -25.24, longitude: -57.52 },
  Montevideo: { latitude: -34.7889, longitude: -56.2647 },

  // Europa
  Tirana: { latitude: 41.4147, longitude: 19.7206 },
  Berlin: { latitude: 52.4736, longitude: 13.4017 },
  Viena: { latitude: 48.1108, longitude: 16.5708 },
  Bruselas: { latitude: 50.4592, longitude: 4.4536 },
  Minsk: { latitude: 53.8825, longitude: 28.0325 },
  Sofia: { latitude: 42.6903, longitude: 23.4047 },
  Praga: { latitude: 50.1014, longitude: 14.2656 },
  Zagreb: { latitude: 45.7428, longitude: 16.0686 },
  Copenhague: { latitude: 55.6181, longitude: 12.6561 },
  Amsterdam: { latitude: 52.3, longitude: 4.7653 },

  // Asia
  Delhi: { latitude: 28.5664, longitude: 77.1031 },
  Damasco: { latitude: 33.4114, longitude: 36.5156 },
  Riad: { latitude: 24.9578, longitude: 46.6989 },
  Dubai: { latitude: 25.2528, longitude: 55.3644 },
  Kabul: { latitude: 34.5656, longitude: 69.2111 },
  Mascate: { latitude: 23.5894, longitude: 58.2842 },
  Sana: { latitude: 15.4764, longitude: 44.2197 },
  Karachi: { latitude: 24.9, longitude: 67.15 },
  Baku: { latitude: 40.4672, longitude: 50.0467 },
  Aman: { latitude: 31.7225, longitude: 35.9936 },
}

export interface FlightCapacityEvent {
  eventType: 'DEPARTURE' | 'ARRIVAL'
  flightId: number
  airportId: number
  productIds: number[]
  totalVolume: number // Volume of all products in this flight
  timestamp: Date
}

/**
 * Hook to manage dynamic airport warehouse capacities during simulation
 * Updates capacities based on flight departures and arrivals
 */
export function useAirportCapacityManager() {
  // Fetch airports from database
  const { data: airportsFromDB, isLoading } = useAirports()

  // Track dynamic capacity changes during simulation
  const [capacityChanges, setCapacityChanges] = useState<Record<number, number>>({})

  // Log when data is loaded - only once on mount or when count changes
  const prevCountRef = useRef<number>(0)
  const currentCount = airportsFromDB?.length || 0

  if (currentCount > 0 && currentCount !== prevCountRef.current) {
    prevCountRef.current = currentCount
    console.log(`[AIRPORT MANAGER] Loaded ${currentCount} airports from database`)
  }

  /**
   * Convert database airport to SimAirport format with dynamic capacity
   */
  const airports: SimAirport[] = useMemo(() => {
    if (!airportsFromDB || airportsFromDB.length === 0) {
      return []
    }

    return airportsFromDB.map((airport) => {
      const maxCapacity = airport.warehouse?.maxCapacity || 1000
      const baseUsedCapacity = airport.warehouse?.usedCapacity || 0

      // Apply dynamic changes from simulation events
      const capacityChange = capacityChanges[airport.id || 0] || 0
      const currentUsedCapacity = Math.max(
        0,
        Math.min(maxCapacity, baseUsedCapacity + capacityChange),
      )

      const capacityPercent =
        maxCapacity > 0 ? Math.round((currentUsedCapacity / maxCapacity) * 100) : 0

      // Parse coordinates safely
      let latitude = parseFloat(airport.latitude)
      let longitude = parseFloat(airport.longitude)

      // Check if coordinates are invalid or out of range
      const coordsInvalid =
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180

      // Try to get coordinates from city name mapping if DB coords are invalid
      if (coordsInvalid) {
        const cityName = airport.cityName || airport.alias
        const fallbackCoords = CITY_COORDINATES[cityName]

        if (fallbackCoords) {
          latitude = fallbackCoords.latitude
          longitude = fallbackCoords.longitude
          console.log(
            `[AIRPORT] Using fallback coordinates for ${cityName}: lat=${latitude}, lng=${longitude}`,
          )
        } else {
          // Last resort: use (0,0) and log error
          console.error(
            `[AIRPORT] No valid coordinates found for ${cityName}: lat=${airport.latitude}, lng=${airport.longitude}`,
          )
          latitude = 0
          longitude = 0
        }
      }

      const validLat = latitude
      const validLng = longitude

      return {
        id: airport.id || 0,
        city: airport.cityName || airport.alias,
        country: airport.citySchema?.country || 'Unknown',
        continent: (airport.citySchema?.continent || 'America') as Continent,
        latitude: validLat,
        longitude: validLng,
        capacityPercent,
        // Store additional info from warehouse and airport
        codeIATA: airport.codeIATA,
        maxCapacity,
        currentUsedCapacity,
        warehouseName: airport.warehouse?.name,
      } as SimAirport & {
        codeIATA?: string
        maxCapacity?: number
        currentUsedCapacity?: number
        warehouseName?: string
      }
    })
  }, [airportsFromDB, capacityChanges])

  /**
   * Handle flight departure - decreases capacity at origin airport
   */
  const handleDeparture = useCallback((event: FlightCapacityEvent) => {
    setCapacityChanges((prev) => ({
      ...prev,
      [event.airportId]: (prev[event.airportId] || 0) - event.totalVolume,
    }))

    console.log(
      `[CAPACITY] ✈️ Departure from airport ${event.airportId}: -${event.totalVolume} volume (${event.productIds.length} products)`,
    )
  }, [])

  /**
   * Handle flight arrival - increases capacity at destination airport
   */
  const handleArrival = useCallback((event: FlightCapacityEvent) => {
    setCapacityChanges((prev) => ({
      ...prev,
      [event.airportId]: (prev[event.airportId] || 0) + event.totalVolume,
    }))

    console.log(
      `[CAPACITY] 🛬 Arrival at airport ${event.airportId}: +${event.totalVolume} volume (${event.productIds.length} products)`,
    )
  }, [])

  /**
   * Handle flight capacity event (departure or arrival)
   */
  const handleFlightCapacityEvent = useCallback(
    (event: FlightCapacityEvent) => {
      if (event.eventType === 'DEPARTURE') {
        handleDeparture(event)
      } else if (event.eventType === 'ARRIVAL') {
        handleArrival(event)
      }
    },
    [handleDeparture, handleArrival],
  )

  /**
   * Reset capacity changes (useful when restarting simulation)
   */
  const resetCapacities = useCallback(() => {
    setCapacityChanges({})
    console.log('[CAPACITY] 🔄 Reset all capacity changes')
  }, [])

  /**
   * Get current capacity for a specific airport
   */
  const getAirportCapacity = useCallback(
    (airportId: number) => {
      const airport = airports.find((a) => a.id === airportId)
      return {
        capacityPercent: airport?.capacityPercent || 0,
        maxCapacity: (airport as any)?.maxCapacity || 0,
        currentUsedCapacity: (airport as any)?.currentUsedCapacity || 0,
      }
    },
    [airports],
  )

  // Return object directly (callbacks are already stable with useCallback)
  // Only airports and isLoading affect the return value
  return {
    airports,
    isLoading,
    handleFlightCapacityEvent,
    resetCapacities,
    getAirportCapacity,
  }
}
