// src/hooks/api.ts (o archivo similar)
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export interface FlightPackage {
  id: number
  orderId: number
  productCode: string
  pieces: number
  weightKg?: number
  volumeM3?: number
  originIATA?: string
  destinationIATA?: string
  status?: string
}

export const flightKeys = {
  // ...lo que ya tienes
  packages: (flightId: number) => ['flight', flightId, 'packages'] as const,
}

export function useFlightPackages(flightId?: number) {
  return useQuery({
    queryKey: flightId ? flightKeys.packages(flightId) : ['flight', 'packages', 'disabled'],
    enabled: !!flightId,
    queryFn: async (): Promise<FlightPackage[]> => {
      const { data } = await api.get(`/flights/${flightId}/packages`)
      return data ?? []
    },
  })
}
