// src/hooks/api.ts (o archivo similar)
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export interface FlightPackageProduct {
  id: number
  status?: string
  assignedFlightInstance?: string
  createdAt?: string
  order?: {
    id?: number
    name?: string
    destination?: string
    customer?: string
  }
}

export interface FlightPackagesResult {
  products: FlightPackageProduct[]
  totals: {
    productCount: number
    statusBreakdown: Record<string, number>
  }
}

export const flightKeys = {
  packages: (flightCode: string) => ['flight', flightCode, 'packages'] as const,
}

export function useFlightPackages(flightCode?: string) {
  return useQuery({
    queryKey: flightCode ? flightKeys.packages(flightCode) : ['flight', 'packages', 'disabled'],
    enabled: Boolean(flightCode),
    queryFn: async (): Promise<FlightPackagesResult> => {
      const { data } = await api.get(`/query/flights/${flightCode}/products`)

      return {
        products: (data?.products ?? []) as FlightPackageProduct[],
        totals: {
          productCount: data?.productCount ?? data?.products?.length ?? 0,
          statusBreakdown: data?.statusBreakdown ?? {},
        },
      }
    },
  })
}
