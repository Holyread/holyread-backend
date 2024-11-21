import express, { Router } from 'express'
import {
  addSubscriber,
} from '../../controllers/website/subscriber.controller'

const router: Router = express.Router()

router.post('/', addSubscriber)

export default router
