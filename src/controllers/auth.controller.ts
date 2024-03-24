import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../utilts/client'
import { RefreshToken, User } from '@prisma/client'
import { generateTokens } from '../utilts/auth'
import jwt, { JwtPayload } from 'jsonwebtoken'
import fs from 'fs'
import * as EmailValidator from 'email-validator'
import hashToken from '../utilts/hash'

export const handleRegistration = async (req: Request, res: Response) => {
  const { username, email, firstName, lastName, password, role } = req.body
  if (!username || !password || !email || !firstName || !lastName || !role)
    return res.status(400).json({ messaege: 'All the fields are required' })

  if (!EmailValidator.validate(email))
    return res.status(400).json({ messaege: 'Enter a valid email' })

  const user: User[] | null = await prisma.user.findMany({
    where: {
      OR: [{ username: username }, { email: email }],
    },
  })
  if (typeof user === null) return res.sendStatus(409)
  try {
    const hashedPassword = await hashToken(password)
    const user: User = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: hashedPassword,
        role: role,
      },
    })
    // const userProfile: UserProfile = await prisma.userProfile.create({
    //   data: {
    //     userId: user.id,
    //   },
    // })
    res.status(201).json({ success: 'User created successfully' })
  } catch (err: Error | any) {
    res.status(500).json({ message: err?.message })
  }
}

const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (
    !username ||
    !password ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  )
    res.status(400).json({
      error: 'Bad Request',
      message: 'Both username and password are required',
    })

  const user: User | null = await prisma.user.findUnique({
    where: {
      username: username,
    },
  })

  if (!user) {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password',
    })
  } else {
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      })
    } else {
      const tokens = await generateTokens(user)

      const refreshToken: RefreshToken = await prisma.refreshToken.create({
        data: {
          hashedToken: tokens.refreshToken,
          userId: user.id,
        },
      })

      res.cookie('jwt', tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      })

      res.status(200).json({
        user: user.username,
        role: user.role,
        token: `${tokens.accessToken}`,
      })
    }
  }
}

const handleRefreshToken = async (req: Request, res: Response) => {
  const jwtCookie = req.cookies['jwt']

  const tokenSecretKey = fs.readFileSync(`${process.env.PUBKEY}`, 'utf8')

  if (!jwtCookie || !tokenSecretKey)
    return res.status(401).json({ message: 'Unauthorized' })

  const decoded: JwtPayload = jwt.verify(
    jwtCookie,
    tokenSecretKey,
  ) as JwtPayload

  if (!decoded) return res.sendStatus(401)

  const user: User | null = await prisma.user.findUnique({
    where: {
      username: decoded.username,
    },
  })
  if (!user) return res.sendStatus(401) // Unauthorized

  // revoke old refreshToken and add new refreshToken to db
  const oldToken = await prisma.refreshToken.findUnique({
    where: {
      hashedToken: jwtCookie,
    },
  })
  const updatedToken = await prisma.refreshToken.update({
    where: {
      hashedToken: oldToken?.hashedToken,
    },
    data: {
      revoked: true,
    },
  })
  try {
    const newTokens = await generateTokens(user)
    const newRefreshToken: RefreshToken = await prisma.refreshToken.create({
      data: {
        hashedToken: newTokens.refreshToken,
        userId: user.id,
      },
    })
    res.cookie('jwt', newTokens.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    })
    res.status(200).json({
      user: user.username,
      role: user.role,
      token: `${newTokens.accessToken}`,
    })
  } catch (error) {
    console.log(error)
  }
}

const handleLogOut = async (req: Request, res: Response) => {
  const jwtCookie = req.cookies['jwt']
  const jwtHeader = req.headers['authorization']

  if (!jwtCookie || !jwtHeader) {
    return res.sendStatus(204)
  }

  try {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true })
    res.removeHeader('authorization')
    const token = await prisma.refreshToken.updateMany({
      where: {
        hashedToken: jwtCookie,
      },
      data: {
        revoked: true,
      },
    })
    res.sendStatus(204).json({ message: 'Log Out successful.' })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export { handleLogin, handleRefreshToken, handleLogOut }
