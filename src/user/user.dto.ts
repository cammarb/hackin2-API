import { Role } from '@prisma/client'

export interface UpdateUser {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
}

export interface UserQueryParams {
  role?: string
}

export interface NewUserBody {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  role: Role
}

export interface LoginUserBody {
  username: string
  password: string
}
