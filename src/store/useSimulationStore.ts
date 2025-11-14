import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SimulationStore {
  // Simulation configuration
  simulationStartDate: Date | null
  isSimulationConfigured: boolean

  // Actions
  setSimulationStartDate: (date: Date) => void
  clearSimulationConfig: () => void
  hasValidConfig: () => boolean
}

export const useSimulationStore = create<SimulationStore>(
  persist(
    (set, get) => ({
      simulationStartDate: null,
      isSimulationConfigured: false,

      setSimulationStartDate: (date: Date) => {
        set({
          simulationStartDate: date,
          isSimulationConfigured: true,
        })
      },

      clearSimulationConfig: () => {
        set({
          simulationStartDate: null,
          isSimulationConfigured: false,
        })
      },

      hasValidConfig: () => {
        const state = get()
        return state.isSimulationConfigured && state.simulationStartDate !== null
      },
    }),
    {
      name: 'morapack-simulation-store',
      storage: localStorage,
      partialize: (state) => ({
        simulationStartDate: state.simulationStartDate
          ? new Date(state.simulationStartDate)
          : null,
        isSimulationConfigured: state.isSimulationConfigured,
      }),
    },
  ),
)
