import { TypeUser } from './TypeUser'

export interface SessionSchema {
  id: number
  userId: number
  userName: string
  userLastName: string
  userType: TypeUser
  loginTime: string // LocalDateTime in Java maps to string in TS
  lastActivity: string // LocalDateTime in Java maps to string in TS
  active: boolean
}
