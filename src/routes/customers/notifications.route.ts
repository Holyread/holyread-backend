import express, { Router } from 'express'
import {
  createUserNotification,
  deleteUserNotification
} from '../../controllers/customers/notification.controller'

const router: Router = express.Router()

router.post('/', createUserNotification)
router.delete('/', deleteUserNotification)

export default router
