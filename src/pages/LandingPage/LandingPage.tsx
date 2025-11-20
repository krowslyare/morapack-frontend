import { motion, AnimatePresence } from 'framer-motion'
import { Navigate, useNavigate } from 'react-router-dom'
import { MainHeader } from '../../components/layout/MainHeader'
import { AnimatedBackground } from '../../components/ui/AnimatedBackground'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/useAuthStore'
import { MODULE_INFO, type ModuleKey } from '../../config/permissions'  // 👈 importa el tipo
import * as S from './LandingPage.styles'
import { useState } from 'react'

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
  const [transitionModuleKey, setTransitionModuleKey] = useState<ModuleKey | null>(null)
  const navigate = useNavigate()

  // Si no hay sesión, redirigir a login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleModuleClick = (moduleKey: ModuleKey) => {
    const module = MODULE_INFO[moduleKey]
    if (!module) return

    // disparamos overlay
    setTransitionModuleKey(moduleKey)
  }

  const handleTransitionComplete = () => {
    if (!transitionModuleKey) return

    const module = MODULE_INFO[transitionModuleKey]
    if (!module) return

    // Espera ~700 ms después de terminar la animación principal
    setTimeout(() => {
      navigate(module.path)
    }, 700)
  }

  const transitionModule = transitionModuleKey
    ? MODULE_INFO[transitionModuleKey]
    : null

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
                      <S.ModuleTile
                        as={motion.button}
                        whileHover={{
                          y: -6,
                          scale: 1.02,
                          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
                        }}
                        whileTap={{ scale: 0.97, y: 0 }}
                        onClick={() => handleModuleClick(moduleKey)}
                      >
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

      {/* Overlay de transición tipo McLaren */}
      <AnimatePresence>
        {transitionModule && (
          <S.TransitionOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.42, 0, 0.58, 1] }}
          >
            <S.TransitionContent>
              <S.TransitionCircle
                as={motion.div}
                initial={{ scale: 0.3, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: -20 }}
                transition={{
                  duration: 0.55,
                  ease: [0.23, 1, 0.32, 1],
                }}
                onAnimationComplete={handleTransitionComplete}
              >
                {/* Anillo de carga girando */}
                <S.TransitionRing
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />

                <span className="material-symbols-outlined">
                  {transitionModule.icon}
                </span>
              </S.TransitionCircle>

              <S.TransitionLabel
                as={motion.div}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ delay: 0.1, duration: 0.35 }}
              >
                {transitionModule.label}
              </S.TransitionLabel>

              <S.TransitionSub>
                Cargando módulo…
              </S.TransitionSub>
            </S.TransitionContent>
          </S.TransitionOverlay>
        )}
      </AnimatePresence>
    </>
  )
}
