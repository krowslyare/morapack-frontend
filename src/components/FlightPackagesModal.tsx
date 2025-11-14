// src/components/FlightPackagesModal.tsx
import { useMemo } from 'react'
import styled from 'styled-components'
import { useFlightPackages } from '../hooks/api/useFlightPackages'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000; /* sube por encima del modal de aeropuerto */
`
const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px 22px;
  width: min(900px, 96vw);
  max-height: 86vh;
  overflow-y: auto;
  z-index: 20001; /* opcional, garantiza estar sobre el overlay */
`
const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
`
const CloseBtn = styled.button`
  margin-left: auto; padding: 8px 12px; border: 1px solid #d30000ff;
  background: #f10707ff; border-radius: 8px; font-weight: 600; cursor: pointer;
`
const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  min-height: 48px;
`
const TableWrap = styled.div` overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px; `
const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 13px;
  th, td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; text-align: left; }
  th { background: #f9fafb; font-weight: 700; position: sticky; top: 0; }
`
const ErrorText = styled.span`
  color: #b91c1c;
  font-weight: 600;
  font-size: 14px;
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
        <Toolbar>
          <Title>Paquetes del vuelo {flightCode ?? `#${flightId}`}</Title>
          <CloseBtn onClick={onClose}>Cerrar</CloseBtn>
        </Toolbar>

        {!flightCode && (
          <ErrorText>El código del vuelo es requerido para consultar paquetes.</ErrorText>
        )}

        {isLoading && <div style={{ color: '#000000ff' }}>Cargando paquetes…</div>}
        {isError && <ErrorText>Error al cargar paquetes.</ErrorText>}

        {!isLoading && !isError && flightCode && (
          <>
            <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>
                Productos asignados: <b>{totals.count}</b>
              </span>
              <span>
                Estados:{' '}
                {Object.entries(totals.statusBreakdown).length === 0
                  ? '—'
                  : Object.entries(totals.statusBreakdown)
                      .map(([status, value]) => `${status}: ${value}`)
                      .join(' · ')}
              </span>
            </div>

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
                      <td>{p.order?.id ?? '-'}</td>
                      <td>{p.order?.name ?? '—'}</td>
                      <td>{p.order?.destination ?? '—'}</td>
                      <td>{p.order?.customer ?? '—'}</td>
                      <td>{p.status ?? '—'}</td>
                      <td>{p.assignedFlightInstance ?? '—'}</td>
                      <td>{p.createdAt ? formatter.format(new Date(p.createdAt)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </>
        )}
      </Modal>
    </Overlay>
  )
}
