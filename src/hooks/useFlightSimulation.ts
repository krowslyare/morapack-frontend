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
  originAirportId: number
  destinationAirportId: number
  progress: number // 0..1
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
        { id: 'F1', originAirportId: 1, destinationAirportId: 2, progress: 0.1 },
        { id: 'F2', originAirportId: 2, destinationAirportId: 3, progress: 0.4 },
        { id: 'F3', originAirportId: 3, destinationAirportId: 1, progress: 0.7 },
      ],
    }
  }
  if (mode === 'weekly') {
    return {
      speed: 1.8,
      flights: [
        { id: 'F4', originAirportId: 1, destinationAirportId: 4, progress: 0.25 },
        { id: 'F5', originAirportId: 4, destinationAirportId: 6, progress: 0.6 },
        { id: 'F6', originAirportId: 6, destinationAirportId: 2, progress: 0.05 },
        { id: 'F7', originAirportId: 2, destinationAirportId: 5, progress: 0.35 },
      ],
    }
  }
  // collapse
  return {
    speed: 2.5,
    flights: [
      { id: 'F8', originAirportId: 1, destinationAirportId: 2, progress: 0.15 },
      { id: 'F9', originAirportId: 2, destinationAirportId: 3, progress: 0.2 },
      { id: 'F10', originAirportId: 3, destinationAirportId: 1, progress: 0.3 },
      { id: 'F11', originAirportId: 4, destinationAirportId: 5, progress: 0.45 },
      { id: 'F12', originAirportId: 5, destinationAirportId: 6, progress: 0.55 },
      { id: 'F13', originAirportId: 6, destinationAirportId: 4, progress: 0.05 },
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


