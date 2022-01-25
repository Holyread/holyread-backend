import express, { Router } from 'express'
import onboard from './customers/onboarding.route'

const router: Router = express.Router()

router.use('/onboard', onboard)

export default router
