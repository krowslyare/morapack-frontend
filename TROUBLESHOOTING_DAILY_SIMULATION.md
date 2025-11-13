# Troubleshooting Daily Simulation - API Data Issues

## Recent Errors Fixed

### Error 1: "undefined is not an object (evaluating 'flights.forEach')"
**Location:** `src/api/simulationService.ts` - `generateFlightInstances()`

**Root Cause:** API response did not contain a valid `flights` array.

**Fix Applied:**
```typescript
// Added validation in generateFlightInstances()
if (!flights || !Array.isArray(flights) || flights.length === 0) {
  console.warn('No flights provided to generateFlightInstances')
  return []
}
```

### Error 2: "undefined is not an object (evaluating 'flightStatusesRef.current.length')"
**Location:** `src/pages/DailySimulationPage/DailySimulationPage.tsx` - `addNextDayInstances()`

**Root Cause:** `flightStatusesRef.current` was undefined after failed API call.

**Fix Applied:**
```typescript
// Ensure ref is never undefined in loadFlightData()
catch (error) {
  console.error('Error loading flight data:', error)
  toast.error('Error al cargar vuelos')
  flightStatusesRef.current = [] // Never leave undefined
}

// Added robust validation in addNextDayInstances()
if (!flightStatusesRef.current || !Array.isArray(flightStatusesRef.current) ||
    flightStatusesRef.current.length === 0) {
  console.warn('Cannot add instances: no flight statuses available')
  return
}
```

## Expected API Response Format

### GET `/api/query/flights/status`

**Expected Response:**
```json
{
  "success": true,
  "totalFlights": 150,
  "flights": [
    {
      "id": 1,
      "code": "LIM-CUZ",
      "originAirport": {
        "codeIATA": "LIM",
        "city": { "name": "Lima" },
        "latitude": -12.0219,
        "longitude": -77.1143
      },
      "destinationAirport": {
        "codeIATA": "CUZ",
        "city": { "name": "Cusco" },
        "latitude": -13.5352,
        "longitude": -71.9387
      },
      "maxCapacity": 1000,
      "usedCapacity": 750,
      "availableCapacity": 250,
      "transportTimeDays": 0.5,
      "dailyFrequency": 2,
      "utilizationPercentage": 75.0,
      "assignedProducts": 500,
      "assignedOrders": 25
    }
  ],
  "statistics": {
    "totalCapacity": 150000,
    "totalUsedCapacity": 112500,
    "averageUtilization": 75.0
  }
}
```

**Critical Fields:**
- `flights` - Must be an array
- Each flight must have:
  - `id` (number)
  - `code` (string)
  - `originAirport` with `city.name`, `latitude`, `longitude`
  - `destinationAirport` with `city.name`, `latitude`, `longitude`
  - `transportTimeDays` (number)
  - `dailyFrequency` (number)

### POST `/api/algorithm/daily`

**Request Body:**
```json
{
  "simulationStartTime": "2025-01-02T00:00:00.000Z",
  "simulationDurationHours": 24,
  "useDatabase": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Algorithm executed successfully",
  "executionStartTime": "2025-01-02T00:00:00.000Z",
  "executionEndTime": "2025-01-02T00:05:30.000Z",
  "executionTimeSeconds": 330,
  "simulationStartTime": "2025-01-02T00:00:00.000Z",
  "simulationEndTime": "2025-01-03T00:00:00.000Z",
  "totalOrders": 1000,
  "assignedOrders": 850,
  "unassignedOrders": 150,
  "totalProducts": 5000,
  "assignedProducts": 4250,
  "unassignedProducts": 750,
  "score": 0.85,
  "productRoutes": null
}
```

## Debugging Steps

### Step 1: Check Backend API Availability

Open browser DevTools (F12) → Network tab → Start simulation

**Look for:**
- `GET /api/query/flights/status` - Should return 200 OK
- `POST /api/algorithm/daily` - Should return 200 OK

**If 404:** Backend endpoints may not be deployed
**If 500:** Backend may have errors (check backend logs)
**If CORS error:** Backend CORS configuration issue

### Step 2: Inspect API Response Structure

In browser console, check the actual response:
```javascript
fetch('/api/query/flights/status')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
```

**Verify:**
- Response has `flights` property
- `flights` is an array
- Array has items
- Each item has required fields (id, code, originAirport, etc.)

### Step 3: Check Console Logs

The frontend now logs extensively. Look for:

```
✅ Good logs:
- "Loading flight statuses from backend..."
- "Received 150 flight statuses from backend"
- "Generated 3000 flight instances for 3 days"

❌ Error logs:
- "getFlightStatuses returned null/undefined"
- "getFlightStatuses returned invalid flights:"
- "No airports loaded yet, cannot generate instances"
- "Cannot add instances: no flight statuses available"
```

### Step 4: Verify Airport Data

Airports must be loaded before flights can be animated:

```javascript
// In console
localStorage.getItem('airport-data')
```

**If null:** Run the data import process first
**If exists:** Should have array with `latitude`, `longitude`, `codeIATA`, `cityName`

### Step 5: Check Simulation Store

```javascript
// In console
JSON.parse(localStorage.getItem('simulation-store'))
```

