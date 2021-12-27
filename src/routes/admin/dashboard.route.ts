import express, { Router } from 'express'
import {
  getDashboard
} from '../../controllers/admin/dashboard.controller'

import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.get('/', adminPassport, getDashboard)

export default router
