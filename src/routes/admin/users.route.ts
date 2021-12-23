import express, { Router } from 'express'
import {
  addUser,
  getOneUser,
  getAllUsers,
  updateUser,
  deleteUser
} from '../../controllers/admin/users.controller'

import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addUser)
router.get('/:userId', adminPassport, getOneUser)
router.get('/', adminPassport, getAllUsers)
router.put('/:userId', adminPassport, updateUser)
router.delete('/:userId', adminPassport, deleteUser)

export default router
