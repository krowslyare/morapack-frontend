import type { Continent } from '../types/Continent'

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
    { id: 1, city: 'Lima', country: 'Peru', continent: 'America', latitude: -12.0219, longitude: -77.1143, capacityPercent: 42 },
    { id: 2, city: 'Brussels', country: 'Belgium', continent: 'Europa', latitude: 50.9010, longitude: 4.4844, capacityPercent: 66 },
    { id: 3, city: 'Baku', country: 'Azerbaijan', continent: 'Asia', latitude: 40.4675, longitude: 50.0467, capacityPercent: 51 },
    { id: 4, city: 'New York', country: 'USA', continent: 'America', latitude: 40.6413, longitude: -73.7781, capacityPercent: 35 },
    { id: 5, city: 'Tokyo', country: 'Japan', continent: 'Asia', latitude: 35.5494, longitude: 139.7798, capacityPercent: 58 },
    { id: 6, city: 'Madrid', country: 'Spain', continent: 'Europa', latitude: 40.4983, longitude: -3.5676, capacityPercent: 62 },
  ]
}

function flightsForMode(mode: FlightSimulationMode): { flights: SimFlight[]; speed: number } {
  // speed scales GSAP durations
  if (mode === 'realtime') {
    return {
      speed: 1,
      flights: [
        { id: 'F1', code: 'MP-101', originAirportId: 1, destinationAirportId: 2, progress: 0.1, maxCapacity: 250, usedCapacity: 180, status: 'En vuelo', transportTimeDays: 2, description: 'Ruta de carga internacional' },
        { id: 'F2', code: 'MP-204', originAirportId: 2, destinationAirportId: 3, progress: 0.4, maxCapacity: 320, usedCapacity: 295, status: 'En vuelo', transportTimeDays: 3, description: 'Vuelo de carga pesada' },
        { id: 'F3', code: 'MP-157', originAirportId: 3, destinationAirportId: 1, progress: 0.7, maxCapacity: 200, usedCapacity: 85, status: 'En vuelo', transportTimeDays: 2, description: 'Vuelo de retorno' },
      ],
    }
  }
  if (mode === 'weekly') {
    return {
      speed: 1.8,
      flights: [
        { id: 'F4', code: 'MP-302', originAirportId: 1, destinationAirportId: 4, progress: 0.25, maxCapacity: 400, usedCapacity: 350, status: 'En vuelo', transportTimeDays: 4, description: 'Ruta transcontinental' },
        { id: 'F5', code: 'MP-445', originAirportId: 4, destinationAirportId: 6, progress: 0.6, maxCapacity: 280, usedCapacity: 210, status: 'En vuelo', transportTimeDays: 3, description: 'Conexión europea' },
        { id: 'F6', code: 'MP-528', originAirportId: 6, destinationAirportId: 2, progress: 0.05, maxCapacity: 350, usedCapacity: 320, status: 'En vuelo', transportTimeDays: 1, description: 'Vuelo regional' },
        { id: 'F7', code: 'MP-667', originAirportId: 2, destinationAirportId: 5, progress: 0.35, maxCapacity: 500, usedCapacity: 480, status: 'En vuelo', transportTimeDays: 5, description: 'Ruta Asia-Europa' },
      ],
    }
  }
  // collapse
  return {
    speed: 2.5,
    flights: [
      { id: 'F8', code: 'MP-801', originAirportId: 1, destinationAirportId: 2, progress: 0.15, maxCapacity: 200, usedCapacity: 195, status: 'Sobrecargado', transportTimeDays: 2, description: 'Vuelo de emergencia' },
      { id: 'F9', code: 'MP-822', originAirportId: 2, destinationAirportId: 3, progress: 0.2, maxCapacity: 250, usedCapacity: 250, status: 'Lleno', transportTimeDays: 3, description: 'Capacidad máxima' },
      { id: 'F10', code: 'MP-843', originAirportId: 3, destinationAirportId: 1, progress: 0.3, maxCapacity: 300, usedCapacity: 298, status: 'Lleno', transportTimeDays: 2, description: 'Alto tráfico' },
      { id: 'F11', code: 'MP-904', originAirportId: 4, destinationAirportId: 5, progress: 0.45, maxCapacity: 400, usedCapacity: 400, status: 'Lleno', transportTimeDays: 4, description: 'Ruta saturada' },
      { id: 'F12', code: 'MP-925', originAirportId: 5, destinationAirportId: 6, progress: 0.55, maxCapacity: 350, usedCapacity: 350, status: 'Lleno', transportTimeDays: 3, description: 'Demanda alta' },
      { id: 'F13', code: 'MP-946', originAirportId: 6, destinationAirportId: 4, progress: 0.05, maxCapacity: 280, usedCapacity: 278, status: 'Lleno', transportTimeDays: 2, description: 'Colapso operacional' },
    ],
  }
}

export function useFlightSimulation(mode: FlightSimulationMode) {
  const airports = baseAirports().map(a => {
    // Adjust capacity by mode to reflect congestion
    if (mode === 'weekly') return { ...a, capacityPercent: Math.min(95, a.capacityPercent + 10) }
    if (mode === 'collapse') return { ...a, capacityPercent: Math.min(100, a.capacityPercent + 35) }
    return a
  })

  const { flights, speed } = flightsForMode(mode)
  return { airports, flights, speed }
}


