import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { SimulationTimelineResult } from '../types/SimulationTimelineTypes'

export interface ActiveFlight {
  flightId: number
  flightCode: string
  productId: number
  orderId: number
  originAirportId: number
  destinationAirportId: number
  departureTime: Date
  arrivalTime: Date
  progress: number // 0-1
}

export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'

type SimulationType = 'day-to-day' | 'weekly' | 'collapse'

export interface FlightStatusUpdate {
  flightId: number
  status: 'EN_VUELO' | 'COMPLETADO'
  timestamp: Date
}

export interface FlightCapacityEvent {
  eventType: 'DEPARTURE' | 'ARRIVAL'
  flightId: number
  airportId: number
  productIds: number[]
  totalVolume: number
  timestamp: Date
}

interface UseTemporalSimulationProps {
  timeline?: SimulationTimelineResult | null
  timeUnit?: TimeUnit // Time unit for playback (default: 'minutes')
  simulationType?: SimulationType // Type of simulation
  onFlightStatusChange?: (update: FlightStatusUpdate) => void // Callback for status changes
  onFlightCapacityChange?: (event: FlightCapacityEvent) => void // Callback for capacity changes
}

// Convert time unit to seconds per real second
function getSecondsPerRealSecond(timeUnit: TimeUnit): number {
  switch (timeUnit) {
    case 'seconds':
      return 1 // 1 sim second per real second
    case 'minutes':
      return 60 // 1 sim minute per real second
    case 'hours':
      return 3600 // 1 sim hour per real second
    case 'days':
      return 86400 // 1 sim day per real second
  }
}

