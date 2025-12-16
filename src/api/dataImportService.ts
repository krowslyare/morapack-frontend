import { api, apiLongRunning } from './client'

export interface ImportResultData {
  success: boolean
  message: string
  count?: number
  orders?: number
  products?: number
  cities?: number
  error?: string
  statistics?: {
    ordersLoaded: number;
    ordersCreated: number;
    ordersFiltered: number;
    customersCreated: number;
    durationSeconds: number;
    fileErrors: number;
    parseErrors: number;
  }
}

/**
 * Upload and import airports from a text file
 * @param file - Text file with airport data (same format as airportInfo.txt)
 * @returns Import result with success status and count
 */
export async function uploadAirports(): Promise<ImportResultData> {
  const res = await api.post<ImportResultData>('/data-import/airports')
  return res.data
}

/**
 * Upload and import flights from a text file
 * @param file - Text file with flight data (same format as flights.txt)
 * Expected format: ORIGIN-DESTINATION-DEPARTURE-ARRIVAL-CAPACITY
 * @returns Import result with success status and count
 */
export async function uploadFlights(): Promise<ImportResultData> {
  const res = await api.post<ImportResultData>('/data-import/flights')
  return res.data
}

/**
 * Upload and import orders/products from a text file
 * @param file - Text file with order/product data (same format as products.txt)
 * Expected format: dd hh mm dest ### IdClien
 * @returns Import result with success status, orders count, and products count
 */
export async function uploadOrders(file: File): Promise<ImportResultData> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ImportResultData>('/data-import/orders', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Get data status (count of airports, flights, orders in database)
 * @returns Data status with counts
 */
export async function getDataStatus(): Promise<{
  success: boolean
  message: string
  statistics: {
    airports: number
    flights: number
    orders: number
  }
}> {
  const response = await api.get('/data/status')
  return response.data
}

export async function uploadOrdersByDateRange(
  startTime: string,
  endTime: string
): Promise<ImportResultData> {
  // ✅ Usar el mismo endpoint que Python
  const result = await api.post(
    '/data/load-orders',
    null,
    {
      params: {
        startTime,
        endTime
      },
      timeout: 10 * 60 * 1000
    }
  )
  return result.data
}

/**
 * Clear all orders and products from database
 */
export async function clearOrders(): Promise<ImportResultData> {
  // Use apiLongRunning to handle large dataset deletions (prevents 30s timeout)
  const response = await apiLongRunning.delete('/orders/all')
  return response.data
}