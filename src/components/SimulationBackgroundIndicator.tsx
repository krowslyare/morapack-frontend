import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { useSimulationStore } from '../store/useSimulationStore'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const FloatingIndicator = styled.div<{ $show: boolean }>`
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(20, 184, 166, 0.4);
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
  animation: ${slideIn} 0.3s ease-out;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  max-width: 280px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(20, 184, 166, 0.5);
  }
`

const PulsingDot = styled.div`
  width: 8px;
  height: 8px;
  background: #22d3ee;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
`

const ClockIcon = styled.span`
  font-size: 18px;
  display: flex;
  align-items: center;
`

const TimeDisplay = styled.span`
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
`

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const Label = styled.span`
  font-size: 11px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`

export function SimulationBackgroundIndicator() {
  const location = useLocation()
  const { isDailyRunning, getAdjustedSimTime } = useSimulationStore()
  const [dismissed, setDismissed] = useState(false)
  const [currentTime, setCurrentTime] = useState<number | null>(null)

  // Check if we're NOT on the daily simulation page
  const isNotOnDailySimPage = location.pathname !== '/simulacion/diaria'

  // Update time every second to show real-time progress
  useEffect(() => {
    if (!isDailyRunning || !isNotOnDailySimPage) return

    const updateTime = () => {
      const adjusted = getAdjustedSimTime()
      setCurrentTime(adjusted)
    }

    updateTime() // Initial update
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [isDailyRunning, isNotOnDailySimPage, getAdjustedSimTime])

  // Reset dismissed state when navigating to daily simulation page
  useEffect(() => {
    if (!isNotOnDailySimPage) {
      setDismissed(false)
    }
  }, [isNotOnDailySimPage])

  // Only show if simulation is running and we're not on the daily sim page
  const shouldShow = isDailyRunning && isNotOnDailySimPage && !dismissed

  // Format the current simulation time
  const formatSimTime = (timestamp: number | null) => {
    if (!timestamp) return '--:--'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatSimDate = (timestamp: number | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })
  }

  const handleClick = () => {
    // Navigate to daily simulation page
    window.location.href = '/simulacion/diaria'
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  return (
    <FloatingIndicator $show={shouldShow} onClick={handleClick} title="Clic para ir a la simulación">
      <PulsingDot />
      <ClockIcon>⏱️</ClockIcon>
      <TextContent>
        <Label>Simulación activa</Label>
        <TimeDisplay>
          {formatSimDate(currentTime)} {formatSimTime(currentTime)}
        </TimeDisplay>
      </TextContent>
      <CloseButton onClick={handleClose} title="Ocultar">
        ×
      </CloseButton>
    </FloatingIndicator>
  )
}
