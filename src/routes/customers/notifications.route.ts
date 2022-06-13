import express, { Router } from 'express'
import {
  createUserNotification
} from '../../controllers/customers/notification.controller'

const router: Router = express.Router()

router.post('/', createUserNotification)

export default router
