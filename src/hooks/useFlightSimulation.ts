import type { Continent } from '../types/Continent'
import { useMemo } from 'react'

export type FlightSimulationMode = 'realtime' | 'weekly' | 'collapse'

export interface SimAirport {
  id: number
  city: string
  country: string
  continent: Continent
  latitude: number
  longitude: number
  capacityPercent: number
}

export interface SimFlight {
  id: string
  code: string
  originAirportId: number
  destinationAirportId: number
  progress: number // 0..1
  maxCapacity: number
  usedCapacity: number
  status: string
  transportTimeDays: number
  description?: string
}

function baseAirports(): SimAirport[] {
  return [
    // América del Sur
    {
      id: 1,
      city: 'Bogota',
      country: 'Colombia',
      continent: 'America',
      latitude: 4.7014,
      longitude: -74.1469,
      capacityPercent: 42,
    },
    {
      id: 2,
      city: 'Quito',
      country: 'Ecuador',
      continent: 'America',
      latitude: 0.1133,
      longitude: -78.3586,
      capacityPercent: 45,
    },
    {
      id: 3,
      city: 'Caracas',
      country: 'Venezuela',
      continent: 'America',
      latitude: 10.6031,
      longitude: -66.9906,
      capacityPercent: 38,
    },
    {
      id: 4,
      city: 'Brasilia',
      country: 'Brasil',
      continent: 'America',
      latitude: -15.8647,
      longitude: -47.9178,
      capacityPercent: 55,
    },
    {
      id: 5,
      city: 'Lima',
      country: 'Perú',
      continent: 'America',
      latitude: -12.0219,
      longitude: -77.1143,
      capacityPercent: 48,
    },
    {
      id: 6,
      city: 'La Paz',
      country: 'Bolivia',
      continent: 'America',
      latitude: -16.5133,
      longitude: -68.1922,
      capacityPercent: 40,
    },
    {
      id: 7,
      city: 'Santiago',
      country: 'Chile',
      continent: 'America',
      latitude: -33.3964,
      longitude: -70.7947,
      capacityPercent: 52,
    },
    {
      id: 8,
      city: 'Buenos Aires',
      country: 'Argentina',
      continent: 'America',
      latitude: -34.5594,
      longitude: -58.4156,
      capacityPercent: 58,
    },
    {
      id: 9,
      city: 'Asunción',
      country: 'Paraguay',
      continent: 'America',
      latitude: -25.24,
      longitude: -57.52,
      capacityPercent: 35,
    },
    {
      id: 10,
      city: 'Montevideo',
      country: 'Uruguay',
      continent: 'America',
      latitude: -34.7889,
      longitude: -56.2647,
      capacityPercent: 36,
    },

    // Europa
    {
      id: 11,
      city: 'Tirana',
      country: 'Albania',
      continent: 'Europa',
      latitude: 41.4147,
      longitude: 19.7206,
      capacityPercent: 40,
    },
    {
      id: 12,
      city: 'Berlin',
      country: 'Alemania',
      continent: 'Europa',
      latitude: 52.4736,
      longitude: 13.4017,
      capacityPercent: 65,
    },
    {
      id: 13,
      city: 'Viena',
      country: 'Austria',
      continent: 'Europa',
      latitude: 48.1108,
      longitude: 16.5708,
      capacityPercent: 50,
    },
    {
      id: 14,
      city: 'Bruselas',
      country: 'Belgica',
      continent: 'Europa',
      latitude: 50.4592,
      longitude: 4.4536,
      capacityPercent: 62,
    },
    {
      id: 15,
      city: 'Minsk',
      country: 'Bielorrusia',
      continent: 'Europa',
      latitude: 53.8825,
      longitude: 28.0325,
      capacityPercent: 42,
    },
    {
      id: 16,
      city: 'Sofia',
      country: 'Bulgaria',
      continent: 'Europa',
      latitude: 42.6903,
      longitude: 23.4047,
      capacityPercent: 38,
    },
    {
      id: 17,
      city: 'Praga',
      country: 'Checa',
      continent: 'Europa',
      latitude: 50.1014,
      longitude: 14.2656,
      capacityPercent: 48,
    },
    {
      id: 18,
      city: 'Zagreb',
      country: 'Croacia',
      continent: 'Europa',
      latitude: 45.7428,
      longitude: 16.0686,
      capacityPercent: 44,
    },
    {
      id: 19,
      city: 'Copenhague',
      country: 'Dinamarca',
      continent: 'Europa',
      latitude: 55.6181,
      longitude: 12.6561,
      capacityPercent: 60,
    },
    {
      id: 20,
      city: 'Amsterdam',
      country: 'Holanda',
      continent: 'Europa',
      latitude: 52.3,
      longitude: 4.7653,
      capacityPercent: 68,
    },

    // Asia
    {
      id: 21,
      city: 'Delhi',
      country: 'India',
      continent: 'Asia',
      latitude: 28.5664,
      longitude: 77.1031,
      capacityPercent: 70,
    },
    {
      id: 22,
      city: 'Damasco',
      country: 'Siria',
      continent: 'Asia',
      latitude: 33.4114,
      longitude: 36.5156,
      capacityPercent: 35,
    },
    {
      id: 23,
      city: 'Riad',
      country: 'Arabia Saudita',
      continent: 'Asia',
      latitude: 24.9578,
      longitude: 46.6989,
      capacityPercent: 55,
    },
    {
      id: 24,
      city: 'Dubai',
      country: 'Emiratos A.U',
      continent: 'Asia',
      latitude: 25.2528,
      longitude: 55.3644,
      capacityPercent: 72,
    },
    {
      id: 25,
      city: 'Kabul',
      country: 'Afganistan',
      continent: 'Asia',
      latitude: 34.5656,
      longitude: 69.2111,
      capacityPercent: 32,
    },
    {
      id: 26,
      city: 'Mascate',
      country: 'Oman',
      continent: 'Asia',
      latitude: 23.5894,
      longitude: 58.2842,
      capacityPercent: 48,
    },
    {
      id: 27,
      city: 'Sana',
      country: 'Yemen',
      continent: 'Asia',
      latitude: 15.4764,
      longitude: 44.2197,
      capacityPercent: 30,
    },
    {
      id: 28,
      city: 'Karachi',
      country: 'Pakistan',
      continent: 'Asia',
      latitude: 24.9,
      longitude: 67.15,
      capacityPercent: 52,
    },
    {
      id: 29,
      city: 'Baku',
      country: 'Azerbaiyan',
      continent: 'Asia',
      latitude: 40.4672,
      longitude: 50.0467,
      capacityPercent: 46,
    },
    {
      id: 30,
      city: 'Aman',
      country: 'Jordania',
      continent: 'Asia',
      latitude: 31.7225,
      longitude: 35.9936,
      capacityPercent: 40,
    },
  ]
}

