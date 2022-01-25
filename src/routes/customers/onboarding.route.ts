import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller'
const router: Router = express.Router()

router.post('/signUp', authController.signUpUser)
router.get('/signUp/verify', authController.verifyUserSignUp)

export default router
