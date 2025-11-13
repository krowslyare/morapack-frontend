# Rolling Window System - Continuous Flight Simulation

## Problem

Flights are **cyclic** - they repeat every day. A flight that departs at 2:00 PM on Day 0 will also depart at 2:00 PM on Day 1, Day 2, etc.

Additionally, some flights cross midnight:
- **Example**: Flight departs 9:00 PM (Day 0) → arrives 3:00 AM (Day 1)

If we only generate instances for 24 hours and restart when a new day begins, we would **cut off midnight-crossing flights** mid-animation.

## Solution: Rolling Window

Instead of restarting every day, we maintain a **rolling window** of flight instances:

```
Day 0 Start (00:00:00)
├─ Initial: Generate instances for Days 0, 1, 2 (72 hours)
│
Day 1 Start (24:00:00)
├─ Add: Generate instances for Day 3 (next 24 hours)
├─ Clean: Remove instances older than Day 0
│  Result: Now have instances for Days 1, 2, 3
│
Day 2 Start (48:00:00)
├─ Add: Generate instances for Day 4 (next 24 hours)
├─ Clean: Remove instances older than Day 1
│  Result: Now have instances for Days 2, 3, 4
│
And so on...
```

## How It Works

### 1. Initial Load (3 Days)

```typescript
// Generate instances for 3 days (72 hours)
const instances = simulationService.generateFlightInstances(
  flights,
  simulationStartDate,
  72, // 72 hours
  airports
)
```

**Why 3 days?**
- Day 0: Current flights
- Day 1: Tomorrow's flights (handles midnight crossing)
- Day 2: Day after tomorrow (buffer for smooth transitions)

### 2. Daily Updates (Add Next Day)

```typescript
// When Day 1 starts
const newInstances = simulationService.addNextDayInstances(
  flights,           // Flight statuses
  currentInstances,  // Current instances
  simulationStartTime,
  currentDay,        // Day number (1)
  airports
)
```

This function:
1. **Generates** instances for Day 3 (next 24 hours)
2. **Cleans up** instances older than Day 0
3. **Returns** combined instances (Days 1, 2, 3)

### 3. Dynamic Timeline Updates

The GSAP timeline **does not restart**. Instead, new animations are added dynamically:

```typescript
// Track which instances have been processed
const processedIdsRef = useRef<Set<string>>(new Set())

// Find new instances
const newInstances = flightInstances.filter(
  (f) => !processedIdsRef.current.has(f.id)
)

// Add animations for new instances to existing timeline
newInstances.forEach((flight) => {
  processedIdsRef.current.add(flight.id)
  timeline.to(animObj, { ...config }, startOffsetSeconds)
})
```

## Midnight-Crossing Flights Example

**Flight: Lima → Brussels**
- Departs: Day 0, 21:00 (9 PM)
- Arrives: Day 1, 03:00 (3 AM)
- Duration: 6 hours

### Timeline:

```
Day 0
20:00 ─────────────────────────────────────────────
21:00 ──[DEPARTURE]────────────────────────────────
22:00 ──────────────[Flying]──────────────────────
23:00 ──────────────────────[Flying]──────────────
00:00 ════════════════════════════════════════════ Day 1 Starts
01:00 ──────────────────────────────[Flying]──────
02:00 ──────────────────────────────────[Flying]──
03:00 ──────────────────────────────────[ARRIVAL]─
```

**What happens at midnight (00:00)?**
- Simulation continues without interruption
- Flight animation continues smoothly
- New instances for Day 3 are added to timeline
- Timeline never restarts

## Memory Management

To prevent memory leaks from thousands of completed flights:

### 1. Cleanup Old Instances

```typescript
// Remove instances with arrival time older than 1 day ago
const cleanupThreshold = new Date(
  simulationStartTime.getTime() + (currentDay - 1) * 24 * 60 * 60 * 1000
)

const cleanedInstances = currentInstances.filter((instance) => {
  const arrivalTime = new Date(instance.arrivalTime)
  return arrivalTime > cleanupThreshold
})
```

### 2. Remove Completed Markers

```typescript
onComplete: () => {
  marker.setOpacity(0.3) // Fade out
  // Remove from DOM after 1 minute
  setTimeout(() => {
    if (markersRef.current[flight.id]) {
      markersRef.current[flight.id].remove()
      delete markersRef.current[flight.id]
    }
  }, 60000)
}
```

## Flight Instance IDs

To ensure uniqueness across days, instance IDs include:
- Flight code
- Day number
- Frequency index
- Departure timestamp

```typescript
id: `${flight.code}-D${day}-F${i}-${departureTime.getTime()}`
// Example: "LIM-CUZ-D2-F0-1704156000000"
```

