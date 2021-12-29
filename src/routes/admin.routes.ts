import express, { Router } from 'express'
import adminPassport from '../middleware/admin.passport'
import auth from './admin/auth.route'
import users from './admin/users.route'
import subscriptions from './admin/subscriptions.route'
import dashboard from './admin/dashboard.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/:id/users', adminPassport, users)
router.use('/subscriptions', subscriptions)
router.use('/:id/dashboard', dashboard)
export default router
