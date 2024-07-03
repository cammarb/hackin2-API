import { Router } from 'express'
import authRouter from './auth.routes'
import { checkSession, verifyJWT } from '../middleware/auth.middleware'
import userRouter from './user.routes'
import { checkEnterprise, checkPentester } from '../middleware/roles.middleware'
import companyRouter from './company.routes'
import pentesterRoutes from './pentester.routes'

export const apiRoutes: Router = Router()

apiRoutes.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Hackin2 API.' })
})
apiRoutes.use('/auth', authRouter)
apiRoutes.use('/user', checkSession, userRouter)
apiRoutes.use('/company', checkSession, checkEnterprise, companyRouter)
apiRoutes.use('/pentester', checkSession, checkPentester, pentesterRoutes)
