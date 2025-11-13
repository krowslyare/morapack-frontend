import styled, { css } from 'styled-components'

export const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: #f9fafb;
`

export const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: white;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`

export const Search = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #10b981;
  padding: 8px 14px;
  border-radius: 8px;
  input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    font-size: 14px;
    color: #ffffffff;   /* texto oscuro */

    &::placeholder {
      color: #ffffffff; /* placeholder gris */
    }
  }
`

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`
export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 16px;
  color: ${(p) => (p.variant === 'primary' ? 'white' : '#1e3a8a')};
  background: ${(p) => (p.variant === 'primary' ? '#10b981' : '#dbeafe')};
`

export const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  min-height: 70vh;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    color: #374151; /* gris oscuro para títulos */
    font-size: 12px;
    text-transform: uppercase;
    padding: 10px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  td {
    padding: 10px;
    font-size: 14px;
    color: #111827; /* negro azulado visible */
    border-bottom: 1px solid #f3f4f6;
  }

  tr:hover td {
    background: #f9fafb; /* resalta al pasar el mouse */
  }
`

export const Status = styled.span<{ $estado?: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
  color: white;
  text-align: center;
  min-width: 90px;

  ${(p) => {
    switch (p.$estado?.toUpperCase()) {
      case 'DELIVERED':
        return css`
          background: #10b981; /* verde */
        `
      case 'PENDING':
        return css`
          background: #ef4444; /* rojo */
        `
      case 'DELAYED':
        return css`
          background: #6b7280; /* gris */
        `
      case 'IN_TRANSIT':
        return css`
          background: #f59e0b; /* amarillo */
        `
      default:
        return css`
          background: #9ca3af; /* neutro gris */
        `
    }
  }}
`

export const IconButton = styled.button<{ danger?: boolean }>`
  background: none;
  border: none;
  color: ${(p) => (p.danger ? '#dc2626' : '#6b7280')};
  cursor: pointer;
  font-size: 20px;
  &:hover {
    opacity: 0.8;
  }
`

export const PlaceholderText = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 15px;
  padding: 40px 0;
`