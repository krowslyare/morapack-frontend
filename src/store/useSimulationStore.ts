import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SimulationMode = 'weekly' | 'daily'

interface SimulationStore {
  // Simulation configuration
  simulationStartDate: Date | null
  isSimulationConfigured: boolean
  simulationMode: SimulationMode

  // Daily simulation background state
  isDailyRunning: boolean
  dailyCurrentSimTime: number | null // CHANGED: Store as timestamp
  dailyPlaybackSpeed: number
  lastAlgorithmRunTime: number | null  // When the algorithm last ran // CHANGED: Store as timestamp
  nextAlgorithmRunTime: number | null  // When the next run is scheduled // CHANGED: Store as timestamp

  // Actions
  setSimulationStartDate: (date: Date) => void
  setSimulationMode: (mode: SimulationMode) => void
  clearSimulationConfig: () => void
  hasValidConfig: () => boolean
  isDailyMode: () => boolean

  // Daily simulation actions
  startDailySimulation: (startTime: Date, speed: number) => void
  updateDailySimTime: (time: Date | ((prev: number | null) => Date | null)) => void
  setDailyPlaybackSpeed: (speed: number) => void
  stopDailySimulation: () => void
  setLastAlgorithmRunTime: (time: Date) => void
  setNextAlgorithmRunTime: (time: Date | null) => void

  // Check if a new order is within the current 10-min window
  isOrderInCurrentWindow: (orderTime: Date) => boolean

  // Trigger algorithm refresh if order is in window (returns true if refresh scheduled)
  triggerRefreshIfNeeded: (orderTime: Date) => boolean
}

// Refresh window in milliseconds (10 minutes)
export const DAILY_REFRESH_WINDOW_MS = 10 * 60 * 1000
// Buffer time for algorithm execution (2 minutes)
export const ALGORITHM_BUFFER_MS = 2 * 60 * 1000

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      simulationStartDate: null,
      isSimulationConfigured: false,
      simulationMode: 'weekly',

      // Daily simulation background state
      isDailyRunning: false,
      dailyCurrentSimTime: null,
      dailyPlaybackSpeed: 1,
      lastAlgorithmRunTime: null,
      nextAlgorithmRunTime: null,

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
          isDailyRunning: false,
          dailyCurrentSimTime: null,
          lastAlgorithmRunTime: null,
          nextAlgorithmRunTime: null,
        })
      },

      hasValidConfig: () => {
        const state = get()
        return state.isSimulationConfigured && state.simulationStartDate !== null
      },

      isDailyMode: () => {
        return get().simulationMode === 'daily'
      },

      // Daily simulation actions
      startDailySimulation: (startTime: Date, speed: number) => {
        const nextRun = new Date(startTime.getTime() + DAILY_REFRESH_WINDOW_MS - ALGORITHM_BUFFER_MS)
        set({
          isDailyRunning: true,
          dailyCurrentSimTime: startTime.getTime(), // Store as timestamp
          dailyPlaybackSpeed: speed,
          lastAlgorithmRunTime: startTime.getTime(), // Store as timestamp
          nextAlgorithmRunTime: nextRun.getTime(), // Store as timestamp
        })
      },

      updateDailySimTime: (time: Date | ((prev: number | null) => Date | null)) => {
        if (typeof time === 'function') {
          // Updater function - get current state and apply function
          const currentTime = get().dailyCurrentSimTime
          const newTime = time(currentTime)
          set({ dailyCurrentSimTime: newTime ? newTime.getTime() : null })
        } else {
          // Direct value
          set({ dailyCurrentSimTime: time.getTime() })
        }
      },

      setDailyPlaybackSpeed: (speed: number) => {
        set({ dailyPlaybackSpeed: speed })
      },

      stopDailySimulation: () => {
        set({
          isDailyRunning: false,
          dailyCurrentSimTime: null,
          lastAlgorithmRunTime: null,
          nextAlgorithmRunTime: null,
        })
      },

      setLastAlgorithmRunTime: (time: Date) => {
        set({ lastAlgorithmRunTime: time.getTime() }) // Store as timestamp
      },

      setNextAlgorithmRunTime: (time: Date | null) => {
        set({ nextAlgorithmRunTime: time ? time.getTime() : null }) // Store as timestamp
      },

      // Check if a new order is within the current 10-min window
      isOrderInCurrentWindow: (orderTime: Date) => {
        const state = get()
        if (!state.isDailyRunning || !state.lastAlgorithmRunTime) {
          return false
        }

        // Convert timestamps back to Date for comparison
        const lastRun = new Date(state.lastAlgorithmRunTime)
        const windowStart = lastRun
        const windowEnd = new Date(lastRun.getTime() + DAILY_REFRESH_WINDOW_MS)

        return orderTime >= windowStart && orderTime <= windowEnd
      },

      // Trigger immediate algorithm refresh if new order is in current window
      triggerRefreshIfNeeded: (orderTime: Date) => {
        const state = get()
        if (!state.isDailyRunning || !state.dailyCurrentSimTime) {
          return false // Simulation not running
        }

        // Check if order is in current window
        if (state.isOrderInCurrentWindow(orderTime)) {
          // Force next algorithm run sooner (in 2 minute buffer)
          const currentTime = new Date(state.dailyCurrentSimTime)
          const nextRun = new Date(currentTime.getTime() + ALGORITHM_BUFFER_MS)
          set({ nextAlgorithmRunTime: nextRun.getTime() }) // Store as timestamp
          return true // Will trigger refresh
        }

        return false // Order outside window, no refresh needed
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

        // Timestamps are already stored as numbers, no conversion needed
      },
    },
  ),
)