export function useTemporalSimulation({
  timeline,
  timeUnit = 'minutes',
  simulationType = 'weekly',
  onFlightStatusChange,
  onFlightCapacityChange,
}: UseTemporalSimulationProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSimTime, setCurrentSimTime] = useState(0) // Seconds from start
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([])
  const [completedProductsCount, setCompletedProductsCount] = useState(0)

  // Flight statistics
  const [flightStats, setFlightStats] = useState({
    completed: 0,
    inFlight: 0,
    pending: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Track which flights have had their status updated to avoid duplicates
  const updatedFlightsRef = useRef<Set<string>>(new Set())

  // Use refs for callbacks to avoid dependency issues
  const onFlightStatusChangeRef = useRef(onFlightStatusChange)
  const onFlightCapacityChangeRef = useRef(onFlightCapacityChange)

  // Update refs when callbacks change
  onFlightStatusChangeRef.current = onFlightStatusChange
  onFlightCapacityChangeRef.current = onFlightCapacityChange

  // Calculate playback speed based on time unit
  const playbackSpeed = useMemo(() => getSecondsPerRealSecond(timeUnit), [timeUnit])

  // Memoize simulation start time to prevent infinite loops
  const simulationStartTime = useMemo(() => {
    if (!timeline) return new Date()
    return new Date(timeline.simulationStartTime)
  }, [timeline])

  const totalDurationSeconds = useMemo(
    () => (timeline?.totalDurationMinutes || 0) * 60, // Convert to seconds
    [timeline?.totalDurationMinutes],
  )

  // Calculate current simulation datetime
  const currentSimDateTime = useMemo(
    () => new Date(simulationStartTime.getTime() + currentSimTime * 1000),
    [simulationStartTime, currentSimTime],
  )

  // Index events by pairing DEPARTURE with ARRIVAL for faster lookup
  const flightPairs = useMemo(() => {
    if (!timeline || !timeline.events || timeline.events.length === 0) return []

    const pairs: Array<{
      departureEvent: any
      arrivalEvent: any | null
      departureTime: Date
      arrivalTime: Date | null
    }> = []

    const events = timeline.events
    const arrivalMap = new Map<string, any>()

    // First pass: index all arrival events by flightId for more reliable matching
    events.forEach((event) => {
      if (event.eventType === 'ARRIVAL' && event.flightId) {
        arrivalMap.set(event.flightId.toString(), event)
      }
    })

    // Second pass: create pairs for ALL departures, even without arrivals
    events.forEach((event) => {
      if (event.eventType === 'DEPARTURE') {
        const flightId = event.flightId?.toString()
        const arrivalEvent = flightId ? arrivalMap.get(flightId) : null

        pairs.push({
          departureEvent: event,
          arrivalEvent: arrivalEvent || null,
          departureTime: new Date(event.eventTime),
          arrivalTime: arrivalEvent ? new Date(arrivalEvent.eventTime) : null,
        })
      }
    })

    return pairs
  }, [timeline])

  // Update active flights based on current simulation time
  useEffect(() => {
    if (flightPairs.length === 0) {
      setActiveFlights([])
      setCompletedProductsCount(0)
      return
    }

    const currentDateTime = new Date(simulationStartTime.getTime() + currentSimTime * 1000)
    const flightsMap = new Map<string, ActiveFlight>()

    // Debug: Show events info at start
    if (currentSimTime === 0 && flightPairs.length > 0) {
      const pairsWithoutArrival = flightPairs.filter((p) => !p.arrivalEvent).length
      console.log('[TEMPORAL SIM] Timeline has', flightPairs.length, 'flight pairs')
      console.log('[TEMPORAL SIM] Pairs without ARRIVAL event:', pairsWithoutArrival)
      console.log('[TEMPORAL SIM] Simulation type:', simulationType)
      console.log('[TEMPORAL SIM] Time unit:', timeUnit, '- Speed:', playbackSpeed, 'x')
      if (pairsWithoutArrival > 0) {
        console.log(
          '[TEMPORAL SIM] Sample flight without arrival:',
          flightPairs.find((p) => !p.arrivalEvent)?.departureEvent,
        )
      }
    }

    // Find all flights that are currently active (departed but not arrived)
    // Using pre-indexed pairs is much faster than searching through all events
    const completedProductIds = new Set<number>()
    let completedFlightsCount = 0
    let pendingFlightsCount = 0
    let flightsWithInvalidAirports = 0

    flightPairs.forEach((pair) => {
      const { departureEvent, departureTime, arrivalTime } = pair

      // Flight is in progress if: departed but not yet arrived
      const hasDeparted = departureTime <= currentDateTime

      // Calculate effective arrival time (real or estimated)
      let effectiveArrivalTime: Date | null = arrivalTime
      if (!arrivalTime && hasDeparted) {
        // Estimate arrival time using transportTimeDays if available
        const transportDays = departureEvent.transportTimeDays || 7 // Default to 7 days
        effectiveArrivalTime = new Date(
          departureTime.getTime() + transportDays * 24 * 60 * 60 * 1000,
        )
      }

      const hasArrived = effectiveArrivalTime ? effectiveArrivalTime <= currentDateTime : false

      const flightId = departureEvent.flightId || 0
      const departureKey = `${flightId}-departed`
      const arrivalKey = `${flightId}-arrived`

      if (hasArrived && effectiveArrivalTime) {
        // Track completed products
        if (departureEvent.productId) {
          completedProductIds.add(departureEvent.productId)
        }
        completedFlightsCount++

        // Notify flight completion (only once)
        if (onFlightStatusChangeRef.current && flightId && !updatedFlightsRef.current.has(arrivalKey)) {
          updatedFlightsRef.current.add(arrivalKey)
          onFlightStatusChangeRef.current({
            flightId,
            status: 'COMPLETADO',
            timestamp: currentDateTime,
          })
        }

        // Notify capacity change - products arriving at destination airport
        if (onFlightCapacityChangeRef.current && !updatedFlightsRef.current.has(`${arrivalKey}-capacity`)) {
          updatedFlightsRef.current.add(`${arrivalKey}-capacity`)
          onFlightCapacityChangeRef.current({
            eventType: 'ARRIVAL',
            flightId: flightId,
            airportId: departureEvent.destinationAirportId || 0,
            productIds: [departureEvent.productId || 0],
            totalVolume: 1, // TODO: Get actual product volume from timeline
            timestamp: currentDateTime,
          })
        }
      } else if (hasDeparted && effectiveArrivalTime) {
        // Flight is active or in progress
        const flightKey = departureEvent.eventId

        // Validate that the flight has valid airport IDs
        const hasValidAirports =
          departureEvent.originAirportId && departureEvent.destinationAirportId

        if (!hasValidAirports) {
          flightsWithInvalidAirports++
          // Skip flights with invalid airports to prevent ghost flights
          return
        }

        const totalDuration = effectiveArrivalTime.getTime() - departureTime.getTime()
        const elapsed = currentDateTime.getTime() - departureTime.getTime()
        const progress = Math.max(0, Math.min(1, elapsed / totalDuration))

        flightsMap.set(flightKey, {
          flightId: flightId,
          flightCode: departureEvent.flightCode || 'N/A',
          productId: departureEvent.productId || 0,
          orderId: departureEvent.orderId || 0,
          originAirportId: departureEvent.originAirportId || 0,
          destinationAirportId: departureEvent.destinationAirportId || 0,
          departureTime: departureTime,
          arrivalTime: effectiveArrivalTime,
          progress,
        })

        // Notify flight departure (only once)
        if (onFlightStatusChangeRef.current && flightId && !updatedFlightsRef.current.has(departureKey)) {
          updatedFlightsRef.current.add(departureKey)
          onFlightStatusChangeRef.current({
            flightId,
            status: 'EN_VUELO',
            timestamp: currentDateTime,
          })
        }

        // Notify capacity change - products departing from origin airport
        if (onFlightCapacityChangeRef.current && !updatedFlightsRef.current.has(`${departureKey}-capacity`)) {
          updatedFlightsRef.current.add(`${departureKey}-capacity`)
          onFlightCapacityChangeRef.current({
            eventType: 'DEPARTURE',
            flightId: flightId,
            airportId: departureEvent.originAirportId || 0,
            productIds: [departureEvent.productId || 0],
            totalVolume: 1, // TODO: Get actual product volume from timeline
            timestamp: currentDateTime,
          })
        }
      } else {
        // Flight hasn't departed yet
        pendingFlightsCount++
      }
    })

    const activeFlightsList = Array.from(flightsMap.values())

    // Debug: Show active flights periodically
    const shouldLog = Math.floor(currentSimTime) % 30 === 0 && currentSimTime > 0
    if (shouldLog && activeFlightsList.length > 0) {
      console.log(
        `[${formatTime(currentSimTime)}] ${activeFlightsList.length} flights active, ${flightsWithInvalidAirports} invalid`,
      )
    }

    // Warn if there are flights with invalid airports
    if (flightsWithInvalidAirports > 0 && currentSimTime === 0) {
      console.warn(
        `[TEMPORAL SIM] ${flightsWithInvalidAirports} flights have invalid airport IDs and will be skipped`,
      )
    }

    setActiveFlights(activeFlightsList)
    setCompletedProductsCount(completedProductIds.size)
    setFlightStats({
      completed: completedFlightsCount,
      inFlight: activeFlightsList.length,
      pending: pendingFlightsCount,
    })
  }, [
    currentSimTime,
    flightPairs,
    simulationStartTime,
    playbackSpeed,
    simulationType,
    timeUnit,
  ])

  // Helper to format time for logging
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
  }

  // Playback control
  useEffect(() => {
    if (isPlaying && timeline) {
      startTimeRef.current = new Date()

      intervalRef.current = setInterval(() => {
        setCurrentSimTime((prev) => {
          const newTime = prev + playbackSpeed / 10 // Update 10 times per second

          if (newTime >= totalDurationSeconds) {
            setIsPlaying(false)
            return totalDurationSeconds
          }

          return newTime
        })
      }, 100) // 100ms intervals
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, totalDurationSeconds, timeline])

  const play = useCallback(() => {
    setCurrentSimTime((prev) => {
      if (prev >= totalDurationSeconds) {
        return 0
      }
      return prev
    })
    setIsPlaying(true)
  }, [totalDurationSeconds])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setCurrentSimTime(0)
    // Clear status update tracking
    updatedFlightsRef.current.clear()
  }, [])

  const seek = useCallback(
    (seconds: number) => {
      setCurrentSimTime(Math.max(0, Math.min(totalDurationSeconds, seconds)))
    },
    [totalDurationSeconds],
  )

  // Format time as HH:MM:SS or DD HH:MM
  const formatSimulationTime = useCallback((seconds: number): string => {
    const totalSeconds = Math.floor(seconds)
    const days = Math.floor(totalSeconds / (24 * 3600))
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])

  return {
    // State
    isPlaying,
    currentSimTime,
    currentSimDateTime,
    totalDurationSeconds,
    activeFlights,
    completedProductsCount,
    flightStats,

    // Controls
    play,
    pause,
    reset,
    seek,

    // Utilities
    formatSimulationTime,
    progressPercent: totalDurationSeconds > 0 ? (currentSimTime / totalDurationSeconds) * 100 : 0,
  }
}
