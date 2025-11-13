import styled from 'styled-components'
import { motion } from 'framer-motion'

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8ecef 0%, #f0f3f6 100%);
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
`

const SVGContainer = styled(motion.svg)`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.13;
`

const Line = styled(motion.line)`
  stroke: #1eb79a;
  stroke-width: 1;
`

const Circle = styled(motion.circle)`
  fill: none;
  stroke: #1eb79a;
  stroke-width: 1;
`

const Path = styled(motion.path)`
  fill: none;
  stroke: #1eb79a;
  stroke-width: 1;
`

export function AnimatedBackground() {
  return (
    <BackgroundContainer>
      <SVGContainer viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Líneas sutiles horizontales */}
        <motion.g
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Line x1="0" y1="200" x2="1200" y2="200" />
          <Line x1="0" y1="600" x2="1200" y2="600" />
        </motion.g>

        {/* Círculos sutiles */}
        <motion.g>
          <Circle
            cx="300"
            cy="200"
            r="50"
            animate={{ r: [50, 65, 50] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Circle
            cx="900"
            cy="600"
            r="60"
            animate={{ r: [60, 75, 60] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </motion.g>

        {/* Curva sutil */}
        <motion.g
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Path d="M 0 400 Q 300 350 600 400 T 1200 400" />
        </motion.g>

        {/* Pocos puntos flotantes */}
        <motion.g>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.circle
              key={i}
              cx={200 + i * 250}
              cy={300 + (i % 2) * 200}
              r="2"
              fill="#1eb79a"
              animate={{
                y: [0, 30, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </motion.g>
      </SVGContainer>
    </BackgroundContainer>
  )
}
