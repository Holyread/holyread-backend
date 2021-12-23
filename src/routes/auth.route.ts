import express, { Router } from 'express'
import authService from '../controllers/auth/auth.controller'
const router: Router = express.Router()

router.post('/login', authService.signInUser)
router.post('/signUp', authService.signUpUser)

export default router
