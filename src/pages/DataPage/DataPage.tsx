import { useState, useRef } from 'react'
import styled from 'styled-components'
import { uploadAirports, uploadFlights, uploadOrders, type ImportResultData } from '../../api'

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

const UploadDescription = styled.p`
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 13px;
`

const HiddenInput = styled.input`
  display: none;
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

const SelectedFile = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`

const FormatInfo = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-left: 3px solid #14b8a6;
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
`

interface UploadState {
  file: File | null
  loading: boolean
  result: ImportResultData | null
}

export function DataPage() {
  const [airportsState, setAirportsState] = useState<UploadState>({
    file: null,
    loading: false,
    result: null,
  })

  const [flightsState, setFlightsState] = useState<UploadState>({
    file: null,
    loading: false,
    result: null,
  })

  const [ordersState, setOrdersState] = useState<UploadState>({
    file: null,
    loading: false,
    result: null,
  })

  const airportsInputRef = useRef<HTMLInputElement>(null)
  const flightsInputRef = useRef<HTMLInputElement>(null)
  const ordersInputRef = useRef<HTMLInputElement>(null)

  // Airports handlers
  const handleAirportsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAirportsState({ file: e.target.files[0], loading: false, result: null })
    }
  }

  const handleAirportsUpload = async () => {
    if (!airportsState.file) return

    setAirportsState((prev) => ({ ...prev, loading: true, result: null }))

    try {
      const result = await uploadAirports(airportsState.file)
      setAirportsState((prev) => ({ ...prev, loading: false, result }))

      // Clear file if successful
      if (result.success) {
        setTimeout(() => {
          setAirportsState({ file: null, loading: false, result: null })
          if (airportsInputRef.current) airportsInputRef.current.value = ''
        }, 3000)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      setAirportsState((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: err.response?.data?.message || 'Error al cargar aeropuertos',
          error: err.message,
        },
      }))
    }
  }

  // Flights handlers
  const handleFlightsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFlightsState({ file: e.target.files[0], loading: false, result: null })
    }
  }

  const handleFlightsUpload = async () => {
    if (!flightsState.file) return

    setFlightsState((prev) => ({ ...prev, loading: true, result: null }))

    try {
      const result = await uploadFlights(flightsState.file)
      setFlightsState((prev) => ({ ...prev, loading: false, result }))

      if (result.success) {
        setTimeout(() => {
          setFlightsState({ file: null, loading: false, result: null })
          if (flightsInputRef.current) flightsInputRef.current.value = ''
        }, 3000)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      setFlightsState((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: err.response?.data?.message || 'Error al cargar vuelos',
          error: err.message,
        },
      }))
    }
  }

  // Orders handlers
  const handleOrdersFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOrdersState({ file: e.target.files[0], loading: false, result: null })
    }
  }

  const handleOrdersUpload = async () => {
    if (!ordersState.file) return

    setOrdersState((prev) => ({ ...prev, loading: true, result: null }))

    try {
      const result = await uploadOrders(ordersState.file)
      setOrdersState((prev) => ({ ...prev, loading: false, result }))

      if (result.success) {
        setTimeout(() => {
          setOrdersState({ file: null, loading: false, result: null })
          if (ordersInputRef.current) ordersInputRef.current.value = ''
        }, 3000)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      setOrdersState((prev) => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: err.response?.data?.message || 'Error al cargar pedidos',
          error: err.message,
        },
      }))
    }
  }

  return (
    <Wrapper>
      <ContentPanel>
        <Title>Carga de Datos</Title>
        <Description>
          Importe datos desde archivos de texto (.txt) a la base de datos. Asegúrese de seguir el
          formato correcto para cada tipo de dato.
        </Description>

        {/* Airports Upload Section */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>📍 Aeropuertos</UploadTitle>
            <ButtonGroup>
              <UploadButton
                onClick={() => airportsInputRef.current?.click()}
                disabled={airportsState.loading}
              >
                Seleccionar Archivo
              </UploadButton>
              <UploadButton
                $variant="primary"
                onClick={handleAirportsUpload}
                disabled={!airportsState.file || airportsState.loading}
              >
                {airportsState.loading ? 'Cargando...' : 'Cargar Aeropuertos'}
              </UploadButton>
            </ButtonGroup>
          </UploadHeader>

          <UploadDescription>Formato requerido: Mismo que airportInfo.txt</UploadDescription>

          <FormatInfo>
            ID CodeIATA City Country Alias Timezone Capacity Latitude: X.XXXX Longitude: Y.YYYY
          </FormatInfo>

          <HiddenInput
            ref={airportsInputRef}
            type="file"
            accept=".txt"
            onChange={handleAirportsFileSelect}
          />

          {airportsState.file && (
            <SelectedFile>
              <span>📄 {airportsState.file.name}</span>
              <span>{(airportsState.file.size / 1024).toFixed(2)} KB</span>
            </SelectedFile>
          )}

          {airportsState.result && (
            <Message $type={airportsState.result.success ? 'success' : 'error'}>
              <strong>{airportsState.result.success ? '✓ Éxito:' : '✗ Error:'}</strong>{' '}
              {airportsState.result.message}
              {airportsState.result.count !== undefined &&
                ` (${airportsState.result.count} aeropuertos)`}
              {airportsState.result.cities !== undefined &&
                ` (${airportsState.result.cities} ciudades)`}
            </Message>
          )}
        </UploadSection>

        {/* Flights Upload Section */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>✈️ Vuelos</UploadTitle>
            <ButtonGroup>
              <UploadButton
                onClick={() => flightsInputRef.current?.click()}
                disabled={flightsState.loading}
              >
                Seleccionar Archivo
              </UploadButton>
              <UploadButton
                $variant="primary"
                onClick={handleFlightsUpload}
                disabled={!flightsState.file || flightsState.loading}
              >
                {flightsState.loading ? 'Cargando...' : 'Cargar Vuelos'}
              </UploadButton>
            </ButtonGroup>
          </UploadHeader>

          <UploadDescription>
            Formato requerido: Mismo que flights.txt (requiere aeropuertos previamente cargados)
          </UploadDescription>

          <FormatInfo>
            ORIGIN-DESTINATION-DEPARTURE-ARRIVAL-CAPACITY
            <br />
            Ejemplo: BOG-UIO-0830-1045-250
          </FormatInfo>

          <HiddenInput
            ref={flightsInputRef}
            type="file"
            accept=".txt"
            onChange={handleFlightsFileSelect}
          />

          {flightsState.file && (
            <SelectedFile>
              <span>📄 {flightsState.file.name}</span>
              <span>{(flightsState.file.size / 1024).toFixed(2)} KB</span>
            </SelectedFile>
          )}

          {flightsState.result && (
            <Message $type={flightsState.result.success ? 'success' : 'error'}>
              <strong>{flightsState.result.success ? '✓ Éxito:' : '✗ Error:'}</strong>{' '}
              {flightsState.result.message}
              {flightsState.result.count !== undefined && ` (${flightsState.result.count} vuelos)`}
            </Message>
          )}
        </UploadSection>

        {/* Orders Upload Section */}
        <UploadSection>
          <UploadHeader>
            <UploadTitle>📦 Pedidos y Productos</UploadTitle>
            <ButtonGroup>
              <UploadButton
                onClick={() => ordersInputRef.current?.click()}
                disabled={ordersState.loading}
              >
                Seleccionar Archivo
              </UploadButton>
              <UploadButton
                $variant="primary"
                onClick={handleOrdersUpload}
                disabled={!ordersState.file || ordersState.loading}
              >
                {ordersState.loading ? 'Cargando...' : 'Cargar Pedidos'}
              </UploadButton>
            </ButtonGroup>
          </UploadHeader>

          <UploadDescription>
            Formato requerido: Mismo que products.txt (requiere aeropuertos previamente cargados)
          </UploadDescription>

          <FormatInfo>
            dd hh mm dest ### IdClien
            <br />
            dd: días de prioridad (01/04/12/24)
            <br />
            hh: hora (01-23), mm: minuto (01-59)
            <br />
            dest: código aeropuerto, ###: cantidad productos, IdClien: ID cliente
            <br />
            Ejemplo: 01 10 30 BOG 005 1234567
          </FormatInfo>

          <HiddenInput
            ref={ordersInputRef}
            type="file"
            accept=".txt"
            onChange={handleOrdersFileSelect}
          />

          {ordersState.file && (
            <SelectedFile>
              <span>📄 {ordersState.file.name}</span>
              <span>{(ordersState.file.size / 1024).toFixed(2)} KB</span>
            </SelectedFile>
          )}

          {ordersState.result && (
            <Message $type={ordersState.result.success ? 'success' : 'error'}>
              <strong>{ordersState.result.success ? '✓ Éxito:' : '✗ Error:'}</strong>{' '}
              {ordersState.result.message}
              {ordersState.result.orders !== undefined && ` (${ordersState.result.orders} pedidos)`}
              {ordersState.result.products !== undefined &&
                ` (${ordersState.result.products} productos)`}
            </Message>
          )}
        </UploadSection>

        <Message $type="info">
          <strong>ℹ️ Importante:</strong> Los archivos deben seguir exactamente el mismo formato que
          los archivos de ejemplo en /data/. Cargue los aeropuertos primero, luego los vuelos, y
          finalmente los pedidos.
        </Message>
      </ContentPanel>
    </Wrapper>
  )
}
