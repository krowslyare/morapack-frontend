import React from 'react'
import styled from 'styled-components'
import { DailyAlgorithmResponse } from '../../api/simulationService'

// ====================== Styled Components ======================

const ModalOverlay = styled.div<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  // Make it non-blocking for the rest of the UI (pointer-events: none on overlay, auto on content)
  pointer-events: none;
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  align-items: flex-start;
  justify-content: flex-end;
  padding: 24px;
  z-index: 10000;
  background: transparent;
`

const ModalContent = styled.div`
  background: white;
  padding: 0;
  border-radius: 12px;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  pointer-events: auto;
  border: 1px solid #e5e7eb;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`

const ModalHeader = styled.div`
  padding: 16px 20px;
  // Match the app theme (Emerald/Teal)
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
`

const ModalSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
`

const ModalBody = styled.div`
  padding: 20px;
  background: #fdfdfd;
`

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`

const StatCard = styled.div<{ $highlight?: boolean }>`
  padding: 12px;
  background: ${p => p.$highlight ? '#f0fdf4' : 'white'};
  border: 1px solid ${p => p.$highlight ? '#bbf7d0' : '#e5e7eb'};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const StatValue = styled.div<{ $color?: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(p) => p.$color || '#111827'};
`

const StatLabel = styled.div`
  font-size: 10px;
  color: #6b7280;
  margin-top: 4px;
  font-weight: 500;
`

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0 0 16px;
`

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
  
  &:active {
    background: #e5e7eb;
  }
`

interface DailyReportModalProps {
  show: boolean
  dayNumber: number
  data: DailyAlgorithmResponse | null
  trend?: {
    isGrowing: boolean
    growingDays: number
    backlog: number
  }
  onContinue: () => void
}

export function DailyReportModal({ show, dayNumber, data, trend, onContinue }: DailyReportModalProps) {
  if (!data) return null

  // SLA Compliance (Score is 0-100)
  const compliance = data.score || 100
  const lateItems = data.ordersLate || 0

  return (
    <ModalOverlay $show={show}>
      <ModalContent>
        <ModalHeader>
          <HeaderText>
            <ModalTitle>Reporte del Día {dayNumber}</ModalTitle>
            <ModalSubtitle>Resumen Operativo</ModalSubtitle>
          </HeaderText>
          {/* Close icon could go here if needed */}
        </ModalHeader>

        <ModalBody>
          <SectionTitle>Salud Operativa (SLA)</SectionTitle>
          <StatGrid>
            <StatCard $highlight={compliance >= 95}>
              <StatValue $color={compliance >= 95 ? '#059669' : compliance >= 80 ? '#d97706' : '#dc2626'}>
                {compliance.toFixed(1)}%
              </StatValue>
              <StatLabel>Cumplimiento</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue $color={lateItems > 0 ? '#dc2626' : '#6b7280'}>
                {lateItems}
              </StatValue>
              <StatLabel>Paquetes Tardíos</StatLabel>
            </StatCard>
          </StatGrid>

          {/* Backlog Warning Section - only show if there IS a backlog */}
          {trend && trend.backlog > 0 && (
            <>
              <Divider />
              <SectionTitle>Riesgo de Colapso</SectionTitle>
              <div style={{
                padding: '10px',
                background: trend.isGrowing ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${trend.isGrowing ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: trend.isGrowing ? '#dc2626' : '#15803d',
                  marginBottom: '4px'
                }}>
                  {trend.isGrowing
                    ? `⚠️ Creciendo por ${trend.growingDays} días`
                    : '✓ Backlog Estable / Reduciendo'}
                </div>
                <div style={{ fontSize: '11px', color: '#4b5563' }}>
                  Pendientes Acumulados: <strong>{trend.backlog}</strong>
                </div>
              </div>
            </>
          )}

          {!trend && <Divider />}

          <SectionTitle>Flujo Diario (Paquetes)</SectionTitle>
          <StatGrid>
            <StatCard>
              <StatValue>{data.totalProducts}</StatValue>
              <StatLabel>Ingresados</StatLabel>
            </StatCard>
            <StatCard $highlight>
              <StatValue $color="#059669">{data.assignedProducts}</StatValue>
              <StatLabel>Despachados</StatLabel>
            </StatCard>
          </StatGrid>

          <Button onClick={onContinue}>Continuar Simulación</Button>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}
