import * as S from './TrackingPage.styles'
import { useState, useEffect } from 'react'
import { useOrders, useDeleteOrder } from '../../hooks/api/useOrders'
import type { OrderSchema } from '../../types'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 14

export function TrackingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: orders = [], isLoading, error } = useOrders()
  const deleteOrder = useDeleteOrder()

  const filtered = orders.filter((order: OrderSchema) =>
    Object.values(order).some((v) =>
      v?.toString().toLowerCase().includes(search.toLowerCase()),
    ),
  )

  // si cambia la búsqueda, volvemos a la página 1
  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedOrders = filtered.slice(startIndex, endIndex)

  const handleDelete = (id: number) => {
    if (confirm('¿Deseas eliminar este pedido?')) {
      deleteOrder.mutate(id)
    }
  }

  const handleEdit = (id: number) => {
    navigate(`/envios/registrar?id=${id}`)
  }

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1))
  }

  return (
    <S.Wrapper>
      <S.ActionBar>
        <S.Search>
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Buscar pedido"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </S.Search>
        <S.NewOrderButton onClick={() => navigate('/envios/registrar')}>
          <span className="material-symbols-outlined">add</span>
          Nuevo Pedido
        </S.NewOrderButton>
      </S.ActionBar>

      <S.ContentPanel>
        {isLoading && <S.PlaceholderText>Cargando pedidos...</S.PlaceholderText>}
        {error && <S.PlaceholderText>Error al cargar pedidos</S.PlaceholderText>}

        {!isLoading && !error && (
          <>
            <S.Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Ciudad Origen</th>
                  <th>Ciudad Destino</th>
                  <th>Cliente</th>
                  <th>Fecha Creación</th>
                  <th>Fecha Entrega</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order: OrderSchema) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.name ?? '-'}</td>
                    <td>{order.originCityName ?? '-'}</td>
                    <td>{order.destinationCityName ?? '-'}</td>
                    <td>
                      {order.customerSchema?.name ??
                        `Cliente ${order.customerId ?? '-'}`}
                    </td>
                    <td>{order.creationDate?.slice(0, 10) ?? '-'}</td>
                    <td>{order.deliveryDate?.slice(0, 10) ?? '-'}</td>
                    <td>
                      <S.Status $estado={order.status}>
                        {order.status ?? 'Sin estado'}
                      </S.Status>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <S.IconButton
                        type="button"
                        title="Editar"
                        onClick={() => handleEdit(order.id!)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </S.IconButton>
                      <S.IconButton
                        title="Eliminar"
                        danger
                        onClick={() => handleDelete(order.id!)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </S.IconButton>
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '16px' }}>
                      No se encontraron pedidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </S.Table>

            {/* barra de paginación abajo */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Mostrando{' '}
                {filtered.length === 0
                  ? '0'
                  : `${startIndex + 1}–${Math.min(endIndex, filtered.length)}`}{' '}
                de {filtered.length} pedidos
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <S.Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Anterior
                </S.Button>

                <span style={{ fontSize: 13, color: '#4b5563' }}>
                  Página {currentPage} de {totalPages}
                </span>

                <S.Button
                  type="button"
                  variant="secondary"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </S.Button>
              </div>
            </div>
          </>
        )}
      </S.ContentPanel>
    </S.Wrapper>
  )
}
