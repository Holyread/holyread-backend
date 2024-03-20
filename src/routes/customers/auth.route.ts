import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller';
import customerLogin from '../../middleware/customers.login.passport'

const router: Router = express.Router()

router.post('/device', authController.initializeDeviceAccess)
router.post('/signUp', authController.signUpUser)
router.get('/verify-email', authController.verifyEmail)
router.post('/verify-password', authController.verifyPassword)
router.post('/sendotp/verify-email', authController.sendVerificationEmail)
router.post('/login', customerLogin, authController.signInUser)
router.post('/signUp/app', authController.appSignUpUser)
router.post('/oauth-signup/app', authController.appOAuthSignUp)
router.post('/forgot-password', authController.forgotPassoword)
router.post('/oauth-login', customerLogin, authController.oAuthLogin)
router.post('/oauth-signin/app', customerLogin, authController.appOAuthSignIn)

export default router
