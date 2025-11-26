# Daily Simulation - Implementation Guide

## Overview

The Daily Simulation feature allows you to run incremental simulations where the algorithm executes every 24 simulation hours. This implementation follows the backend workflow specified in `FRONTEND_WORKFLOW.md`.

## Architecture

### 1. State Management

**Location:** `src/store/useSimulationStore.ts`

Zustand store that manages:
- `simulationStartDate`: The T0 (time zero) for the simulation
- `isSimulationConfigured`: Boolean flag to check if configuration is valid
- Actions: `setSimulationStartDate`, `clearSimulationConfig`, `hasValidConfig`

### 2. API Services

**Location:** `src/api/simulationService.ts`

New service that provides:
- `executeDaily`: Execute daily algorithm (POST `/api/algorithm/daily`)
- `updateStates`: Update product states (POST `/api/simulation/update-states`)
- `getFlightStatuses`: Get all flights (GET `/api/query/flights/status`)
- `getFlightOrders`: Get orders per flight (GET `/api/query/flights/{code}/orders`)
- `loadOrders`: Load orders in time window (POST `/api/data/load-orders`)
- `resetDatabase`: Reset DB orders

### 3. Pages

#### Planificacion Page

**Location:** `src/pages/PlanificacionPage/PlanificacionPage.tsx`

Features:
- **Date/Time Picker**: HTML5 datetime-local input for setting simulation start time
- **Mode Selector**: Toggle between Semanal (loads 1-2 weeks) and Diario (realtime setup)
- **Confirm Button**: Saves the selected date to Zustand store
- **Reset Database Button**: Clears orders in the database (with confirmation dialog)
- **Navigation**: Direct link to Daily Simulation page
- **Validation**: Shows current configuration and validates before allowing navigation

**Flow:**
1. User selects date and time
2. Chooses mode:
   - **Semanal** → loads 1–2 weeks of orders via `/api/data/load-orders`
   - **Diario** → simply stores the timestamp and auto-navigates to the Daily Simulation page (no bulk load)
3. Optionally clicks "Resetear Base de Datos" → clears DB
4. Clicks the simulation shortcut (if not redirected automatically) → navigates to the selected simulator

#### Daily Simulation Page

**Location:** `src/pages/DailySimulationPage/DailySimulationPage.tsx`

Features:
- **Config Check Modal**: Blocks access if no date configured
- **Simulation Clock**: Displays current simulation time (1 real second = 1 simulation minute)
- **Map with Flights**: Shows airports and animated flights
- **Start/Pause/Stop Controls**: Control simulation execution
- **Realtime Rolling Window**: Runs `/api/algorithm/daily` every few simulated minutes (default 5) using a sliding window
- **Flight Animation**: Animated planes moving on curved routes (limited to 150 for performance)
- **Flight Details**: Click on flights to see orders/products

Realtime specifics:
- Window presets (5/15/30 min) determine `simulationDurationHours`.
- Clock scheduler triggers a new run whenever the elapsed simulated time exceeds the window size.
- Creating a new order dispatches `morapack:new-order-created`, forcing an immediate re-run (or queuing one if an execution is in progress).
- Flights departing before the current realtime cursor are ignored on the backend to avoid loading packages into planes already airborne.

**Flow:**
1. Page checks if configuration exists → shows modal if not
2. User clicks "Iniciar Simulación" → loads flights and airports
3. Executes first realtime window (default 5 min) starting at `simulationStartDate`
4. Starts simulation clock (1 real second = 1 simulation minute)
5. Every window interval → triggers the next `/api/algorithm/daily` call automatically
6. Additional runs are queued whenever a new order is inserted from Envíos
7. User can pause/stop simulation at any time

**Performance Optimizations:**
- Limited to 150 animated flights (from potentially 3000 total)
- Limited to 100 visible flight routes on map
- Marker updates throttled to 1 second intervals
- Cleanup of unused markers

### 4. Navigation

**Updated Files:**
- `src/routes/index.tsx`: Added routes for `/planificacion` and `/simulacion/diaria`
- `src/components/layout/Sidebar.tsx`: Added "Planificación" and "Simulación Diaria" menu items

## Usage Instructions

### For Users

1. **Configure Simulation**
   - Go to "Planificación" in the sidebar
   - Select a date and time for simulation start (T0)
   - Click "Confirmar Fecha"
   - Optionally reset the database

