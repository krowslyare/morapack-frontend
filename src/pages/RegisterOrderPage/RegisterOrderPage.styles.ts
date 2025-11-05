import styled from 'styled-components'

export const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

export const Header = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

export const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 800;
`
export const Sub = styled.p`
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
`
export const HeaderActions = styled.div`
  display: flex; gap: 8px;
`

export const Button = styled.button<{variant?: 'primary'|'ghost'}>`
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  background: ${({variant}) => variant==='primary' ? '#10b981' : 'transparent'};
  color: ${({variant}) => variant==='primary' ? '#fff' : '#111827'};
  border: ${({variant}) => variant==='primary' ? 'none' : '1px solid #e5e7eb'};
  &:disabled { opacity: .5; cursor: not-allowed; }
`

export const Panel = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`

export const Alert = styled.div`
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
`

export const Grid = styled.div<{two?: boolean; three?: boolean}>`
  display: grid;
  grid-template-columns: ${({three, two}) => three ? 'repeat(3,1fr)' : two ? 'repeat(2,1fr)' : '1fr'};
  gap: 14px;
  @media (max-width: 960px){ grid-template-columns: 1fr; }
  margin-bottom: 14px;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: .02em;
`

export const Input = styled.input`
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  outline: none;
  &:focus { border-color: #93c5fd; background: #ffffff; }
`

export const Select = styled.select`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  outline: none;
  &:focus { border-color: #93c5fd; }
`

export const Help = styled.span`
  font-size: 11px;
  color: #6b7280;
`

export const SectionTitle = styled.h3`
  margin: 8px 0;
  font-size: 14px;
  color: #111827;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .04em;
`

export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`

export const Muted = styled.span`
  color: #6b7280;
  font-size: 12px;
`
