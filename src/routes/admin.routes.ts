import express, { Router } from 'express'
import adminPassport from '../middleware/admin.passport'
import auth from './admin/auth.route'
import users from './admin/users.route'
import account from './admin/account.routes'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/:id/users', adminPassport, users)
router.use('/account', account)
export default router
