import { SessionSchema } from './SessionSchema'

export interface AuthResponse {
  success: boolean
  message: string
  session?: SessionSchema
}
