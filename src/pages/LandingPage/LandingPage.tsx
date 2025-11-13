import { motion } from 'framer-motion'
import { MainHeader } from '../../components/layout/MainHeader'
import { AnimatedBackground } from '../../components/ui/AnimatedBackground'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { usePermissions } from '../../hooks/usePermissions'
import { MODULE_INFO } from '../../config/permissions'
import * as S from './LandingPage.styles'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0, 0, 0.58, 1] as const,
    },
  },
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1] as const,
    },
  },
}

export function LandingPage() {
  const { getAvailableModules } = usePermissions()
  const availableModules = getAvailableModules()

  return (
    <>
      <AnimatedBackground />
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageVariants}
      >
        <S.Page>
          <MainHeader />

        <S.Container as={motion.div} variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <S.Title>Seleccione un módulo</S.Title>
          </motion.div>

          <motion.div variants={containerVariants}>
            <S.Modules>
              {availableModules.map((moduleKey) => {
                const module = MODULE_INFO[moduleKey]
                return (
                  <motion.div key={moduleKey} variants={itemVariants}>
                    <S.ModuleTile onClick={() => (window.location.href = module.path)}>
                      <span className="material-symbols-outlined">{module.icon}</span>
                      {module.label}
                    </S.ModuleTile>
                  </motion.div>
                )
              })}
            </S.Modules>
          </motion.div>

          <motion.div variants={containerVariants}>
            <S.Stats>
              <motion.div variants={itemVariants}>
                <S.StatCard>
                  <S.StatValue>
                    <AnimatedNumber value={80} suffix="%" />
                  </S.StatValue>
                  <S.StatLabel>Entregas A Tiempo</S.StatLabel>
                </S.StatCard>
              </motion.div>
              <motion.div variants={itemVariants}>
                <S.StatCard>
                  <S.StatValue>
                    <AnimatedNumber value={50} />
                  </S.StatValue>
                  <S.StatLabel>Capacidad Usada De Almacenes</S.StatLabel>
                </S.StatCard>
              </motion.div>
              <motion.div variants={itemVariants}>
                <S.StatCard>
                  <S.StatValue>
                    <AnimatedNumber value={60} />
                  </S.StatValue>
                  <S.StatLabel>Vuelos Enviados</S.StatLabel>
                </S.StatCard>
              </motion.div>
            </S.Stats>
          </motion.div>
        </S.Container>
      </S.Page>
    </motion.div>
    </>
  )
}
