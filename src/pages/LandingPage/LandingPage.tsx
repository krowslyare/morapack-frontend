import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { MainHeader } from '../../components/layout/MainHeader'
import { AnimatedBackground } from '../../components/ui/AnimatedBackground'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/useAuthStore'
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

const guideCards = [
  {
    title: 'Preparar datos',
    description: 'Carga aeropuertos, vuelos y productos desde Datos.',
    tags: ['Carga masiva', 'Validaciones'] as const,
  },
  {
    title: 'Ajustar planificación',
    description: 'Define parámetros y metas antes de publicar propuestas.',
    tags: ['Parámetros', 'KPIs'] as const,
  },
  {
    title: 'Probar simulaciones',
    description: 'Ejecuta escenarios diario, semanal o colapso antes de enviar.',
    tags: ['Diaria', 'Semanal', 'Colapso'] as const,
  },
]

export function LandingPage() {
  const session = useAuthStore((s) => s.session)
  const { getAvailableModules } = usePermissions()
  const availableModules = getAvailableModules()

  // Si no hay sesión, redirigir a login
  if (!session) {
    return <Navigate to="/login" replace />
  }

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
            <S.Guides>
              {guideCards.map((card) => (
                <motion.div key={card.title} variants={itemVariants}>
                  <S.GuideCard>
                    <div>
                      <S.GuideTitle>{card.title}</S.GuideTitle>
                      <S.GuideDescription>{card.description}</S.GuideDescription>
                    </div>
                    <S.GuideTags>
                      {card.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </S.GuideTags>
                  </S.GuideCard>
                </motion.div>
              ))}
            </S.Guides>
          </motion.div>
        </S.Container>
      </S.Page>
    </motion.div>
    </>
  )
}
