import { useEffect } from 'react'
import styled from 'styled-components'
import { useDataStore } from '../../store/useDataStore'

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

const SectionLabel = styled.label`
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  margin-top: 24px;
`

const VersionInput = styled.input`
  width: 100%;
  max-width: 350px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  
  &:focus {
    outline: none;
    border-color: #14b8a6;
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${p => p.$variant === 'primary' ? '#14b8a6' : '#d1d5db'};
  background: ${p => p.$variant === 'primary' ? '#14b8a6' : 'white'};
  color: ${p => p.$variant === 'primary' ? 'white' : '#374151'};

  &:hover {
    background: ${p => p.$variant === 'primary' ? '#0d9488' : '#f3f4f6'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SectionTitle = styled.h3`
  font-size: 16px;
  color: #111827;
  margin: 24px 0 16px 0;
  font-weight: 600;
`

const DatasetCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  background: white;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`

const CardTitle = styled.h4`
  font-size: 16px;
  color: #111827;
  margin: 0;
  font-weight: 600;
`

const CardMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
`

const CardActions = styled.div`
  display: flex;
  gap: 8px;
`

const SmallButton = styled.button`
  padding: 6px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`

const CardFooter = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
`

const ProgressFill = styled.div<{ $percentage: number }>`
  width: ${p => p.$percentage}%;
  height: 100%;
  background: #14b8a6;
  transition: width 0.3s;
`

const ProgressLabel = styled.div`
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`

const SummarySection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
  margin-top: 16px;
`

const SummaryItem = styled.div`
  text-align: center;
`

const SummaryLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
`

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`

interface Dataset {
  id: string;
  name: string;
  records: number;
  version: string;
  lastUpdate: string;
  progress?: number;
}

export function DataPage() {
  const { datasets, datasetVersion, setDatasetVersion, setDatasets } = useDataStore()

  useEffect(() => {
    // Inicializar datasets si es necesario
    if (datasets.length === 0) {
      setDatasets([
    {
      id: '1',
      name: 'Vuelos',
      records: 1275,
      version: 'v2',
      lastUpdate: '2024-08-24 14:30'
    },
    {
      id: '2',
      name: 'Aeropuertos Globales',
      records: 45,
      version: 'v2',
      lastUpdate: '2024-08-24 14:30'
    },
    {
      id: '3',
      name: 'Pedidos Históricos Q2',
      records: 8934,
      version: 'v1.0',
      lastUpdate: '2024-08-24 14:30',
      progress: 89
    },
    {
      id: '4',
      name: 'Paquetes MPE',
      records: 0,
      version: 'v0',
      lastUpdate: '2024-08-24 14:30'
    }
      ])
    }
  }, [datasets.length, setDatasets])

  const totalSets = datasets.length
  const totalRecords = datasets.reduce((sum, ds) => sum + ds.records, 0)
  const readyCount = datasets.filter(ds => ds.records > 0).length
  const errorCount = datasets.filter(ds => ds.records === 0).length

  return (
    <Wrapper>
      <ContentPanel>
        <Title>Carga de Datos</Title>
        
        <SectionLabel>Versión de Dataset a Utilizar</SectionLabel>
        <VersionInput 
          type="text" 
          value={datasetVersion}
          onChange={(e) => setDatasetVersion(e.target.value)}
          placeholder="Dataset V2 - 25/08/25"
        />

        <ActionButtons>
          <Button $variant="primary">Importar CSV</Button>
          <Button $variant="secondary">Descargar Plantilla</Button>
          <Button $variant="secondary">Validar Esquemas</Button>
          <Button $variant="secondary">Datos Ejemplo</Button>
        </ActionButtons>

        <SectionTitle>Conjunto de Datos Disponibles</SectionTitle>

        {datasets.map(dataset => (
          <DatasetCard key={dataset.id}>
            <CardHeader>
              <div>
                <CardTitle>{dataset.name}</CardTitle>
                <CardMeta>
                  {dataset.records.toLocaleString()} registros • {dataset.version}
                </CardMeta>
              </div>
              <CardActions>
                <SmallButton>Ver Detalles</SmallButton>
                <SmallButton>Recargar</SmallButton>
              </CardActions>
            </CardHeader>
            
            {dataset.progress !== undefined && (
              <>
                <ProgressBar>
                  <ProgressFill $percentage={dataset.progress} />
                </ProgressBar>
                <ProgressLabel>{dataset.progress}%</ProgressLabel>
              </>
            )}
            
            <CardFooter>
              Última actualización: {dataset.lastUpdate}
            </CardFooter>
          </DatasetCard>
        ))}

        <SummarySection>
          <SectionTitle>Resumen de Importación</SectionTitle>
          <SummaryGrid>
            <SummaryItem>
              <SummaryLabel>Total conjuntos:</SummaryLabel>
              <SummaryValue>{totalSets}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Registros Totales:</SummaryLabel>
              <SummaryValue>{totalRecords.toLocaleString()}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Listos:</SummaryLabel>
              <SummaryValue style={{ color: '#059669' }}>{readyCount}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Errores:</SummaryLabel>
              <SummaryValue style={{ color: '#dc2626' }}>{errorCount}</SummaryValue>
            </SummaryItem>
          </SummaryGrid>
        </SummarySection>
      </ContentPanel>
    </Wrapper>
  )
}



