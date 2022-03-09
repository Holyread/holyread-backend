import express, { Router } from 'express'
import {
  getUserAccount,
  changePassword,
  getUserSubscription,
  updateUserAccount,
  updateUserLibrary,
  getUserLibrary,
} from '../../controllers/customers/users.controller'

import customerPassport from '../../middleware/customers.passport'

const router: Router = express.Router()

router.get('/:id', customerPassport, getUserAccount)
router.put('/:id', customerPassport, updateUserAccount)
router.put('/:id/change-password', customerPassport, changePassword)
router.get('/:id/subscription', customerPassport, getUserSubscription)
router.get('/:id/library', customerPassport, getUserLibrary)
router.patch('/:id/library', customerPassport, updateUserLibrary)

export default router
