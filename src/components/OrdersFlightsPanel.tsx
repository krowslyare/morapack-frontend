import styled from "styled-components"
import { useState } from "react"
import { OrdersList } from "./OrdersList"
import { FlightsList } from "./FlightsList"

// IMPORTA LOS TIPOS REALES
import type { OrderSchema } from "../types"
import type { FlightInstance } from "../api/simulationService"

import { PackageStatus } from "../types"

const PanelWrapper = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 12px rgba(0,0,0,0.15);
  border-left: 1px solid #e5e7eb;
  transform: translateX(${p => p.$visible ? '0' : '100%'});
  transition: transform 0.28s ease;
  z-index: 9999;
  display: flex;
  flex-direction: column;
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 16px;
  right: 400px;
  background: #1d4ed8;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 10000;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
`

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  background: ${p => p.$active ? "#f9fafb" : "white"};
  border: none;
  font-weight: 600;
  color: ${p => p.$active ? "#1d4ed8" : "#6b7280"};
  border-bottom: 3px solid ${p => p.$active ? "#1d4ed8" : "transparent"};
  cursor: pointer;
`

const KPIBar = styled.div`
  padding: 12px;
  display: flex;
  gap: 8px;
`

const KPIBox = styled.div`
  flex: 1;
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  border: 1px solid #e5e7eb;
`

// 🔥 INTERFAZ DE PROPS — evita el error de 'any'
interface OrdersFlightsPanelProps {
  orders: OrderSchema[];
  flights: FlightInstance[];
  onSelectOrder: (order: OrderSchema) => void;
  onSelectFlight: (flight: FlightInstance) => void;
}

export function OrdersFlightsPanel({
  orders,
  flights,
  onSelectOrder,
  onSelectFlight
}: OrdersFlightsPanelProps) {

  const [visible, setVisible] = useState(true)
  const [tab, setTab] = useState<"orders"|"flights">("orders")

  // KPIs básicos
  const pending   = orders.filter(o => o.status === PackageStatus.PENDING).length
  const inTransit = orders.filter(o => o.status === PackageStatus.IN_TRANSIT).length
  const completed = orders.filter(o => o.status === PackageStatus.DELIVERED).length

  return (
    <>
      <ToggleButton onClick={() => setVisible(!visible)}>
        {visible ? "Ocultar" : "Mostrar"}
      </ToggleButton>

      <PanelWrapper $visible={visible}>
        
        <Tabs>
          <Tab $active={tab === "orders"} onClick={() => setTab("orders")}>
            Pedidos
          </Tab>
          <Tab $active={tab === "flights"} onClick={() => setTab("flights")}>
            Vuelos
          </Tab>
        </Tabs>

        <KPIBar>
          <KPIBox>
            <strong>{pending}</strong>
            <div>Pendientes</div>
          </KPIBox>
          <KPIBox>
            <strong>{inTransit}</strong>
            <div>En tránsito</div>
          </KPIBox>
          <KPIBox>
            <strong>{completed}</strong>
            <div>Completados</div>
          </KPIBox>
        </KPIBar>

        {tab === "orders" && (
          <OrdersList orders={orders} onSelectOrder={onSelectOrder} />
        )}

        {tab === "flights" && (
          <FlightsList flights={flights} onSelectFlight={onSelectFlight} />
        )}
      </PanelWrapper>
    </>
  )
}
