import express, { Router } from 'express'
import {
  addUser,
  getOneUser,
  getAllUsers,
  updateUser,
  deleteUser
} from '../../controllers/admin/users.controller'

const router: Router = express.Router()

router.post('/', addUser)
router.get('/:userId', getOneUser)
router.get('/', getAllUsers)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)

export default router
