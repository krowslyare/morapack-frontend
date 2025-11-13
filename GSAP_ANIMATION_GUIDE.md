# GSAP Flight Animation Guide

## Overview

The Daily Simulation page now uses **GSAP (GreenSock Animation Platform)** for flight animations with **real-time synchronization**. Each flight animates based on its actual departure and arrival times from the backend.

## How It Works

### Time Scaling

**Simulation Time Scale:**
- 1 real second = 1 simulation minute = 60 simulation seconds
- 1 real minute = 60 simulation minutes = 1 simulation hour
- 24 real minutes = 24 simulation hours = 1 simulation day

**Example:**
- Flight departs: 2:00 PM (simulation time)
- Flight arrives: 6:00 PM (simulation time)
- Duration: 4 hours simulation time = **4 real minutes**

### GSAP Timeline Architecture

```typescript
// Create a timeline for all flights
const timeline = gsap.timeline({ paused: true })

// For each flight:
//   1. Calculate departure offset from simulation start
//   2. Calculate flight duration
//   3. Add animation at specific timeline position

timeline.to(animObj, {
  progress: 1,
  duration: flightDurationSeconds,      // e.g., 14400s = 4 hours
  ease: 'none',
  onUpdate: () => {
    // Update marker position along bezier curve
    marker.setLatLng(bezierPoint(progress, origin, ctrl, destination))
  }
}, startOffsetSeconds)  // Start at departure time, e.g., 7200s = 2 hours
```

### Synchronization

The timeline is synchronized with the simulation clock in three ways:

1. **Initial Seek**: When timeline is created, it seeks to current simulation time
2. **Play/Pause**: Timeline plays/pauses based on `isRunning` state
3. **Time Updates**: Every second, timeline seeks to match simulation time

```typescript
// Sync timeline with current simulation time
const elapsedMs = currentSimTime - simulationStartTime
const elapsedSeconds = elapsedMs / 1000
timeline.seek(elapsedSeconds, false)  // false = don't trigger callbacks
```

## Implementation Details

### Flight Instance Generation

```typescript
// Generate flight instances from flight statuses
const instances = simulationService.generateFlightInstances(
  flights,           // Flight statuses from backend
  startTime,         // Simulation start time
  24,                // Duration in hours (24 = 1 day)
  airports           // Airport data for coordinates
)
```

Each flight instance contains:
- `departureTime`: ISO 8601 timestamp
- `arrivalTime`: ISO 8601 timestamp
- `originAirport`: { latitude, longitude, ... }
- `destinationAirport`: { latitude, longitude, ... }

### GSAP Animation Setup

**Step 1: Calculate Timing**
```typescript
const departureTime = new Date(flight.departureTime)
const arrivalTime = new Date(flight.arrivalTime)

// Flight duration in real seconds (simulation time / scale)
const flightDurationMs = arrivalTime.getTime() - departureTime.getTime()
const flightDurationSeconds = flightDurationMs / 1000

// Offset from simulation start
const startOffsetMs = departureTime.getTime() - simulationStartTime.getTime()
const startOffsetSeconds = startOffsetMs / 1000
```

**Step 2: Create Animation Object**
```typescript
const animObj = { progress: 0 }  // Will animate from 0 to 1

timeline.to(animObj, {
  progress: 1,
  duration: flightDurationSeconds,
  ease: 'none',  // Linear movement
  onUpdate: () => {
    // Interpolate position along bezier curve
    const pos = bezierPoint(animObj.progress, origin, ctrl, destination)
    marker.setLatLng(pos)
  },
  onStart: () => {
    marker.setOpacity(1)  // Show when flight departs
  },
  onComplete: () => {
    marker.setOpacity(0.3)  // Fade when flight arrives
  }
}, startOffsetSeconds)  // Position in timeline
```

**Step 3: Bezier Curve Movement**
```typescript
// Quadratic bezier: P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
function bezierPoint(t, p0, p1, p2) {
  const oneMinusT = 1 - t
  const lat = oneMinusT² * p0[0] + 2*oneMinusT*t * p1[0] + t² * p2[0]
  const lng = oneMinusT² * p0[1] + 2*oneMinusT*t * p1[1] + t² * p2[1]
  return [lat, lng]
}
```

## Performance Optimization

### Culling Strategy

```typescript
const MAX_FLIGHTS = 150  // Limit for performance

const limitedFlights = flightInstances.slice(0, MAX_FLIGHTS)
```

**Why limit?**
- GSAP can handle thousands of animations
- But Leaflet markers have DOM overhead
- 150 simultaneous flights = good balance between visual density and performance

### Active Flight Counting

```typescript
const activeFlightsCount = flightInstances.filter((f) => {
  const dept = new Date(f.departureTime)
  const arr = new Date(f.arrivalTime)
  return currentSimTime >= dept && currentSimTime <= arr
}).length
```

This shows how many flights are actually in the air at the current simulation time.

## Example Timeline

