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

router.get('/', customerPassport, getUserAccount)
router.put('/', customerPassport, updateUserAccount)
router.put('/change-password', customerPassport, changePassword)
router.get('/subscription', customerPassport, getUserSubscription)
router.get('/library', customerPassport, getUserLibrary)
router.patch('/library', customerPassport, updateUserLibrary)

export default router
