import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SimulationMode = 'weekly' | 'daily'
type CollapseVisualStatus = 'idle' | 'running' | 'paused' | 'collapsed' | 'completed'

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
  lastRealTimestamp: number | null  // Real-world timestamp when sim time was last updated (for background catch-up)
  dailyStats: {
    totalOrders: number
    assignedOrders: number
    totalProducts: number
    assignedProducts: number
  }

  // ==================== COLLAPSE VISUAL SIMULATION STATE ====================
  collapseVisualStatus: CollapseVisualStatus
  collapseVisualCurrentDay: number          // Current day being simulated (1, 2, 3...)
  collapseVisualSimStartTime: number | null // Simulation start (timestamp)
  collapseVisualCurrentTime: number | null  // Current sim time within the day (timestamp)
  collapseVisualSpeed: number               // Playback speed: 15 = 15min/sec, 30 = 30min/sec
  collapseVisualBacklog: number             // Current backlog count
  collapseVisualProgress: number            // 0-100, collapse proximity
  collapseVisualStatusLabel: string         // HEALTHY, WARNING, CRITICAL, COLLAPSED
  collapseVisualHasCollapsed: boolean
  collapseVisualCollapseReason: string | null

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
  
  // Get adjusted simulation time (accounts for time passed while away)
  getAdjustedSimTime: () => number | null
  setDailyStats: (stats: {
    totalOrders: number
    assignedOrders: number
    totalProducts: number
    assignedProducts: number
  }) => void

  // Collapse visual simulation actions
  startCollapseVisual: (startTime: Date, speed?: number) => void
  updateCollapseVisualTime: (time: Date) => void
  advanceCollapseVisualDay: (day: number) => void
  setCollapseVisualSpeed: (speed: number) => void
  setCollapseVisualProgress: (progress: number, statusLabel: string, backlog: number) => void
  setCollapseVisualCollapsed: (reason: string) => void
  pauseCollapseVisual: () => void
  resumeCollapseVisual: () => void
  resetCollapseVisual: () => void

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
      lastRealTimestamp: null,
      dailyStats: {
        totalOrders: 0,
        assignedOrders: 0,
        totalProducts: 0,
        assignedProducts: 0,
      },

      // Collapse visual simulation state
      collapseVisualStatus: 'idle' as CollapseVisualStatus,
      collapseVisualCurrentDay: 0,
      collapseVisualSimStartTime: null,
      collapseVisualCurrentTime: null,
      collapseVisualSpeed: 30, // Default: 30 min per real second
      collapseVisualBacklog: 0,
      collapseVisualProgress: 0,
      collapseVisualStatusLabel: 'IDLE',
      collapseVisualHasCollapsed: false,
      collapseVisualCollapseReason: null,

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
          lastRealTimestamp: null,
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
          lastRealTimestamp: Date.now(), // Track when we started
        })
      },

      updateDailySimTime: (time: Date | ((prev: number | null) => Date | null)) => {
        if (typeof time === 'function') {
          // Updater function - get current state and apply function
          const currentTime = get().dailyCurrentSimTime
          const newTime = time(currentTime)
          set({ 
            dailyCurrentSimTime: newTime ? newTime.getTime() : null,
            lastRealTimestamp: Date.now(), // Update real timestamp
          })
        } else {
          // Direct value
          set({ 
            dailyCurrentSimTime: time.getTime(),
            lastRealTimestamp: Date.now(), // Update real timestamp
          })
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
          lastRealTimestamp: null,
          dailyStats: {
            totalOrders: 0,
            assignedOrders: 0,
            totalProducts: 0,
            assignedProducts: 0,
          },
        })
      },

      setLastAlgorithmRunTime: (time: Date) => {
        const nextRun = new Date(time.getTime() + DAILY_REFRESH_WINDOW_MS - ALGORITHM_BUFFER_MS)
        set({ 
          lastAlgorithmRunTime: time.getTime(), // Store as timestamp
          nextAlgorithmRunTime: nextRun.getTime() // Store as timestamp
        }) 
      },

      setNextAlgorithmRunTime: (time: Date | null) => {
        set({ nextAlgorithmRunTime: time ? time.getTime() : null }) // Store as timestamp
      },

      // Get adjusted simulation time (accounts for time passed while away from the page)
      getAdjustedSimTime: () => {
        const state = get()
        if (!state.isDailyRunning || !state.dailyCurrentSimTime || !state.lastRealTimestamp) {
          return state.dailyCurrentSimTime
        }

        // Calculate how much real time passed since last update
        const realTimeElapsed = Date.now() - state.lastRealTimestamp
        
        // Convert to simulation time based on playback speed
        // speed=1 means 1 sim second = 1 real second
        // speed=60 means 60 sim seconds = 1 real second
        const simTimeElapsed = realTimeElapsed * state.dailyPlaybackSpeed
        
        // Return adjusted simulation time
        return state.dailyCurrentSimTime + simTimeElapsed
      },

      setDailyStats: (stats) => {
        set({ dailyStats: stats })
      },

      // Check if a new order is within the current 10-min window
      // (Legacy - kept for backwards compatibility but not used for new orders)
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

      // Trigger algorithm refresh when a new order is added during daily simulation
      // Any new order while daily simulation is running should trigger a re-run
      triggerRefreshIfNeeded: (_orderTime: Date) => {
        const state = get()
        if (!state.isDailyRunning || !state.dailyCurrentSimTime) {
          return false // Simulation not running, no refresh needed
        }

        // Force next algorithm run sooner (in 2 minute buffer)
        // This ensures the new order gets processed and assigned to a flight
        const currentTime = new Date(state.dailyCurrentSimTime)
        const nextRun = new Date(currentTime.getTime() + ALGORITHM_BUFFER_MS)
        set({ nextAlgorithmRunTime: nextRun.getTime() }) // Store as timestamp
        return true // Will trigger refresh
      },

      // ==================== COLLAPSE VISUAL SIMULATION ACTIONS ====================

      startCollapseVisual: (startTime: Date, speed: number = 30) => {
        set({
          collapseVisualStatus: 'running',
          collapseVisualCurrentDay: 0,
          collapseVisualSimStartTime: startTime.getTime(),
          collapseVisualCurrentTime: startTime.getTime(),
          collapseVisualSpeed: speed,
          collapseVisualBacklog: 0,
          collapseVisualProgress: 0,
          collapseVisualStatusLabel: 'HEALTHY',
          collapseVisualHasCollapsed: false,
          collapseVisualCollapseReason: null,
        })
      },

      updateCollapseVisualTime: (time: Date) => {
        set({ collapseVisualCurrentTime: time.getTime() })
      },

      advanceCollapseVisualDay: (day: number) => {
        const state = get()
        if (state.collapseVisualSimStartTime) {
          const dayStart = new Date(state.collapseVisualSimStartTime)
          dayStart.setDate(dayStart.getDate() + (day - 1))
          set({
            collapseVisualCurrentDay: day,
            collapseVisualCurrentTime: dayStart.getTime(),
          })
        }
      },

      setCollapseVisualSpeed: (speed: number) => {
        set({ collapseVisualSpeed: speed })
      },

      setCollapseVisualProgress: (progress: number, statusLabel: string, backlog: number) => {
        set({
          collapseVisualProgress: progress,
          collapseVisualStatusLabel: statusLabel,
          collapseVisualBacklog: backlog,
        })
      },

      setCollapseVisualCollapsed: (reason: string) => {
        set({
          collapseVisualStatus: 'collapsed',
          collapseVisualHasCollapsed: true,
          collapseVisualCollapseReason: reason,
          collapseVisualStatusLabel: 'COLLAPSED',
        })
      },

      pauseCollapseVisual: () => {
        set({ collapseVisualStatus: 'paused' })
      },

      resumeCollapseVisual: () => {
        set({ collapseVisualStatus: 'running' })
      },

      resetCollapseVisual: () => {
        set({
          collapseVisualStatus: 'idle',
          collapseVisualCurrentDay: 0,
          collapseVisualSimStartTime: null,
          collapseVisualCurrentTime: null,
          collapseVisualSpeed: 30,
          collapseVisualBacklog: 0,
          collapseVisualProgress: 0,
          collapseVisualStatusLabel: 'IDLE',
          collapseVisualHasCollapsed: false,
          collapseVisualCollapseReason: null,
        })
      },

      // ==================== COLLAPSE VISUAL SIMULATION ACTIONS ====================

      startCollapseVisual: (startTime: Date, speed: number = 30) => {
        set({
          collapseVisualStatus: 'running',
          collapseVisualCurrentDay: 0,
          collapseVisualSimStartTime: startTime.getTime(),
          collapseVisualCurrentTime: startTime.getTime(),
          collapseVisualSpeed: speed,
          collapseVisualBacklog: 0,
          collapseVisualProgress: 0,
          collapseVisualStatusLabel: 'HEALTHY',
          collapseVisualHasCollapsed: false,
          collapseVisualCollapseReason: null,
        })
      },

      updateCollapseVisualTime: (time: Date) => {
        set({ collapseVisualCurrentTime: time.getTime() })
      },

      advanceCollapseVisualDay: (day: number) => {
        const state = get()
        if (state.collapseVisualSimStartTime) {
          const dayStart = new Date(state.collapseVisualSimStartTime)
          dayStart.setDate(dayStart.getDate() + (day - 1))
          set({
            collapseVisualCurrentDay: day,
            collapseVisualCurrentTime: dayStart.getTime(),
          })
        }
      },

      setCollapseVisualSpeed: (speed: number) => {
        set({ collapseVisualSpeed: speed })
      },

      setCollapseVisualProgress: (progress: number, statusLabel: string, backlog: number) => {
        set({
          collapseVisualProgress: progress,
          collapseVisualStatusLabel: statusLabel,
          collapseVisualBacklog: backlog,
        })
      },

      setCollapseVisualCollapsed: (reason: string) => {
        set({
          collapseVisualStatus: 'collapsed',
          collapseVisualHasCollapsed: true,
          collapseVisualCollapseReason: reason,
          collapseVisualStatusLabel: 'COLLAPSED',
        })
      },

      pauseCollapseVisual: () => {
        set({ collapseVisualStatus: 'paused' })
      },

      resumeCollapseVisual: () => {
        set({ collapseVisualStatus: 'running' })
      },

      resetCollapseVisual: () => {
        set({
          collapseVisualStatus: 'idle',
          collapseVisualCurrentDay: 0,
          collapseVisualSimStartTime: null,
          collapseVisualCurrentTime: null,
          collapseVisualSpeed: 30,
          collapseVisualBacklog: 0,
          collapseVisualProgress: 0,
          collapseVisualStatusLabel: 'IDLE',
          collapseVisualHasCollapsed: false,
          collapseVisualCollapseReason: null,
        })
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

        // Reset collapse visual state on rehydrate (don't persist running state)
        if (state) {
          state.collapseVisualStatus = 'idle'
          state.collapseVisualHasCollapsed = false
        }

        // Timestamps are already stored as numbers, no conversion needed
      },
    },
  ),
)
