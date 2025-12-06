import styled from 'styled-components'

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  font-size: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`

const Label = styled.div`
  color: #6b7280;
  font-size: 13px;
`

const Value = styled.div`
  font-size: 24px;
  font-weight: 800;
  margin-top: 8px;
  color: #111827;
`

interface WeeklyKPICardProps {
  label: string
  value: string | number
  title?: string
}

export function WeeklyKPICard({ label, value, title }: WeeklyKPICardProps) {
  return (
    <Card title={title}>
      <Label>{label}</Label>
      <Value>{value}</Value>
    </Card>
  )
}
