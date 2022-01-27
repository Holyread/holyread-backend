import express, { Router } from 'express'

import auth from './customers/auth.route'
import users from './customers/users.route'
import dashboard from './customers/dashboard.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/users', users)
router.use('/dashboard', dashboard)

export default router
