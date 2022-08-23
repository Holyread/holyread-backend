import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller'
const router: Router = express.Router()

router.post('/signUp', authController.signUpUser)
router.get('/signUp/verify', authController.verifyUserSignUp)
router.post('/login', authController.signInUser)
router.post('/oauth-login', authController.oAuthLogin)
router.post('/oauth-signin/app', authController.appOAuthSignIn)
router.post('/oauth-signup/app', authController.appOAuthSignUp)
router.post('/forgot-password', authController.forgotPassoword)
router.post('/verify-password', authController.verifyPassword)

export default router
