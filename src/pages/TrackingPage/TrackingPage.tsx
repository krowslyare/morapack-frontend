import * as S from './TrackingPage.styles'
import { useState } from 'react'
import { useOrders, useDeleteOrder } from '../../hooks/api/useOrders'
import type { OrderSchema } from '../../types'

export function TrackingPage() {
  const [search, setSearch] = useState('')
  const { data: orders = [], isLoading, error } = useOrders()
  const deleteOrder = useDeleteOrder()

  const filtered = orders.filter((order: OrderSchema) =>
    Object.values(order).some((v) =>
      v?.toString().toLowerCase().includes(search.toLowerCase())
    )
  )

  const handleDelete = (id: number) => {
    if (confirm('¿Deseas eliminar este pedido?')) {
      deleteOrder.mutate(id)
    }
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

        <S.Actions>
          <S.Button variant="secondary">
            <span className="material-symbols-outlined">view_column</span>
            Columnas
          </S.Button>
          <S.Button variant="secondary">
            <span className="material-symbols-outlined">upload</span>
            Subir datos
          </S.Button>
          <S.Button variant="primary">
            <span className="material-symbols-outlined">add_circle</span>
            Registrar Pedido
          </S.Button>
        </S.Actions>
      </S.ActionBar>

      <S.ContentPanel>
        {isLoading && <S.PlaceholderText>Cargando pedidos...</S.PlaceholderText>}
        {error && <S.PlaceholderText>Error al cargar pedidos</S.PlaceholderText>}

        {!isLoading && !error && (
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
              {filtered.map((order: OrderSchema) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.name ?? '-'}</td>
                  <td>{order.originCityName ?? '-'}</td>
                  <td>{order.destinationCityName ?? '-'}</td>
                  <td>{order.customerSchema?.name ?? `Cliente ${order.customerId ?? '-'}`}</td>
                  <td>{order.creationDate?.slice(0, 10) ?? '-'}</td>
                  <td>{order.deliveryDate?.slice(0, 10) ?? '-'}</td>
                  <td>
                    <S.Status $estado={order.status}>
                      {order.status ?? 'Sin estado'}
                    </S.Status>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <S.IconButton title="Editar">
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
            </tbody>
          </S.Table>
        )}
      </S.ContentPanel>
    </S.Wrapper>
  )
}