function flightsForMode(mode: FlightSimulationMode): { flights: SimFlight[]; speed: number } {
  // speed scales GSAP durations
  if (mode === 'realtime') {
    return {
      speed: 1,
      flights: [
        {
          id: 'F1',
          code: 'MP-101',
          originAirportId: 1,
          destinationAirportId: 2,
          progress: 0.1,
          maxCapacity: 250,
          usedCapacity: 180,
          status: 'En vuelo',
          transportTimeDays: 2,
          description: 'Ruta de carga internacional',
        },
        {
          id: 'F2',
          code: 'MP-204',
          originAirportId: 2,
          destinationAirportId: 3,
          progress: 0.4,
          maxCapacity: 320,
          usedCapacity: 295,
          status: 'En vuelo',
          transportTimeDays: 3,
          description: 'Vuelo de carga pesada',
        },
        {
          id: 'F3',
          code: 'MP-157',
          originAirportId: 3,
          destinationAirportId: 1,
          progress: 0.7,
          maxCapacity: 200,
          usedCapacity: 85,
          status: 'En vuelo',
          transportTimeDays: 2,
          description: 'Vuelo de retorno',
        },
      ],
    }
  }
  if (mode === 'weekly') {
    return {
      speed: 1.8,
      flights: [
        {
          id: 'F4',
          code: 'MP-302',
          originAirportId: 1,
          destinationAirportId: 4,
          progress: 0.25,
          maxCapacity: 400,
          usedCapacity: 350,
          status: 'En vuelo',
          transportTimeDays: 4,
          description: 'Ruta transcontinental',
        },
        {
          id: 'F5',
          code: 'MP-445',
          originAirportId: 4,
          destinationAirportId: 6,
          progress: 0.6,
          maxCapacity: 280,
          usedCapacity: 210,
          status: 'En vuelo',
          transportTimeDays: 3,
          description: 'Conexión europea',
        },
        {
          id: 'F6',
          code: 'MP-528',
          originAirportId: 6,
          destinationAirportId: 2,
          progress: 0.05,
          maxCapacity: 350,
          usedCapacity: 320,
          status: 'En vuelo',
          transportTimeDays: 1,
          description: 'Vuelo regional',
        },
        {
          id: 'F7',
          code: 'MP-667',
          originAirportId: 2,
          destinationAirportId: 5,
          progress: 0.35,
          maxCapacity: 500,
          usedCapacity: 480,
          status: 'En vuelo',
          transportTimeDays: 5,
          description: 'Ruta Asia-Europa',
        },
      ],
    }
  }
  // collapse
  return {
    speed: 2.5,
    flights: [
      {
        id: 'F8',
        code: 'MP-801',
        originAirportId: 1,
        destinationAirportId: 2,
        progress: 0.15,
        maxCapacity: 200,
        usedCapacity: 195,
        status: 'Sobrecargado',
        transportTimeDays: 2,
        description: 'Vuelo de emergencia',
      },
      {
        id: 'F9',
        code: 'MP-822',
        originAirportId: 2,
        destinationAirportId: 3,
        progress: 0.2,
        maxCapacity: 250,
        usedCapacity: 250,
        status: 'Lleno',
        transportTimeDays: 3,
        description: 'Capacidad máxima',
      },
      {
        id: 'F10',
        code: 'MP-843',
        originAirportId: 3,
        destinationAirportId: 1,
        progress: 0.3,
        maxCapacity: 300,
        usedCapacity: 298,
        status: 'Lleno',
        transportTimeDays: 2,
        description: 'Alto tráfico',
      },
      {
        id: 'F11',
        code: 'MP-904',
        originAirportId: 4,
        destinationAirportId: 5,
        progress: 0.45,
        maxCapacity: 400,
        usedCapacity: 400,
        status: 'Lleno',
        transportTimeDays: 4,
        description: 'Ruta saturada',
      },
      {
        id: 'F12',
        code: 'MP-925',
        originAirportId: 5,
        destinationAirportId: 6,
        progress: 0.55,
        maxCapacity: 350,
        usedCapacity: 350,
        status: 'Lleno',
        transportTimeDays: 3,
        description: 'Demanda alta',
      },
      {
        id: 'F13',
        code: 'MP-946',
        originAirportId: 6,
        destinationAirportId: 4,
        progress: 0.05,
        maxCapacity: 280,
        usedCapacity: 278,
        status: 'Lleno',
        transportTimeDays: 2,
        description: 'Colapso operacional',
      },
    ],
  }
}

export function useFlightSimulation(mode: FlightSimulationMode) {
  return useMemo(() => {
    const airports = baseAirports().map((a) => {
      // Adjust capacity by mode to reflect congestion
      if (mode === 'weekly') return { ...a, capacityPercent: Math.min(95, a.capacityPercent + 10) }
      if (mode === 'collapse')
        return { ...a, capacityPercent: Math.min(100, a.capacityPercent + 35) }
      return a
    })

    const { flights, speed } = flightsForMode(mode)
    return { airports, flights, speed }
  }, [mode])
}
