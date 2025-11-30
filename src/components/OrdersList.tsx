import styled from "styled-components"
import type { OrderSchema } from "../types"

const ListContainer = styled.div`
  padding: 12px;
  overflow-y: auto;
  flex: 1;
`

const Card = styled.div`
  padding: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`

interface OrdersListProps {
  orders: OrderSchema[];
  onSelectOrder: (order: OrderSchema) => void;
}

export function OrdersList({ orders, onSelectOrder }: OrdersListProps) {
  return (
    <ListContainer>
      {orders.map(order => (
        <Card key={order.id} onClick={() => onSelectOrder(order)}>

          {/* Nombre del pedido (tu backend usa "name", no "code") */}
          <strong>{order.name}</strong>

          {/* Origen → Destino */}
          <div>
            {order.originCityName} → {order.destinationCityName}
          </div>

          {/* Estado (si existe) */}
          {order.status && (
            <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>
              Estado: {order.status}
            </div>
          )}

          {/* Fecha de creación (si existe) */}
          {order.creationDate && (
            <div style={{ fontSize: "12px", marginTop: "4px", color: "#9ca3af" }}>
              Creado: {new Date(order.creationDate).toLocaleDateString("es-PE")}
            </div>
          )}

        </Card>
      ))}
    </ListContainer>
  )
}