This prevents collisions when the same flight appears on multiple days.

## Performance Characteristics

### Instance Counts

```
Initial (Day 0):
  Flights per day: ~1000
  Days: 3
  Total instances: ~3000

After Day 1:
  Old instances removed: ~1000 (Day 0)
  New instances added: ~1000 (Day 3)
  Total maintained: ~3000

Memory footprint: Constant (~3000 instances)
```

### GSAP Timeline

```
Timeline size grows continuously, but:
- Completed animations don't consume CPU
- Markers are removed from DOM
- Only active flights are rendered
- Maximum 200 markers at once (performance limit)
```

## Example Flow

```typescript
// T = 0:00:00 (Day 0 Start)
loadFlightData()
  → Generates: Day 0, 1, 2 instances
  → Timeline: 0s to 259200s (72 hours)
  → Active instances: 3000

// T = 24:00:00 (Day 1 Start)
runDailyAlgorithm(1)
  → Algorithm runs for Day 1
  → addNextDayInstances() called
  → Generates: Day 3 instances
  → Cleans: Day 0 old instances
  → Active instances: 3000
  → Timeline: Continues, new animations added at 259200s+

// T = 48:00:00 (Day 2 Start)
runDailyAlgorithm(2)
  → Algorithm runs for Day 2
  → addNextDayInstances() called
  → Generates: Day 4 instances
  → Cleans: Day 1 old instances
  → Active instances: 3000
  → Timeline: Continues, new animations added further
```

## Benefits

### ✅ Continuous Animation
- No interruptions at midnight
- Smooth transitions between days
- Midnight-crossing flights complete naturally

### ✅ Memory Efficient
- Constant memory footprint (~3000 instances)
- Old markers removed automatically
- No accumulation over time

### ✅ Performance Stable
- Timeline grows but inactive animations don't cost CPU
- DOM only has ~200 markers maximum
- GSAP handles thousands of animations efficiently

### ✅ Accurate Timing
- Each flight animates for its exact duration
- No drift or synchronization issues
- Works correctly across day boundaries

## Debugging

### Check Instance Window

```typescript
console.log('Instances by day:')
flightInstances.forEach((f) => {
  const dept = new Date(f.departureTime)
  const day = Math.floor((dept - simulationStartTime) / (24 * 60 * 60 * 1000))
  console.log(`Flight ${f.flightCode}: Day ${day}`)
})
```

### Check Timeline Size

```typescript
console.log('Timeline duration:', timelineRef.current?.duration(), 'seconds')
console.log('Processed flights:', processedIdsRef.current.size)
```

### Monitor Memory

```typescript
console.log('Active markers:', Object.keys(markersRef.current).length)
console.log('Active instances:', flightInstances.length)
```

## Troubleshooting

### Problem: Flights disappear at midnight

**Cause**: Not enough days in rolling window

**Solution**: Increase initial window size
```typescript
// From 72 to 96 hours
const instances = generateFlightInstances(flights, start, 96, airports)
```

### Problem: Too many markers, performance drops

**Cause**: MAX_FLIGHTS too high

**Solution**: Reduce limit
```typescript
const MAX_FLIGHTS = 150 // From 200
```

### Problem: Memory keeps growing

**Cause**: Completed markers not removed

**Solution**: Check cleanup timeout
```typescript
setTimeout(() => {
  marker.remove()
  delete markersRef.current[flight.id]
}, 60000) // Ensure this runs
```

## Future Enhancements

### 1. Adaptive Window Size
```typescript
// Adjust window based on longest flight
const maxFlightDuration = Math.max(...flights.map(f => f.transportTimeDays))
const windowDays = Math.ceil(maxFlightDuration) + 2
```

### 2. Priority System
```typescript
// Prioritize flights with more products
const sortedInstances = instances.sort((a, b) =>
  b.assignedProducts - a.assignedProducts
)
```

### 3. Real-time Updates
```typescript
// WebSocket for live flight updates
ws.on('flight-updated', (data) => {
  updateFlightInstance(data)
  addNewAnimationToTimeline(data)
})
```

## Summary

The rolling window system ensures:

🔄 **Continuous** - Flights animate across day boundaries without interruption

⏰ **Accurate** - Each flight has correct timing and duration

🧠 **Efficient** - Constant memory footprint, old data cleaned automatically

🎯 **Performant** - Limits active markers, removes completed animations

🌙 **Midnight-safe** - Handles 9 PM → 3 AM flights correctly

The key insight: **Think of the simulation as a continuous timeline, not discrete days**. The rolling window maintains just enough future data to ensure smooth operation.
