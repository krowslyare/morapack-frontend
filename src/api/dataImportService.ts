import { api } from './client'

export interface ImportResultData {
  success: boolean
  message: string
  count?: number
  orders?: number
  products?: number
  cities?: number
  error?: string
}

/**
 * Upload and import airports from a text file
 * @param file - Text file with airport data (same format as airportInfo.txt)
 * @returns Import result with success status and count
 */
export async function uploadAirports(file: File): Promise<ImportResultData> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ImportResultData>('/data-import/airports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Upload and import flights from a text file
 * @param file - Text file with flight data (same format as flights.txt)
 * Expected format: ORIGIN-DESTINATION-DEPARTURE-ARRIVAL-CAPACITY
 * @returns Import result with success status and count
 */
export async function uploadFlights(file: File): Promise<ImportResultData> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ImportResultData>('/data-import/flights', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
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
 * Get import service status
 * @returns Service status information
 */
export async function getImportStatus(): Promise<{
  message: string
  endpoints: Record<string, string>
}> {
  const response = await api.get('/data-import/status')
  return response.data
}
