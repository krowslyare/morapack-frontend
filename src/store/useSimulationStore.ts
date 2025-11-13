import { create } from 'zustand'

interface SimulationStore {
  // Simulation configuration
  simulationStartDate: Date | null
  isSimulationConfigured: boolean

  // Actions
  setSimulationStartDate: (date: Date) => void
  clearSimulationConfig: () => void
  hasValidConfig: () => boolean
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulationStartDate: null,
  isSimulationConfigured: false,

  setSimulationStartDate: (date: Date) => {
    set({
      simulationStartDate: date,
      isSimulationConfigured: true
    })
  },

  clearSimulationConfig: () => {
    set({
      simulationStartDate: null,
      isSimulationConfigured: false
    })
  },

  hasValidConfig: () => {
    const state = get()
    return state.isSimulationConfigured && state.simulationStartDate !== null
  },
}))
