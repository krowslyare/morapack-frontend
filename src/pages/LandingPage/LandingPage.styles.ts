import styled from 'styled-components'
import { motion } from 'framer-motion'

export const Page = styled.div`
  min-height: 100vh;
  background: transparent;
  color: #1a1a1a;
  position: relative;
  z-index: 1;
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
  gap: 56px;
  position: relative;
  z-index: 2;
`

export const Title = styled.h1`
  margin: 0;
  font-size: 48px;
  color: #10b39a;
  text-align: center;
`

export const Modules = styled(motion.section)`
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  border: 1px solid rgba(30, 183, 154, 0.1);

  > * {
    display: flex;
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const ModuleTile = styled.button`
  appearance: none;
  border: 0;
  padding: 28px 16px;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  font-weight: 800;
  letter-spacing: 0.3px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  display: grid;
  place-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .material-symbols-outlined {
    font-size: 48px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(30, 183, 154, 0.2);
    background: #1eb79a;
    color: #ffffff;
    border-color: #1eb79a;
  }

  &:active {
    transform: translateY(-2px);
  }
`

export const Stats = styled(motion.section)`
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const StatCard = styled.div`
  background: #f9fafb;
  color: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px 24px;
  display: grid;
  place-items: center;
  box-shadow: none;
  cursor: default;
  transition: all 0.2s ease;

  &:hover {
    /* Sin cambios en hover para indicar que no es interactivo */
    background: #f9fafb;
  }
`

export const StatValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1eb79a;
  font-variant-numeric: tabular-nums;
`

export const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
  line-height: 1.5;
`
