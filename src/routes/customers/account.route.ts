import express, { Router } from 'express'
import {
  getUserAccount,
  getUserSubscription
} from '../../controllers/customers/account.controller'

import customerPassport from '../../middleware/customers.passport'

const router: Router = express.Router()

router.get('/:id', customerPassport, getUserAccount)
router.get('/:id/subscription', customerPassport, getUserSubscription)
export default router