```
Simulation Start: Jan 2, 2025 00:00:00
Timeline Position: 0 seconds

Flight 1: LIM → CUZ
  Departure: 02:00:00 (7200s)
  Arrival:   06:00:00 (21600s)
  Duration:  4 hours (14400s)

Flight 2: BRU → GYD
  Departure: 08:00:00 (28800s)
  Arrival:   14:00:00 (50400s)
  Duration:  6 hours (21600s)

GSAP Timeline:
├─ 0s ──────────────────────────────────────────────────────────────→
├─ 7200s:  Flight 1 starts animating (LIM → CUZ)
├─ 21600s: Flight 1 completes
├─ 28800s: Flight 2 starts animating (BRU → GYD)
├─ 50400s: Flight 2 completes
└─ 86400s: End of day (24 hours)

When currentSimTime = 10:00:00 (36000s):
- Timeline seeks to 36000s
- Flight 1 is complete (faded out)
- Flight 2 is actively animating
```

## Real-World Example

**Flight: Lima → Brussels**
- Departure: Jan 2, 2025 14:00:00 (Day 0, 2 PM)
- Arrival: Jan 3, 2025 06:00:00 (Day 1, 6 AM)
- Duration: 16 hours

**In Simulation:**
- Timeline start: Day 0, 00:00:00
- Flight starts at: 50400 seconds (14 hours offset)
- Flight duration: 57600 seconds (16 hours)
- Flight ends at: 108000 seconds (30 hours from start)

**In Real Time (1 real second = 1 sim minute):**
- Simulation starts at real time 00:00
- Flight appears at real time 00:14 (14 minutes later)
- Flight animates for 16 real minutes
- Flight arrives at real time 00:30 (30 minutes from start)

## Benefits of GSAP

### 1. Precise Timing
```typescript
// Each flight animates exactly when it should
// No drift or timing issues
timeline.seek(exactSimulationTime)
```

### 2. Smooth Performance
```typescript
// GSAP uses requestAnimationFrame internally
// Hardware accelerated when possible
// Efficient batch updates
```

### 3. Easy Control
```typescript
timeline.play()      // Resume
timeline.pause()     // Pause
timeline.seek(time)  // Jump to specific time
timeline.reverse()   // Play backward
```

### 4. Memory Efficient
```typescript
// Single timeline manages all flights
// Automatic cleanup on unmount
// No interval leaks
```

## Troubleshooting

### Flights not appearing

**Check:**
1. Flight instances generated? `console.log(flightInstances.length)`
2. Simulation time progressing? Check the clock display
3. Timeline created? Check `timelineRef.current`

**Debug:**
```typescript
console.log('Flight instances:', flightInstances.length)
console.log('Current sim time:', currentSimTime)
console.log('Timeline:', timelineRef.current?.duration())
```

### Flights moving too fast/slow

The time scale is set by the simulation clock interval:

```typescript
// In startSimulationClock()
intervalRef.current = setInterval(() => {
  setCurrentSimTime((prev) => {
    const next = new Date(prev.getTime() + 60000)  // +1 minute
    return next
  })
}, 1000)  // Every 1 real second
```

To change speed:
- Faster: Decrease interval or increase time increment
- Slower: Increase interval or decrease time increment

### Timeline not syncing

The timeline syncs in the `AnimatedFlights` component:

```typescript
useEffect(() => {
  if (!timelineRef.current) return
  const elapsedSeconds = (currentSimTime - simulationStartTime) / 1000
  timelineRef.current.seek(elapsedSeconds, false)
}, [currentSimTime, simulationStartTime])
```

Make sure `currentSimTime` is updating properly.

## Future Enhancements

### 1. Variable Speed Control
```typescript
const [timeScale, setTimeScale] = useState(1)  // 1x, 2x, 5x, 10x

timeline.timeScale(timeScale)  // Speed up/slow down
```

### 2. Flight Grouping
```typescript
// Group flights by route for visual clustering
const routeGroups = groupBy(flights, f => `${f.origin}-${f.destination}`)
```

### 3. Advanced GSAP Effects
```typescript
// Use GSAP MotionPath plugin for complex paths
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
gsap.registerPlugin(MotionPathPlugin)

gsap.to(marker, {
  motionPath: {
    path: svgPath,
    align: svgPath,
    autoRotate: true
  }
})
```

### 4. Real-time Backend Updates
```typescript
// WebSocket connection
const ws = new WebSocket('ws://backend/flights')
ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  updateFlightInstance(update)
}
```

## Summary

The GSAP implementation provides:

✅ **Accurate timing** - Each flight animates for its exact duration
✅ **Synchronized** - Timeline stays in sync with simulation clock
✅ **Performant** - Handles 150+ simultaneous flights smoothly
✅ **Smooth animations** - Hardware-accelerated bezier curves
✅ **Easy control** - Simple play/pause/seek API

The key insight: **GSAP timeline acts as a time machine** that can jump to any point in the simulation, perfectly syncing with the virtual time.
