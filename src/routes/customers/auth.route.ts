import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller'
const router: Router = express.Router()

router.post('/login', authController.signInUser)
router.post('/signUp', authController.signUpUser)
router.get('/signUp/:code', authController.verifyUserSignUp)
router.post('/forgot-password', authController.forgotPassoword)
router.post('/verify-password', authController.verifyPassword)

export default router
