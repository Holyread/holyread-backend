import express, { Router } from 'express'
import {
  getOneAdmin,
  getOneUser,
  updateUser,
  deleteUser
} from '../controllers/admin/admin.controller'

import adminPassport from '../middleware/admin.passport'

const router: Router = express.Router()

router.get('/:id', adminPassport, getOneAdmin)
router.put('/:id/users/:userId', adminPassport, updateUser)
router.get('/:id/users/:userId', adminPassport, getOneUser)
router.delete('/:id/users/:userId', adminPassport, deleteUser)

export default router
