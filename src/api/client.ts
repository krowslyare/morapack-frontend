import axios from 'axios'

// Cliente principal con timeout estándar de 30 segundos para operaciones normales
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 segundos
})

// Cliente especial para operaciones largas (algoritmo ALNS)
// El algoritmo puede tomar 30-90 minutos según especificaciones
export const apiLongRunning = axios.create({
  baseURL: '/api',
  timeout: 5400000, // 90 minutos (90 * 60 * 1000)
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error)
  },
)

apiLongRunning.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error)
  },
)
