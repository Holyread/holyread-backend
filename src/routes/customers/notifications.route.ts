import express, { Router } from 'express'
import {
  updateUserNotification
} from '../../controllers/customers/notification.controller'

const router: Router = express.Router()

router.patch('/', updateUserNotification)

export default router
