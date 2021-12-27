import express, { Router } from 'express'
import authService from '../../controllers/admin/auth.controller'
const router: Router = express.Router()

router.post('/login', authService.signInUser)
router.post('/login/verify', authService.verifySignInOtp)

export default router
