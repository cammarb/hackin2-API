import { NextFunction, Request, Response } from 'express'
import jwt, { DecodeOptions, JwtPayload } from 'jsonwebtoken'

interface CustomRequest extends Request {
  username: string
  role: number
}

const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) return res.sendStatus(401)

  const token = authHeader.split(' ')[1]
  const secret = process.env.ACCESS_TOKEN_SECRET

  if (!secret) {
    res.status(401).json({ error: 'Verification failed' })
  } else {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return res.sendStatus(403)
      const payload = decoded as JwtPayload
      req.username = payload.username
      req.role = payload.role
      next()
    })
  }
}

export { verifyJWT }
