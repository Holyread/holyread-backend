import express, { Router } from 'express'
import auth from './customers/auth.route'
import users from './customers/users.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/users', users)

export default router
