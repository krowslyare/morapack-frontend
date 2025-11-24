import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SimulationMode = 'weekly' | 'daily'

interface SimulationStore {
  // Simulation configuration
  simulationStartDate: Date | null
  isSimulationConfigured: boolean
  simulationMode: SimulationMode

  // Actions
  setSimulationStartDate: (date: Date) => void
  setSimulationMode: (mode: SimulationMode) => void
  clearSimulationConfig: () => void
  hasValidConfig: () => boolean
  isDailyMode: () => boolean
}

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      simulationStartDate: null,
      isSimulationConfigured: false,
      simulationMode: 'weekly',

      setSimulationStartDate: (date: Date) => {
        set({
          simulationStartDate: date,
          isSimulationConfigured: true,
        })
      },

      setSimulationMode: (mode: SimulationMode) => {
        set({ simulationMode: mode })
      },

      clearSimulationConfig: () => {
        set({
          simulationStartDate: null,
          isSimulationConfigured: false,
          simulationMode: 'weekly',
        })
      },

      hasValidConfig: () => {
        const state = get()
        return state.isSimulationConfigured && state.simulationStartDate !== null
      },

      isDailyMode: () => {
        return get().simulationMode === 'daily'
      },
    }),
    {
      name: 'morapack-simulation-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.simulationStartDate) {
          // Convert string back to Date object
          state.simulationStartDate = new Date(state.simulationStartDate)
        }

        if (state && !state.simulationMode) {
          state.simulationMode = 'weekly'
        }
      },
    },
  ),
)