2. **Run Daily Simulation**
   - Go to "Simulación Diaria" in the sidebar
   - The page will show a modal if no configuration exists
   - Click "Iniciar Simulación" to start
   - Watch the clock progress (1 real second = 1 simulation minute)
   - The algorithm will run automatically every 24 simulation hours
   - Click on flights to see their orders/products

3. **Control Simulation**
   - **Pause**: Temporarily stop the simulation clock
   - **Stop**: Reset the simulation to initial state

### For Developers

#### Backend Requirements

The frontend expects these endpoints:

```typescript
// Daily algorithm execution
POST /api/algorithm/daily
Body: {
  simulationStartTime: string, // ISO 8601
  simulationDurationHours: number,
  useDatabase: boolean
}
Response: DailyAlgorithmResponse

// Update product states
POST /api/simulation/update-states
Body: {
  currentTime: string // ISO 8601
}
Response: UpdateStatesResponse

// Get all flight statuses
GET /api/query/flights/status
Response: FlightStatusResponse

// Get orders per flight
GET /api/query/flights/{flightCode}/orders
Response: FlightOrdersResponse

// Reset database (optional)
POST /api/data/reset-orders
Response: { success: boolean, message: string }
```

#### Adding New Features

To extend the Daily Simulation:

1. **Add new simulation controls**: Update `DailySimulationPage.tsx` controls section
2. **Change time scale**: Modify the interval in `startSimulationClock` (currently 60000ms = 1 min)
3. **Add more flight animations**: Increase `MAX_FLIGHTS_RENDERED` (with caution for performance)
4. **Customize algorithm triggers**: Modify the day counter logic in `startSimulationClock`

## Key Design Decisions

### 1. Minimal useEffect Usage

As requested, the implementation minimizes `useEffect` usage:
- Used `useRef` for intervals and cleanup
- Used `useCallback` for stable function references
- Event handlers are direct, not effect-based
- Component lifecycle managed through explicit setup/cleanup

### 2. Performance for 3000 Flights

To handle potentially 3000 flights:
- **Culling**: Only render top 150 flights by progress
- **Throttling**: Update markers every 1 second instead of every frame
- **Canvas Renderer**: Use Leaflet's canvas renderer for routes
- **Lazy Updates**: Only update markers when position changes significantly

### 3. State Management

- **Local state** for UI (isRunning, currentSimTime, etc.)
- **Zustand** for shared state (simulationStartDate)
- **React Query** for server state (airports, flights)

### 4. Time Simulation

- 1 real second = 1 simulation minute (configurable)
- Algorithm runs every 24 simulation hours = 1440 simulation minutes = 1440 real seconds = 24 real minutes
- Can be adjusted by changing the interval calculation

## Troubleshooting

### Modal "Please go to planificacion" appears

**Solution**: Go to Planificación page and configure a date/time first

### Flights not animating

**Possible causes:**
1. No flights loaded from backend → Check backend `/api/query/flights/status`
2. No airports loaded → Check backend `/api/data-import/airports`
3. Simulation not started → Click "Iniciar Simulación"

### Algorithm not running automatically

**Possible causes:**
1. Simulation clock not running → Check if status is "Ejecutando"
2. Backend endpoint failing → Check browser console for errors
3. Day counter not incrementing → Check `dayCount` in simulation controls

### Performance issues

**Solutions:**
1. Reduce `MAX_FLIGHTS_RENDERED` in `DailySimulationPage.tsx` (currently 150)
2. Increase marker update throttle (currently 1000ms)
3. Reduce flight route samples (currently 20)

## Testing Checklist

- [ ] Can configure date in Planificación page
- [ ] Modal blocks access if no configuration
- [ ] Simulation clock starts and progresses
- [ ] Algorithm runs on first start (Day 0)
- [ ] Algorithm runs automatically on Day 1, 2, etc.
- [ ] Flights animate on the map
- [ ] Can click on flights to see details
- [ ] Can pause and resume simulation
- [ ] Can stop and reset simulation
- [ ] Reset database button works with confirmation

## Future Enhancements

1. **Adjustable time scale**: Allow user to change simulation speed
2. **Save/Load simulation state**: Persist simulation progress
3. **Real-time flight status updates**: Use WebSocket instead of polling
4. **Advanced visualization**: Add flight paths, capacity heatmaps
5. **Statistics dashboard**: Show more detailed metrics during simulation
6. **Export simulation results**: Download CSV/JSON of simulation data

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend endpoints are working
3. Check `FRONTEND_WORKFLOW.md` for backend specification
4. Review this guide for common issues
