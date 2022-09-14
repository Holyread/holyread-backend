import express, { Router } from 'express'
import {
  createUserNotification,
  updateUserNotification
} from '../../controllers/customers/notification.controller'

const router: Router = express.Router()

router.post('/', createUserNotification)
router.put('/', updateUserNotification)

export default router
