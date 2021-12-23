import express, { Router } from 'express'
import authController from '../../controllers/customers/auth.controller'
const router: Router = express.Router()

router.post('/login', authController.signInUser)
router.post('/signUp', authController.signUpUser)

export default router
