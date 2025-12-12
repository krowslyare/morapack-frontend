import { memo } from 'react'
import styled from 'styled-components'
import type { FlightInstance } from '../../api/simulationService'
import type { OrderSchema } from '../../types'

interface FlightDrawerProps {
  isOpen: boolean
  onToggle: () => void
  panelTab: 'flights' | 'orders'
  onTabChange: (tab: 'flights' | 'orders') => void
  flightInstances: FlightInstance[]
  instanceHasProducts: Record<string, number>  // instanceId -> productCount
  simulationStartTime: Date
  activeFlightsCount: number
  onFlightClick: (flight: FlightInstance) => void
  orders: OrderSchema[]
  loadingOrders: boolean
}

// Todos los styled components del drawer aquí...
const BottomDrawer = styled.div<{ $open: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${p => p.$open ? "320px" : "0px"};
  background: white;
  border-top: 2px solid #e5e7eb;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: height;
  transform: translateZ(0);
`;

const DrawerToggle = styled.button<{ $open: boolean }>`
  position: absolute;
  bottom: ${p => p.$open ? "320px" : "0px"};
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 32px;
  background: white;
  border: 2px solid #e5e7eb;
  border-bottom: ${p => p.$open ? "2px solid #e5e7eb" : "none"};
  border-radius: 12px 12px 0 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9001;
  
  &:hover {
    background: #f8fafc;
    border-color: #2563eb;
    color: #2563eb;
  }

  &::before {
    content: ${p => p.$open ? '"▼"' : '"▲"'};
    font-size: 12px;
  }
`;

// ... (copiar todos los demás styled components del drawer)

const DrawerHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const DrawerTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
`;

const DrawerStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  opacity: 0.9;
`;

const DrawerStat = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  strong {
    font-size: 14px;
    font-weight: 700;
  }
`;

const DrawerTabs = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
`;

const DrawerTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 14px;
  font-weight: 600;
  font-size: 14px;
  background: ${p => p.$active ? "#f1f5f9" : "white"};
  border: none;
  border-bottom: 3px solid ${p => p.$active ? "#2563eb" : "transparent"};
  color: ${p => p.$active ? "#2563eb" : "#64748b"};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: #f8fafc;
  }
`;

const DrawerContent = styled.div`
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const DrawerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  will-change: scroll-position;
  transform: translateZ(0);
`;

const FlightCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  padding: 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }
`;

const FlightCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
`;

const FlightCode = styled.strong`
  font-size: 15px;
  color: #111827;
  font-weight: 700;
`;

const FlightBadge = styled.span<{ $hasProducts: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$hasProducts ? "#dcfce7" : "#f3f4f6"};
  color: ${p => p.$hasProducts ? "#166534" : "#6b7280"};
  border: 1px solid ${p => p.$hasProducts ? "#86efac" : "#e5e7eb"};
`;

const FlightRoute = styled.div`
  font-size: 13px;
  color: #374151;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FlightTime = styled.div`
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
`;

const EmptySubtitle = styled.div`
  font-size: 13px;
  color: #9ca3af;
`;

const OrderCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  padding: 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #f59e0b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  }
`;

const OrderCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
`;

const OrderCode = styled.strong`
  font-size: 15px;
  color: #111827;
  font-weight: 700;
`;

const OrderBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => {
    switch(p.$status?.toLowerCase()) {
      case 'pending': return '#fef3c7'
      case 'assigned': return '#dbeafe'
      case 'in_transit': return '#e0e7ff'
      case 'delivered': return '#dcfce7'
      default: return '#f3f4f6'
    }
  }};
  color: ${p => {
    switch(p.$status?.toLowerCase()) {
      case 'pending': return '#92400e'
      case 'assigned': return '#1e40af'
      case 'in_transit': return '#4338ca'
      case 'delivered': return '#166534'
      default: return '#6b7280'
    }
  }};
  border: 1px solid ${p => {
    switch(p.$status?.toLowerCase()) {
      case 'pending': return '#fcd34d'
      case 'assigned': return '#93c5fd'
      case 'in_transit': return '#a5b4fc'
      case 'delivered': return '#86efac'
      default: return '#e5e7eb'
    }
  }};
`;

