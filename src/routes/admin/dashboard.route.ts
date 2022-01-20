import express, { Router } from 'express'
import {
  getDashboard
} from '../../controllers/admin/dashboard.controller'

const router: Router = express.Router()

router.get('/', getDashboard)

export default router
