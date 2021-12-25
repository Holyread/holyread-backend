import express, { Router } from 'express'
import auth from './customers/auth.route'
import account from './customers/account.route'

const router: Router = express.Router()

router.use('/auth', auth)
router.use('/account', account)

export default router