**Should show:**
```json
{
  "state": {
    "simulationStartDate": "2025-01-02T00:00:00.000Z",
    "isSimulationConfigured": true
  }
}
```

## Common Issues and Solutions

### Issue: "No se generaron instancias de vuelo"

**Possible Causes:**
1. No flights in backend database
2. Airport data not matching flight data (city names don't match)
3. Invalid flight data structure

**Solutions:**
1. Check backend has flight data: Query flights table in database
2. Verify airport city names match flight city names exactly
3. Check `transportTimeDays` and `dailyFrequency` are valid numbers

### Issue: Flights load but don't animate

**Possible Causes:**
1. Simulation clock not running
2. Flight departure times are in the past
3. GSAP timeline not initialized

**Solutions:**
1. Check "Estado" badge shows "Ejecutando" (not "Detenido")
2. Verify simulation time progresses (clock updates)
3. Check browser console for GSAP errors

### Issue: Algorithm execution fails

**Possible Causes:**
1. Backend algorithm endpoint timeout (> 90 min)
2. Database connection lost
3. Invalid input data

**Solutions:**
1. Check backend logs for algorithm execution errors
2. Verify database is accessible
3. Ensure simulation start time is valid ISO 8601 format

### Issue: Memory/Performance problems

**Symptoms:**
- Browser tab becomes unresponsive
- Animations stutter
- Console shows "Maximum call stack exceeded"

**Solutions:**
1. Reduce `MAX_FLIGHTS` in DailySimulationPage.tsx (currently 200)
2. Reduce number of visible routes (currently 100)
3. Increase marker cleanup timeout (currently 60 seconds)

## Testing Backend Endpoints

### Test Flight Status Endpoint

```bash
# Using curl
curl -X GET http://localhost:3000/api/query/flights/status

# Expected: JSON with flights array
```

### Test Daily Algorithm Endpoint

```bash
# Using curl
curl -X POST http://localhost:3000/api/algorithm/daily \
  -H "Content-Type: application/json" \
  -d '{
    "simulationStartTime": "2025-01-02T00:00:00.000Z",
    "simulationDurationHours": 24,
    "useDatabase": true
  }'

# Expected: JSON with success: true and statistics
```

### Test Data Import

```bash
# Check if airports are imported
curl -X GET http://localhost:3000/api/data-import/airports

# Check if flights are configured
curl -X GET http://localhost:3000/api/flights
```

## What to Check in Backend

### 1. Database State

**Verify tables exist:**
- `airports` - Should have ~30+ rows (Lima, Cusco, Brussels, etc.)
- `flights` - Should have ~100+ rows with valid routes
- `orders` - Should have data for simulation start date
- `products` - Should have products linked to orders

**Check data integrity:**
```sql
-- Check if flights reference valid airports
SELECT f.id, f.code, o.code_iata as origin, d.code_iata as dest
FROM flights f
LEFT JOIN airports o ON f.origin_airport_id = o.id
LEFT JOIN airports d ON f.destination_airport_id = d.id
WHERE o.id IS NULL OR d.id IS NULL;
-- Should return 0 rows
```

### 2. Backend Logs

**Look for:**
- Algorithm execution start/end logs
- Database query errors
- Memory errors (if algorithm takes too long)

### 3. Environment Variables

**Verify:**
- Database connection string is correct
- Timeout configurations (should be >= 90 minutes for algorithm)
- CORS settings allow frontend origin

## Next Steps

If errors persist after applying these fixes:

1. **Capture full API response:**
   - Open DevTools → Network tab
   - Find `flights/status` request
   - Copy response body
   - Share with team for analysis

2. **Enable verbose logging:**
   - Backend: Set log level to DEBUG
   - Frontend: All console.logs are already in place

3. **Test with minimal data:**
   - Try with just 5-10 flights
   - Verify those work before scaling up

4. **Check browser compatibility:**
   - Ensure modern browser (Chrome 90+, Firefox 88+, Safari 14+)
   - GSAP requires modern JS features

## Summary of Validations Added

### Frontend (src/pages/DailySimulationPage/DailySimulationPage.tsx)

✅ `loadFlightData()`:
- Validates API response is not null/undefined
- Validates `flights` is an array
- Ensures `flightStatusesRef.current` never undefined
- Checks airports are loaded
- Warns if no instances generated

✅ `runDailyAlgorithm()`:
- Validates algorithm response
- Validates flight reload response
- Handles partial failures gracefully

✅ `addNextDayInstances()`:
- Validates simulation start date
- Validates flight statuses array
- Validates airports array

### Backend (src/api/simulationService.ts)

✅ `generateFlightInstances()`:
- Validates flights array
- Validates airports array
- Returns empty array instead of crashing

✅ `addNextDayInstances()`:
- Validates flights array
- Validates currentInstances array
- Returns safe defaults

## Contact Points

If you continue experiencing issues:

1. Check `DAILY_SIMULATION_GUIDE.md` for architecture overview
2. Check `GSAP_ANIMATION_GUIDE.md` for animation details
3. Check `ROLLING_WINDOW_SYSTEM.md` for instance management
4. Review backend `FRONTEND_WORKFLOW.md` for API spec
