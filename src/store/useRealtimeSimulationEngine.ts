import { create } from 'zustand'
import { toast } from 'react-toastify'
import {
  simulationService,
  type FlightInstance,
  type FlightStatus,
} from '../api/simulationService'

const INITIAL_KPI = {
  totalOrders: 0,
  assignedOrders: 0,
  totalProducts: 0,
  assignedProducts: 0,
}

const REALTIME_WINDOW_MINUTES = 10
const WINDOW_TRIGGER_BUFFER_SECONDS = 30
const SIMULATION_TICK_MS = 1000

interface StartParams {
  simulationStartDate: Date
  airports: any[]
}

interface RealtimeSimulationState {
  simulationStartDate: Date | null
  isRunning: boolean
  isInitializing: boolean
  isLoadingData: boolean
  algorithmRunning: boolean
  currentSimTime: Date | null
  dayCount: number
  playbackSpeed: number
  windowMinutes: number
  flightInstances: FlightInstance[]
  airports: any[]
  kpi: typeof INITIAL_KPI
  setAirports: (airports: any[]) => void
  start: (params: StartParams) => Promise<void>
  pause: () => void
  stop: (reset?: boolean) => void
  enqueueImmediateRun: (creationDateIso?: string) => void
}

let simulationInterval: ReturnType<typeof setInterval> | null = null
let flightStatusesCache: FlightStatus[] = []
let pendingRunRef: Date | null = null
let lastRunRef: Date | null = null
let queuedRunRef: Date | null = null
let lastStateUpdateDay = -1
let lastGeneratedDay = -1
let algorithmRunningFlag = false

const clearSimulationInterval = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

export const useRealtimeSimulationEngine = create<RealtimeSimulationState>((set, get) => ({
  simulationStartDate: null,
  isRunning: false,
  isInitializing: false,
  isLoadingData: false,
  algorithmRunning: false,
  currentSimTime: null,
  dayCount: 0,
  playbackSpeed: 1,
  windowMinutes: REALTIME_WINDOW_MINUTES,
  flightInstances: [],
  airports: [],
  kpi: INITIAL_KPI,

  setAirports: (airports) => set({ airports }),

  start: async ({ simulationStartDate, airports }) => {
    if (!simulationStartDate) {
      toast.error('Debes configurar la fecha en Planificación primero')
      return
    }

    if (!airports || airports.length === 0) {
      toast.error('Debes cargar los aeropuertos antes de iniciar la simulación')
      return
    }

    set({
      isInitializing: true,
      simulationStartDate,
      currentSimTime: simulationStartDate,
      dayCount: 0,
      kpi: INITIAL_KPI,
      windowMinutes: REALTIME_WINDOW_MINUTES,
      playbackSpeed: 1,
    })

    resetEngineState()
    clearSimulationInterval()

    const flightsLoaded = await loadFlightData(simulationStartDate, airports)
    if (!flightsLoaded) {
      set({ isInitializing: false })
      return
    }

    await runDailySlice(simulationStartDate, { force: true })

    set({
      isInitializing: false,
      isRunning: true,
    })

    startSimulationClock()
  },

  pause: () => {
    if (!get().isRunning) return
    clearSimulationInterval()
    set({ isRunning: false })
  },

  stop: (reset = true) => {
    clearSimulationInterval()
    set({
      isRunning: false,
      algorithmRunning: false,
    })

    if (reset) {
      resetEngineState()
      set({
        currentSimTime: get().simulationStartDate,
        dayCount: 0,
        flightInstances: [],
        kpi: INITIAL_KPI,
      })
    }
  },

  enqueueImmediateRun: (creationDateIso) => {
    const state = get()
    if (!state.isRunning || !state.currentSimTime) return

    if (creationDateIso) {
      const orderDate = new Date(creationDateIso)
      if (!Number.isNaN(orderDate.getTime())) {
        const windowEnd = new Date(
          state.currentSimTime.getTime() + REALTIME_WINDOW_MINUTES * 60 * 1000,
        )
        if (orderDate < state.currentSimTime || orderDate > windowEnd) {
          console.debug(
            '[Realtime] Nuevo pedido fuera de la ventana activa. No se recalcula la asignación.',
          )
          return
        }
      }
    }

    if (algorithmRunningFlag) {
      queuedRunRef = new Date(state.currentSimTime)
      return
    }

    void runDailySlice(new Date(state.currentSimTime), { force: true })
  },
}))

function resetEngineState() {
  pendingRunRef = null
  lastRunRef = null
  queuedRunRef = null
  lastStateUpdateDay = -1
  lastGeneratedDay = -1
  algorithmRunningFlag = false
}

