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
  font-size: clamp(3rem, 4vw, 60px);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4rem;
  text-align: center;
  color: #0f2a14ff;
  background: linear-gradient(120deg, #95eca4ff 0%, #18c0a8 60%, #03b689ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 8px 24px rgba(31, 124, 184, 0.25);
`

export const Modules = styled(motion.section)`
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  border: 1px solid rgba(30, 183, 154, 0.1);

  > * {
    display: flex;
    flex-basis: calc(25% - 12px);
  }

  @media (max-width: 1100px) {
    > * {
      flex-basis: calc(50% - 8px);
    }
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

export const Guides = styled(motion.section)`
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

export const GuideCard = styled.div`
  background: #ffffff;
  color: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
`

export const GuideTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #0f172a;
`

export const GuideDescription = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: #475569;
`

export const GuideTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(30, 183, 154, 0.12);
    color: #0f766e;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
`


export const TransitionOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.97));
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
`

export const TransitionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`

export const TransitionCircle = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 20%, #34d399, #059669 70%);
  box-shadow:
    0 0 0 8px rgba(16, 185, 129, 0.1),
    0 18px 35px rgba(15, 23, 42, 0.45);
  color: #ecfdf5;
  font-size: 40px;
`;

export const TransitionRing = styled.div`
  position: absolute;
  inset: -10px;
  border-radius: 999px;
  border: 3px solid rgba(16, 185, 129, 0.18);
  border-top-color: #22c55e;
  border-right-color: #0ea5e9;
  border-bottom-color: transparent;
  border-left-color: transparent;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);
  animation: spinRing 1.1s linear infinite;

  @keyframes spinRing {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const TransitionLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #e5e7eb;
`

export const TransitionSub = styled.div`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9ca3af;
`
