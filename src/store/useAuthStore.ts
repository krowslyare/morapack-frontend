import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type AuthState = {
  session: any | null
  setSession: (session: any | null) => void
  initializeSession: () => void
}

// Intentar restaurar sesión desde localStorage
const getInitialSession = () => {
  try {
    const stored = localStorage.getItem('morapack_session')
    if (stored) {
      const session = JSON.parse(stored)
      console.log('Sesión restaurada desde localStorage:', session)
      return session
    }
  } catch (error) {
    console.error('Error al restaurar sesión:', error)
  }
  return null
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    session: getInitialSession(),
    setSession: (session) => {
      console.log('Actualizando sesión en store:', session)
      
      // Guardar en localStorage
      if (session) {
        try {
          localStorage.setItem('morapack_session', JSON.stringify(session))
        } catch (error) {
          console.error('Error al guardar sesión en localStorage:', error)
        }
      } else {
        // Limpiar localStorage si session es null
        localStorage.removeItem('morapack_session')
      }
      
      set({ session })
    },
    initializeSession: () => {
      const session = getInitialSession()
      set({ session })
    },
  }))
)

