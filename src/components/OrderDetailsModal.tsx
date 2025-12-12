import styled from 'styled-components'
import type { OrderSchema } from '../types/OrderSchema'

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
  width: min(600px, 90vw);
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

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`

const Subtitle = styled.div`
  font-size: 13px;
  color: #64748b;
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #ef4444;
  }
`

const Content = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const InfoItem = styled.div`
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`

const Label = styled.div`
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
`

const Value = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${p => {
    switch (p.$status) {
      case 'DELIVERED': return '#dcfce7';
      case 'IN_TRANSIT': return '#dbeafe';
      case 'PENDING': return '#fef9c3';
      default: return '#f1f5f9';
    }
  }};
  color: ${p => {
    switch (p.$status) {
      case 'DELIVERED': return '#166534';
      case 'IN_TRANSIT': return '#1e40af';
      case 'PENDING': return '#854d0e';
      default: return '#475569';
    }
  }};
`

interface OrderDetailsModalProps {
  order: OrderSchema | null
  onClose: () => void
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <TitleBlock>
            <Title>Orden #{order.id}</Title>
            <Subtitle>Detalles del envío</Subtitle>
          </TitleBlock>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        <Content>
          <Section>
            <SectionTitle>Estado</SectionTitle>
            <div>
              <StatusBadge $status={order.status}>{order.status}</StatusBadge>
            </div>
          </Section>

          <Section>
            <SectionTitle>Ruta</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <Label>Origen</Label>
                <Value>{order.originCityName}</Value>
              </InfoItem>
              <InfoItem>
                <Label>Destino</Label>
                <Value>{order.destinationCityName}</Value>
              </InfoItem>
            </InfoGrid>
          </Section>

          <Section>
            <SectionTitle>Fechas</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <Label>Creación</Label>
                <Value>{order.creationDate ? new Date(order.creationDate).toLocaleString() : '-'}</Value>
              </InfoItem>
              <InfoItem>
                <Label>Entrega Estimada</Label>
                <Value>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleString() : '-'}</Value>
              </InfoItem>
            </InfoGrid>
          </Section>

          {order.productSchemas && order.productSchemas.length > 0 && (
            <Section>
              <SectionTitle>Productos ({order.productSchemas.length})</SectionTitle>
              <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.productSchemas.map((prod, idx) => (
                  <InfoItem key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Value>{prod.name || `Producto ${idx + 1}`}</Value>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{prod.weight}kg</span>
                    </div>
                  </InfoItem>
                ))}
              </div>
            </Section>
          )}
        </Content>
      </Modal>
    </Overlay>
  )
}
