import express, { Router } from 'express'
import {
  getUserAccount,
  changePassword,
  getUserSubscription
} from '../../controllers/customers/account.controller'

import customerPassport from '../../middleware/customers.passport'

const router: Router = express.Router()

router.get('/:id', customerPassport, getUserAccount)
router.put('/:id/change-password', customerPassport, changePassword)
router.get('/:id/subscription', customerPassport, getUserSubscription)
export default router
