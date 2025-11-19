import { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  uploadAirports,
  uploadFlights,
  getDataStatus,
  clearOrders,
  type ImportResultData,
} from '../../api'
import { toast } from 'react-toastify'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
`

const Title = styled.h2`
  margin: 0 0 16px 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
`

const Description = styled.p`
  margin: 0 0 28px 0;
  color: #6b7280;
  font-size: 14px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
`

const StatCard = styled.div`
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
`

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const UploadSection = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.2s;

  &:hover {
    border-color: #14b8a6;
    background: #f0fdfa;
  }
`

const UploadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`

const UploadTitle = styled.h3`
  font-size: 15px;
  color: #111827;
  margin: 0;
  font-weight: 600;
`

const UploadButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${(p) => (p.$variant === 'primary' ? '#14b8a6' : '#f3f4f6')};
  color: ${(p) => (p.$variant === 'primary' ? 'white' : '#374151')};
  white-space: nowrap;

  &:hover {
    background: ${(p) => (p.$variant === 'primary' ? '#0d9488' : '#e5e7eb')};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: ${(p) => {
    if (p.$type === 'success') return '#d1fae5'
    if (p.$type === 'error') return '#fee2e2'
    return '#dbeafe'
  }};
  color: ${(p) => {
    if (p.$type === 'success') return '#065f46'
    if (p.$type === 'error') return '#991b1b'
    return '#1e3a8a'
  }};
  border: 1px solid
    ${(p) => {
      if (p.$type === 'success') return '#6ee7b7'
      if (p.$type === 'error') return '#fca5a5'
      return '#93c5fd'
    }};
`

interface UploadState {
  loading: boolean
  result: ImportResultData | null
}

interface DataStats {
  airports: number
  flights: number
  orders: number
  loading: boolean
}

export function DataPage() {
  const [airportsState, setAirportsState] = useState<UploadState>({ loading: false, result: null })
  const [flightsState, setFlightsState] = useState<UploadState>({ loading: false, result: null })
  const [clearState, setClearState] = useState<UploadState>({ loading: false, result: null })
  const [stats, setStats] = useState<DataStats>({ airports: 0, flights: 0, orders: 0, loading: true })

  // Load initial data statistics
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setStats((s) => ({ ...s, loading: true }))
      const response = await getDataStatus()
      if (response.success && response.statistics) {
        setStats({
          airports: response.statistics.airports,
          flights: response.statistics.flights,
          orders: response.statistics.orders,
          loading: false,
        })
      } else {
        setStats({ airports: 0, flights: 0, orders: 0, loading: false })
      }
    } catch (e) {
      console.error('Error loading data statistics:', e)
      setStats({ airports: 0, flights: 0, orders: 0, loading: false })
    }
  }

  // === Airports ===
  const handleAirportsUpload = async () => {
    setAirportsState({ loading: true, result: null })
    try {
      const result = await uploadAirports()
      setAirportsState({ loading: false, result })

      if (result.success) {
        // usa los campos que realmente devuelva tu back (count, cities, etc.)
        const count = (result as any).count ?? 0
        const cities = (result as any).cities ?? 0
        toast.success(`Aeropuertos cargados (${count} aeropuertos, ${cities} ciudades)`)
        // Reload statistics
        await loadStats()
      } else {
        toast.error(result.message || 'Error al cargar aeropuertos')
      }
    } catch (e: any) {
      const message = e.response?.data?.message || 'Error al cargar aeropuertos'
      setAirportsState({
        loading: false,
        result: {
          success: false,
          message,
          error: e.message,
        },
      })
      toast.error(message)
    }
  }

  // === Flights ===
  const handleFlightsUpload = async () => {
    setFlightsState({ loading: true, result: null })
    try {
      const result = await uploadFlights()
      setFlightsState({ loading: false, result })

      if (result.success) {
        const count = (result as any).count ?? 0
        toast.success(`Vuelos cargados (${count} vuelos)`)
        // Reload statistics
        await loadStats()
      } else {
        toast.error(result.message || 'Error al cargar vuelos')
      }
    } catch (e: any) {
      const message = e.response?.data?.message || 'Error al cargar vuelos'
      setFlightsState({
        loading: false,
        result: {
          success: false,
          message,
          error: e.message,
        },
      })
      toast.error(message)
    }
  }

  // === Clear Data ===
  const handleClearData = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar todos los pedidos y productos? Esta acción no se puede deshacer.')) {
      return
    }

    setClearState({ loading: true, result: null })
    try {
      const result = await clearOrders()
      setClearState({ loading: false, result })

      if (result.success) {
        toast.success('Base de datos limpiada correctamente')
        await loadStats()
      } else {
        toast.error(result.message || 'Error al limpiar datos')
      }
    } catch (e: any) {
      const message = e.response?.data?.message || 'Error al limpiar datos'
      setClearState({
        loading: false,
        result: {
          success: false,
          message,
          error: e.message,
        },
      })
      toast.error(message)
    }
  }

  return (
    <Wrapper>
      <ContentPanel>
        <Title>Carga de Datos</Title>
        <Description>Actualiza la información almacenada en el backend.</Description>

        {/* === Statistics === */}
        <StatsGrid>
          <StatCard>
            <StatValue>{stats.loading ? '...' : stats.airports.toLocaleString()}</StatValue>
            <StatLabel>Aeropuertos</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.loading ? '...' : stats.flights.toLocaleString()}</StatValue>
            <StatLabel>Vuelos</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.loading ? '...' : stats.orders.toLocaleString()}</StatValue>
            <StatLabel>Órdenes</StatLabel>
          </StatCard>
        </StatsGrid>

        {/* === Airports === */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>📍 Aeropuertos</UploadTitle>
            <UploadButton
              $variant="primary"
              onClick={handleAirportsUpload}
              disabled={airportsState.loading}
            >
              {airportsState.loading ? 'Cargando...' : 'Actualizar Aeropuertos'}
            </UploadButton>
          </UploadHeader>
          {airportsState.result && (
            <Message $type={airportsState.result.success ? 'success' : 'error'}>
              {airportsState.result.message}
            </Message>
          )}
        </UploadSection>

        {/* === Flights === */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>✈️ Vuelos</UploadTitle>
            <UploadButton
              $variant="primary"
              onClick={handleFlightsUpload}
              disabled={flightsState.loading}
            >
              {flightsState.loading ? 'Cargando...' : 'Actualizar Vuelos'}
            </UploadButton>
          </UploadHeader>
          {flightsState.result && (
            <Message $type={flightsState.result.success ? 'success' : 'error'}>
              {flightsState.result.message}
            </Message>
          )}
        </UploadSection>

        {/* === Clear Data === */}
        <UploadSection style={{ borderColor: '#fca5a5', background: '#fff1f2' }}>
          <UploadHeader>
            <UploadTitle style={{ color: '#991b1b' }}>🗑️ Limpiar Base de Datos</UploadTitle>
            <UploadButton
              $variant="secondary"
              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
              onClick={handleClearData}
              disabled={clearState.loading}
            >
              {clearState.loading ? 'Limpiando...' : 'Eliminar Pedidos y Productos'}
            </UploadButton>
          </UploadHeader>
          {clearState.result && (
            <Message $type={clearState.result.success ? 'success' : 'error'}>
              {clearState.result.message}
            </Message>
          )}
        </UploadSection>
      </ContentPanel>
    </Wrapper>
  )
}
