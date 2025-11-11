import { useState } from 'react'
import styled from 'styled-components'
import {
  uploadAirports,
  uploadFlights,
  uploadOrdersByDateRange,
  type ImportResultData,
} from '../../api'

const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
`

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  min-height: 600px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const Title = styled.h2`
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 24px;
  font-weight: 600;
`

const Description = styled.p`
  margin: 0 0 32px 0;
  color: #6b7280;
  font-size: 14px;
`

const UploadSection = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
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
  margin-bottom: 16px;
`

const UploadTitle = styled.h3`
  font-size: 16px;
  color: #111827;
  margin: 0;
  font-weight: 600;
`

const UploadButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${(p) => (p.$variant === 'primary' ? '#14b8a6' : '#d1d5db')};
  background: ${(p) => (p.$variant === 'primary' ? '#14b8a6' : 'white')};
  color: ${(p) => (p.$variant === 'primary' ? 'white' : '#374151')};

  &:hover {
    background: ${(p) => (p.$variant === 'primary' ? '#0d9488' : '#f3f4f6')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
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

export function DataPage() {
  const [airportsState, setAirportsState] = useState<UploadState>({ loading: false, result: null })
  const [flightsState, setFlightsState] = useState<UploadState>({ loading: false, result: null })
  const [ordersState, setOrdersState] = useState<UploadState>({ loading: false, result: null })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // === Airports ===
  const handleAirportsUpload = async () => {
    setAirportsState({ loading: true, result: null })
    try {
      const result = await uploadAirports()
      setAirportsState({ loading: false, result })
    } catch (e: any) {
      setAirportsState({
        loading: false,
        result: {
          success: false,
          message: e.response?.data?.message || 'Error al cargar aeropuertos',
          error: e.message,
        },
      })
    }
  }

  // === Flights ===
  const handleFlightsUpload = async () => {
    setFlightsState({ loading: true, result: null })
    try {
      const result = await uploadFlights()
      setFlightsState({ loading: false, result })
    } catch (e: any) {
      setFlightsState({
        loading: false,
        result: {
          success: false,
          message: e.response?.data?.message || 'Error al cargar vuelos',
          error: e.message,
        },
      })
    }
  }

  // === Orders ===
  const handleOrdersUpload = async () => {
    if (!startDate || !endDate) {
      alert('Debe seleccionar ambas fechas.')
      return
    }
    setOrdersState({ loading: true, result: null })
    try {
      const result = await uploadOrdersByDateRange(startDate.replaceAll('-', ''), endDate.replaceAll('-', ''))
      setOrdersState({ loading: false, result })
    } catch (e: any) {
      setOrdersState({
        loading: false,
        result: {
          success: false,
          message: e.response?.data?.message || 'Error al cargar pedidos',
          error: e.message,
        },
      })
    }
  }

  return (
    <Wrapper>
      <ContentPanel>
        <Title>Carga de Datos</Title>
        <Description>Actualiza la información almacenada en el backend.</Description>

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

        {/* === Orders === */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>📦 Pedidos y Productos</UploadTitle>
            <UploadButton
              $variant="primary"
              onClick={handleOrdersUpload}
              disabled={ordersState.loading}
            >
              {ordersState.loading ? 'Cargando...' : 'Cargar por Fechas'}
            </UploadButton>
          </UploadHeader>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
            <label>Desde:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label>Hasta:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {ordersState.result && (
            <Message $type={ordersState.result.success ? 'success' : 'error'}>
              <strong>{ordersState.result.success ? '✓ Éxito:' : '✗ Error:'}</strong>{' '}
              {ordersState.result.message}{' '}
              {ordersState.result.orders !== undefined && `(${ordersState.result.orders} pedidos)`}{' '}
              {ordersState.result.products !== undefined && `(${ordersState.result.products} productos)`}
            </Message>
          )}
        </UploadSection>
      </ContentPanel>
    </Wrapper>
  )
}
