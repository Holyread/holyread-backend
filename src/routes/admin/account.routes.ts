import express, { Router } from 'express'
import accountController from '../../controllers/admin/account.controller'
const router: Router = express.Router()

router.post('/forgot-password', accountController.forgotPassoword)
router.post('/verify-password', accountController.verifyPassword)

export default router
