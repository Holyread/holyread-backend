import express, { Router } from 'express'
import adminPassport from '../middleware/admin.passport'
import auth from './admin/auth.route'
import users from './admin/users.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/:id/users', adminPassport, users)

export default router
