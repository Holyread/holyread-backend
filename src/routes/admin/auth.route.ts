import express, { Router } from 'express'
import authController from '../../controllers/admin/auth.controller'
const router: Router = express.Router()

router.post('/login', authController.signInUser)
router.post('/login/verify', authController.verifySignInOtp)
router.post('/forgot-password', authController.forgotPassoword)
router.post('/verify-password', authController.verifyPassword)

export default router
