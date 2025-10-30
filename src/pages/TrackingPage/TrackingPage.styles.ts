import styled from 'styled-components'

export const Wrapper = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
`

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const Search = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  min-width: 300px;
  color: #6b7280;

  .material-symbols-outlined {
    font-size: 20px;
    flex-shrink: 0;
  }

  input {
    background: transparent;
    border: 0;
    outline: none;
    flex: 1;
    color: #111827;
    font-size: 14px;

    &::placeholder {
      color: #9ca3af;
    }
  }
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;

  ${({ variant }) =>
    variant === 'primary'
      ? `
    background: #1eb79a;
    color: white;
    border-color: #1eb79a;

    &:hover {
      background: #17a085;
    }
  `
      : `
    background: white;
    color: #374151;
    border-color: #d1d5db;

    &:hover {
      background: #f9fafb;
    }
  `}

  .material-symbols-outlined {
    font-size: 18px;
    flex-shrink: 0;
  }
`

export const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  min-height: 600px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export const PlaceholderText = styled.p`
  color: #9ca3af;
  font-size: 16px;
  text-align: center;
  margin: 120px 0;
`
