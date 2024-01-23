import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller';
import customerLogin from '../../middleware/customers.login.passport'

const router: Router = express.Router()

router.post('/signUp', authController.signUpUser)
router.post('/signUp/verify-later', authController.verifyLater)
router.get('/signUp/verify', authController.verifyUserSignUp)
router.post('/verify-password', authController.verifyPassword)
router.post('/signUp/resend', authController.resendSignUpEmail)
router.post('/login', customerLogin, authController.signInUser)
router.post('/oauth-signup/app', authController.appOAuthSignUp)
router.post('/forgot-password', authController.forgotPassoword)
router.post('/oauth-login', customerLogin, authController.oAuthLogin)
router.post('/oauth-signin/app', customerLogin, authController.appOAuthSignIn)

export default router