const OrderDetails = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  
  div {
    display: flex;
    gap: 6px;
  }
  
  strong {
    color: #374151;
    font-weight: 600;
  }
`;

const OrderFlight = styled.div`
  font-size: 11px;
  color: #2563eb;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 4px;
  
  strong {
    font-weight: 700;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  label {
    font-size: 10px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  
  span {
    color: #374151;
    font-weight: 500;
    font-size: 12px;
  }
`;

const OrderMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
`;

const MetadataItem = styled.div`
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
  
  strong {
    color: #374151;
    font-weight: 600;
  }
`;

const OrderLocation = styled.div`
  font-size: 11px;
  color: #059669;
  padding: 6px 10px;
  background: #d1fae5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  strong {
    font-weight: 700;
  }
`;

// Styled components para la lista de productos
const ProductsSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
`;

const ProductsSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProductItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 6px;
  font-size: 11px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const ProductName = styled.span`
  font-weight: 600;
  color: #374151;
`;

const ProductWeight = styled.span`
  font-size: 10px;
  color: #9ca3af;
`;

const ProductFlightInfo = styled.div<{ $status: 'assigned' | 'pending' | 'same-location' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: ${p => {
    switch (p.$status) {
      case 'assigned': return '#dbeafe';
      case 'pending': return '#fef3c7';
      case 'same-location': return '#e0e7ff';
      default: return '#f3f4f6';
    }
  }};
  color: ${p => {
    switch (p.$status) {
      case 'assigned': return '#1e40af';
      case 'pending': return '#92400e';
      case 'same-location': return '#4338ca';
      default: return '#6b7280';
    }
  }};
`;

const FlightInfoIcon = styled.span`
  font-size: 12px;
`;

const FlightInfoText = styled.span`
  flex: 1;
`;

const FlightTimes = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
  
  span {
    display: flex;
    align-items: center;
    gap: 2px;
  }
`;

// Helper function para parsear la información del vuelo asignado
function parseFlightInfo(assignedFlight: string | undefined, originCity: string, destCity: string, flightInstances: FlightInstance[]) {
  // Si origen y destino son iguales
  if (originCity === destCity) {
    return {
      status: 'same-location' as const,
      message: 'Origen y destino iguales',
      icon: '📍',
      flightCode: null,
      departure: null,
      arrival: null
    };
  }
  
  // Si no tiene vuelo asignado
  if (!assignedFlight || assignedFlight.trim() === '') {
    return {
      status: 'pending' as const,
      message: 'En proceso de asignacion',
      icon: '⏳',
      flightCode: null,
      departure: null,
      arrival: null
    };
  }
  
  // Tiene vuelo asignado - buscar en las instancias para obtener horarios
  const flightCodes = assignedFlight.split('->').map(s => s.trim()).filter(Boolean);
  const firstFlightCode = flightCodes[0];
  
  // Buscar la instancia del vuelo para obtener horarios
  const flightInstance = flightInstances.find(f => 
    f.instanceId === firstFlightCode || 
    f.flightCode === firstFlightCode ||
    assignedFlight.includes(f.instanceId)
  );
  
  return {
    status: 'assigned' as const,
    message: flightCodes.length > 1 ? `${flightCodes.length} vuelos` : firstFlightCode,
    icon: '✈️',
    flightCode: assignedFlight,
    departure: flightInstance?.departureTime || null,
    arrival: flightInstance?.arrivalTime || null,
    route: flightInstance ? `${flightInstance.originAirport.codeIATA} → ${flightInstance.destinationAirport.codeIATA}` : null
  };
}

// ✅ Componente memoizado para evitar re-renders
export const FlightDrawer = memo(function FlightDrawer({
  isOpen,
  onToggle,
  panelTab,
  onTabChange,
  flightInstances,
  instanceHasProducts,
  // simulationStartTime no se usa actualmente
  activeFlightsCount,
  onFlightClick,
  orders,
  loadingOrders,
}: FlightDrawerProps) {

  return (
    <>
      <DrawerToggle $open={isOpen} onClick={onToggle}>
        {isOpen ? "Ocultar panel" : "Ver vuelos activos"}
      </DrawerToggle>

      <BottomDrawer $open={isOpen}>
        <DrawerHeader>
          <DrawerTitle>Vuelos en tiempo real</DrawerTitle>
          <DrawerStats>
            <DrawerStat>
              <span>Activos:</span>
              <strong>{activeFlightsCount}</strong>
            </DrawerStat>
            <DrawerStat>
              <span>Total:</span>
              <strong>{flightInstances.length}</strong>
            </DrawerStat>
          </DrawerStats>
        </DrawerHeader>

        <DrawerTabs>
          <DrawerTab $active={panelTab === "flights"} onClick={() => onTabChange("flights")}>
            Vuelos ({flightInstances.length})
          </DrawerTab>
          <DrawerTab $active={panelTab === "orders"} onClick={() => onTabChange("orders")}>
            Pedidos
          </DrawerTab>
        </DrawerTabs>

        <DrawerContent>
          {panelTab === "flights" && (
            <>
              {flightInstances.length === 0 ? (
                <EmptyState>
                  <EmptyIcon></EmptyIcon>
                  <EmptyTitle>No hay vuelos cargados</EmptyTitle>
                  <EmptySubtitle>
                    Inicia la simulacion para visualizar los vuelos de la semana
                  </EmptySubtitle>
                </EmptyState>
              ) : (
                <DrawerGrid>
                  {flightInstances.map(f => {
                    // Usar instanceId directamente del objeto
                    const productCount = instanceHasProducts[f.instanceId] ?? 0
                    const hasProducts = productCount > 0
                    
                    return (
                      <FlightCard key={f.id} onClick={() => onFlightClick(f)}>
                        <FlightCardHeader>
                          <FlightCode>{f.flightCode}</FlightCode>
                          <FlightBadge $hasProducts={hasProducts}>
                            {hasProducts ? `${productCount} prod.` : "Vacío"}
                          </FlightBadge>
                        </FlightCardHeader>
                        
                        <FlightRoute>
                          {f.originAirport.codeIATA} 
                          <span style={{ color: "#2563eb" }}>→</span> 
                          {f.destinationAirport.codeIATA}
                        </FlightRoute>
                        
                        <FlightTime>
                          Salida: {new Date(f.departureTime).toLocaleString("es-PE", { 
                            timeZone: "UTC",
                            month: "short", 
                            day: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </FlightTime>
                      </FlightCard>
                    );
                  })}
                </DrawerGrid>
              )}
            </>
          )}

          {panelTab === "orders" && (
            <>
                {loadingOrders ? (
                <EmptyState>
                    <EmptyIcon></EmptyIcon>
                    <EmptyTitle>Cargando pedidos...</EmptyTitle>
                </EmptyState>
                ) : orders.length === 0 ? (
                <EmptyState>
                    <EmptyIcon></EmptyIcon>
                    <EmptyTitle>No hay pedidos disponibles</EmptyTitle>
                    <EmptySubtitle>
                    Los pedidos apareceran cuando se ejecute el algoritmo diario
                    </EmptySubtitle>
                </EmptyState>
                ) : (
                <DrawerGrid>
                    {orders.map(order => (
                    <OrderCard key={order.id}>
                        <OrderCardHeader>
                        <OrderCode>
                            <strong>{order.name}</strong>
                            <span>ID: {order.id}</span>
                        </OrderCode>
                        <OrderBadge $status={order.status}>
                            {order.status}
                        </OrderBadge>
                        </OrderCardHeader>
                        
                        <OrderDetails>
                        <DetailItem>
                            <label>Origen</label>
                            <span>{order.originCityName}</span>
                        </DetailItem>
                        <DetailItem>
                            <label>Destino</label>
                            <span>{order.destinationCityName}</span>
                        </DetailItem>
                        <DetailItem>
                            <label>Cliente</label>
                            <span>
                            {order.customerSchema?.name || `ID: ${order.customerId}`}
                            </span>
                        </DetailItem>
                        <DetailItem>
                            <label>Entrega</label>
                            <span>
                            {new Date(order.deliveryDate).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                            </span>
                        </DetailItem>
                        </OrderDetails>

                        {/* Información adicional */}
                        <OrderMetadata>
                        {order.priority && (
                            <MetadataItem>
                            Prioridad: <strong>{order.priority}</strong>
                            </MetadataItem>
                        )}
                        
                        {order.pickupTimeHours && (
                            <MetadataItem>
                            Recojo: <strong>{order.pickupTimeHours}h</strong>
                            </MetadataItem>
                        )}
                        </OrderMetadata>

                        {/* Lista de productos con información de vuelo */}
                        {order.productSchemas && order.productSchemas.length > 0 && (
                        <ProductsSection>
                            <ProductsSectionTitle>
                            Productos ({order.productSchemas.length})
                            </ProductsSectionTitle>
                            {order.productSchemas.map((product, idx) => {
                            const flightInfo = parseFlightInfo(
                                product.assignedFlight,
                                order.originCityName,
                                order.destinationCityName,
                                flightInstances
                            );
                            return (
                                <ProductItem key={product.id || idx}>
                                <ProductHeader>
                                    <ProductName>{product.name}</ProductName>
                                    <ProductWeight>{product.weight?.toFixed(1)} kg</ProductWeight>
                                </ProductHeader>
                                <ProductFlightInfo $status={flightInfo.status}>
                                    <FlightInfoIcon>{flightInfo.icon}</FlightInfoIcon>
                                    <FlightInfoText>
                                    {flightInfo.status === 'assigned' && flightInfo.flightCode 
                                        ? flightInfo.flightCode 
                                        : flightInfo.message
                                    }
                                    </FlightInfoText>
                                </ProductFlightInfo>
                                {flightInfo.status === 'assigned' && (flightInfo.departure || flightInfo.route) && (
                                    <FlightTimes>
                                    {flightInfo.route && (
                                        <span>Ruta: {flightInfo.route}</span>
                                    )}
                                    {flightInfo.departure && (
                                        <span>
                                        Salida: {new Date(flightInfo.departure).toLocaleString('es-PE', {
                                            timeZone: 'UTC',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        </span>
                                    )}
                                    {flightInfo.arrival && (
                                        <span>
                                        Llegada: {new Date(flightInfo.arrival).toLocaleString('es-PE', {
                                            timeZone: 'UTC',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        </span>
                                    )}
                                    </FlightTimes>
                                )}
                                </ProductItem>
                            );
                            })}
                        </ProductsSection>
                        )}
                        
                        {/* Ruta asignada */}
                        {order.assignedRouteSchema && (
                        <OrderFlight>
                            Ruta asignada: <strong>
                            {order.assignedRouteSchema.originCitySchema.name} → {order.assignedRouteSchema.destinationCitySchema.name}
                            </strong>
                        </OrderFlight>
                        )}

                        {/* Ubicacion actual */}
                        {order.currentLocation && (
                        <OrderLocation>
                            Ubicacion actual: <strong>{order.currentLocation.name}</strong>
                        </OrderLocation>
                        )}
                    </OrderCard>
                    ))}
                </DrawerGrid>
                )}
            </>
            )}

        </DrawerContent>
      </BottomDrawer>
    </>
  )
}, (prevProps, nextProps) => {
  // ✅ Solo re-renderizar si cambian estas props específicas
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.panelTab === nextProps.panelTab &&
    prevProps.flightInstances.length === nextProps.flightInstances.length &&
    prevProps.activeFlightsCount === nextProps.activeFlightsCount
  )
})