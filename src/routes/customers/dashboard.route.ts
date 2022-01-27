import express, { Router } from 'express'
import {
  getDashboard
} from '../../controllers/customers/dashboard.controller'

import customerPassport from '../../middleware/customers.passport'

const router: Router = express.Router()

router.get('/', customerPassport, getDashboard)
export default router