async function loadFlightData(simulationStartDate: Date, airports: any[]): Promise<boolean> {
  setState({ isLoadingData: true })
  try {
    const response = await simulationService.getFlightStatuses()
    if (!response || !response.flights || !Array.isArray(response.flights)) {
      toast.error('Error: datos de vuelos inválidos')
      return false
    }

    flightStatusesCache = response.flights

    if (!airports || airports.length === 0) {
      toast.warning('Esperando datos de aeropuertos...')
      return false
    }

    const instances = simulationService.generateFlightInstances(
      response.flights,
      simulationStartDate,
      72,
      airports,
    )

    if (instances.length === 0) {
      toast.warning('No se generaron instancias de vuelo. Verifica los datos del backend.')
    }

    setState({ flightInstances: instances })
    return true
  } catch (error) {
    console.error('Error loading flight data:', error)
    toast.error('Error al cargar vuelos')
    return false
  } finally {
    setState({ isLoadingData: false })
  }
}

async function runDailySlice(windowStart: Date, options?: { force?: boolean }) {
  const state = useRealtimeSimulationEngine.getState()
  if (!state.simulationStartDate) return

  if (!options?.force && pendingRunRef && pendingRunRef.getTime() === windowStart.getTime()) {
    return
  }

  pendingRunRef = windowStart
  algorithmRunningFlag = true
  setState({ algorithmRunning: true })

  const durationHours = REALTIME_WINDOW_MINUTES / 60
  const dayNumber = Math.floor(
    (windowStart.getTime() - state.simulationStartDate.getTime()) / (24 * 60 * 60 * 1000),
  )

  try {
    const response = await simulationService.executeDaily({
      simulationStartTime: windowStart.toISOString(),
      simulationDurationHours: durationHours,
      useDatabase: true,
      simulationSpeed: 1,
    })

    if (!response) {
      toast.error('Error: respuesta del algoritmo inválida')
      return
    }

    lastRunRef = windowStart
    pendingRunRef = null

    setState({
      kpi: {
        totalOrders: response.totalOrders || 0,
        assignedOrders: response.assignedOrders || 0,
        totalProducts: response.totalProducts || 0,
        assignedProducts: response.assignedProducts || 0,
      },
    })

    if (flightStatusesCache.length > 0 && state.airports.length > 0) {
      const updatedInstances = simulationService.addNextDayInstances(
        flightStatusesCache,
        state.flightInstances,
        state.simulationStartDate,
        dayNumber,
        state.airports,
      )
      setState({ flightInstances: updatedInstances })
    }
  } catch (error) {
    console.error('Error ejecutando ventana diaria:', error)
    toast.error('Error al ejecutar el algoritmo diario')
  } finally {
    algorithmRunningFlag = false
    setState({ algorithmRunning: false })

    if (pendingRunRef && pendingRunRef.getTime() === windowStart.getTime()) {
      pendingRunRef = null
    }

    if (queuedRunRef) {
      const queued = queuedRunRef
      queuedRunRef = null
      pendingRunRef = queued
      void runDailySlice(new Date(queued), { force: true })
    }
  }
}

function startSimulationClock() {
  clearSimulationInterval()

  simulationInterval = setInterval(() => {
    const state = useRealtimeSimulationEngine.getState()
    if (!state.isRunning || !state.currentSimTime || !state.simulationStartDate) {
      return
    }

    const next = new Date(state.currentSimTime.getTime() + SIMULATION_TICK_MS)
    const elapsedSimulationMs = next.getTime() - state.simulationStartDate.getTime()
    const elapsedHours = elapsedSimulationMs / (1000 * 60 * 60)
    const currentDay = Math.floor(elapsedHours / 24)
    const hourOfDay = elapsedHours % 24

    setState({
      currentSimTime: next,
      dayCount: currentDay,
    })

    if (hourOfDay >= 23 && currentDay > lastStateUpdateDay) {
      lastStateUpdateDay = currentDay
      simulationService
        .updateStates({ currentTime: next.toISOString() })
        .catch((err) => console.error('Failed to update states:', err))
    }

    if (currentDay > lastGeneratedDay) {
      lastGeneratedDay = currentDay
      if (flightStatusesCache.length > 0 && state.airports.length > 0) {
        const updatedInstances = simulationService.addNextDayInstances(
          flightStatusesCache,
          state.flightInstances,
          state.simulationStartDate,
          currentDay,
          state.airports,
        )
        setState({ flightInstances: updatedInstances })
      }
    }

    const windowMs = REALTIME_WINDOW_MINUTES * 60 * 1000
    const bufferMs = WINDOW_TRIGGER_BUFFER_SECONDS * 1000
    const reference = pendingRunRef ?? lastRunRef
    const elapsedSinceRun = reference
      ? next.getTime() - reference.getTime()
      : windowMs - bufferMs

    const shouldTriggerWindow =
      elapsedSinceRun >= windowMs - bufferMs && !algorithmRunningFlag && lastRunRef !== null

    if (shouldTriggerWindow) {
      pendingRunRef = new Date(next)
      void runDailySlice(new Date(next))
    }
  }, SIMULATION_TICK_MS)
}

function setState(partial: Partial<RealtimeSimulationState>) {
  useRealtimeSimulationEngine.setState(partial)
}

