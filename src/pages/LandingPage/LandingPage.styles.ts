import styled from 'styled-components'

export const Page = styled.div`
  min-height: 100vh;
  background: #e1e7ea; /* consistent light gray */
  color: #1a1a1a;
`

export const TopBar = styled.header`
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
`

export const Brand = styled.div`
  font-weight: 800;
  color: #10b39a; /* teal */
  font-size: 18px;
`

export const Menus = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: center;
  color: #374151;
`

export const MenuItem = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 0;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
`

export const TopRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
`

export const Search = styled.div`
  background: #f3f4f6;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 320px;
  color: #6b7280;

  .material-symbols-outlined {
    font-size: 20px;
  }

  input {
    background: transparent;
    border: 0;
    outline: none;
    flex: 1;
    color: #111827;
  }
`

export const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid rgba(0, 0, 0, 0.12);
  display: grid;
  place-items: center;
  color: #6b7280;

  .material-symbols-outlined {
    font-size: 24px;
  }
`

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 56px 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`

export const Title = styled.h1`
  margin: 0;
  font-size: 48px;
  color: #10b39a; /* teal heading like reference */
  text-align: center;
`

export const Modules = styled.section`
  background: #e1e7ea; /* same background; module tiles themselves are white */
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const ModuleTile = styled.button`
  appearance: none;
  border: 0;
  padding: 28px 16px;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-weight: 800;
  letter-spacing: 0.3px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
  display: grid;
  place-items: center;
  gap: 10px;

  .material-symbols-outlined {
    font-size: 48px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
    background: #1eb79a;
    color: #ffffff;
  }
`

export const Stats = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const StatCard = styled.div`
  background: #ffffff;
  color: #1a1a1a;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.08);
`

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
`

export const StatLabel = styled.div`
  font-size: 13px;
  color: #4b5563;
  text-align: center;
`
