import express, { Router } from 'express'
import {
  getUserNotifications,
  sendCustomNotificationToAllUsers,
} from '../../controllers/admin/customNotification.controller'

const router: Router = express.Router()

router.post('/', sendCustomNotificationToAllUsers)
router.get('/', getUserNotifications)

export default router