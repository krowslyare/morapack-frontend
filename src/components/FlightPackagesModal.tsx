// src/components/FlightPackagesModal.tsx
import { useMemo } from 'react'
import styled from 'styled-components'
import { useFlightPackages } from '../hooks/api/useFlightPackages'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
`

const Modal = styled.div`
  background: #ffffff;
  border-radius: 18px;
  width: min(900px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  padding: 18px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`

const Subtitle = styled.div`
  font-size: 13px;
  color: #6b7280;
`

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
  transition: background 0.15s, color 0.15s, transform 0.1s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
    transform: translateY(-1px);
  }
`

const Content = styled.div`
  padding: 14px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
`

const SummaryChip = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`

const SummaryStrong = styled.span`
  color: #111827;
  font-weight: 600;
`

const TableWrap = styled.div`
  margin-top: 6px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #d1d5db;
    text-align: left;
    white-space: nowrap;
    color: #111827;
  }

  th {
    background: #f3f4f6;
    font-weight: 700;
    color: #111827;
    font-size: 12px;
  }

  tbody td {
    color: #374151;
  }

  tbody tr:nth-child(even) {
    background: #f9fafb;
  }
`

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #e0f2fe;
  color: #075985;
`

const ErrorBox = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 14px;
  font-weight: 500;
`

const LoadingText = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 500;
`

export function FlightPackagesModal({
  flightId,
  flightCode,
  onClose,
}: {
  flightId: number
  flightCode?: string
  onClose: () => void
}) {
  const { data, isLoading, isError } = useFlightPackages(flightCode)
  const products = data?.products ?? []

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  )

  const totals = useMemo(() => {
    return {
      count: data?.totals.productCount ?? products.length,
      statusBreakdown: data?.totals.statusBreakdown ?? {},
    }
  }, [data, products.length])

  return (
    <Overlay>
      <Modal>
        <Header>
          <TitleBlock>
            <Title>Paquetes del vuelo</Title>
            <Subtitle>
              Código: <b>{flightCode ?? `#${flightId}`}</b>
            </Subtitle>
          </TitleBlock>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        <Content>
          {!flightCode && (
            <ErrorBox>El código del vuelo es requerido para consultar paquetes.</ErrorBox>
          )}

          {isLoading && <LoadingText>Cargando paquetes…</LoadingText>}

          {isError && (
            <ErrorBox>Error al cargar paquetes. Intenta nuevamente en unos minutos.</ErrorBox>
          )}

          {!isLoading && !isError && flightCode && (
            <>
              <SummaryRow>
                <SummaryChip>
                  Productos asignados: <SummaryStrong>{totals.count}</SummaryStrong>
                </SummaryChip>

                <SummaryChip>
                  Estados:{' '}
                  <SummaryStrong>
                    {Object.entries(totals.statusBreakdown).length === 0
                      ? '—'
                      : Object.entries(totals.statusBreakdown)
                          .map(([status, value]) => `${status}: ${value}`)
                          .join(' · ')}
                  </SummaryStrong>
                </SummaryChip>
              </SummaryRow>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Orden</th>
                      <th>Nombre de orden</th>
                      <th>Destino</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Instancia asignada</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.order?.id ?? '—'}</td>
                        <td>{p.order?.name ?? '—'}</td>
                        <td>{p.order?.destination ?? '—'}</td>
                        <td>{p.order?.customer ?? '—'}</td>
                        <td>
                          {p.status ? <StatusBadge>{p.status}</StatusBadge> : '—'}
                        </td>
                        <td>{p.assignedFlightInstance ?? '—'}</td>
                        <td>{p.createdAt ? formatter.format(new Date(p.createdAt)) : '—'}</td>
                      </tr>
                    ))}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '14px 10px', color: '#9ca3af' }}>
                          No se encontraron paquetes asignados a este vuelo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </TableWrap>
            </>
          )}
        </Content>
      </Modal>
    </Overlay>
  )
}
