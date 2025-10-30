import { create } from 'zustand'
import type { AlgorithmResultSchema } from '../types'

interface Dataset {
  id: string
  name: string
  records: number
  version: string
  lastUpdate: string
  progress?: number
}

interface DataStore {
  datasets: Dataset[]
  datasetVersion: string
  simulationResults: AlgorithmResultSchema | null
  setDatasets: (datasets: Dataset[]) => void
  setDatasetVersion: (version: string) => void
  setSimulationResults: (results: AlgorithmResultSchema | null) => void
  clearSimulationResults: () => void
  hasData: () => boolean
  getAvailableVersions: () => string[]
}

export const useDataStore = create<DataStore>((set, get) => ({
  datasets: [
    {
      id: '1',
      name: 'Vuelos',
      records: 1275,
      version: 'v2',
      lastUpdate: '2024-08-24 14:30',
    },
    {
      id: '2',
      name: 'Aeropuertos Globales',
      records: 45,
      version: 'v2',
      lastUpdate: '2024-08-24 14:30',
    },
    {
      id: '3',
      name: 'Pedidos Históricos Q2',
      records: 8934,
      version: 'v1.0',
      lastUpdate: '2024-08-24 14:30',
      progress: 89,
    },
    {
      id: '4',
      name: 'Paquetes MPE',
      records: 0,
      version: 'v0',
      lastUpdate: '2024-08-24 14:30',
    },
  ],
  datasetVersion: 'Base de Datos - MoraPack PostgreSQL',
  simulationResults: null,

  setDatasets: (datasets) => set({ datasets }),

  setDatasetVersion: (version) => set({ datasetVersion: version }),

  setSimulationResults: (results) => set({ simulationResults: results }),

  clearSimulationResults: () => set({ simulationResults: null }),

  hasData: () => {
    const datasets = get().datasets
    // NOTA: Estos son datos dummy para UI mockup.
    // La validación REAL de datos se hace en los componentes usando react-query hooks:
    // - useFlightsCount() para verificar vuelos en BD
    // - useAirports() para verificar aeropuertos en BD
    // Esta función se mantiene por compatibilidad con UI legacy
    const flights = datasets.find((d) => d.name === 'Vuelos')
    const airports = datasets.find((d) => d.name === 'Aeropuertos Globales')
    return (flights?.records ?? 0) > 0 && (airports?.records ?? 0) > 0
  },

  getAvailableVersions: () => {
    const datasets = get().datasets
    const versions = new Set(datasets.map((d) => d.version))
    return Array.from(versions)
      .filter((v) => v !== 'v0')
      .sort()
      .reverse()
  },
}))
