import { useEffect } from 'react'
import { useMotionValue, useTransform, motion, useMotionTemplate, animate } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
}

export function AnimatedNumber({
  value,
  duration = 2,
  suffix = '',
  prefix = '',
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const displayValue = useTransform(motionValue, (val) =>
    Math.floor(val).toLocaleString()
  )
  const text = useMotionTemplate`${prefix}${displayValue}${suffix}`

  useEffect(() => {
    const controls = animate(motionValue, value, { duration })
    return () => controls.stop()
  }, [value, duration, motionValue])

  return <motion.span>{text}</motion.span>
}
