import express, { Router } from 'express'
import {
  getAllSubscriptions,
} from '../../controllers/customers/subscriptions.controller'

const router: Router = express.Router()

router.get('/', getAllSubscriptions)

export default router
