import express, { Router } from 'express'
import adminPassport from '../middleware/admin.passport'
import auth from './admin/auth.route'
import users from './admin/users.route'
import account from './admin/account.routes'
import subscriptions from './admin/subscriptions.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/:id/users', adminPassport, users)
router.use('/account', account)
router.use('/subscriptions', subscriptions)
export default router
