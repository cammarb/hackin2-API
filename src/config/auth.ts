import { User } from '@prisma/client'
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import fs from 'fs'

const generateAccessToken = (user: User): string => {
  const payload: JwtPayload = {
    username: user.username,
    role: user.roleId,
  }
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: '5m',
    issuer: process.env.ISSUER,
  }

  if (!process.env.PRIVKEY) throw new Error('key is not defined')

  const accessSecret: jwt.Secret = fs.readFileSync(`${process.env.PRIVKEY}`, {
    encoding: 'utf-8',
  })

  return jwt.sign(payload, accessSecret, options)
}

const generateRefreshToken = (user: User): string => {
  const payload: JwtPayload = { username: user.username, role: user.roleId }
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: '8h',
    issuer: process.env.ISSUER,
  }

  if (!process.env.PRIVKEY) throw new Error('key is not defined')

  const refreshSecret: jwt.Secret = fs.readFileSync(`${process.env.PRIVKEY}`, {
    encoding: 'utf-8',
  })

  return jwt.sign(payload, refreshSecret, options)
}

const generateTokens = (
  user: User
): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  return {
    accessToken,
    refreshToken,
  }
}

export { generateAccessToken, generateRefreshToken, generateTokens }
