import express, { Router } from 'express'
import {
  createUserNotification,
  updateUserNotification,
  deleteUserNotification
} from '../../controllers/customers/notification.controller'

const router: Router = express.Router()

router.post('/', createUserNotification)
router.put('/', updateUserNotification)
router.delete('/', deleteUserNotification)

export default router
