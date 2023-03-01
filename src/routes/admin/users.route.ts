import express, { Router } from 'express'
import {
  addUser,
  updateUser,
  deleteUser,
  getOneUser,
  getAllUsers,
} from '../../controllers/admin/users.controller'

const router: Router = express.Router()

router.post('/', addUser)
router.get('/', getAllUsers)
router.get('/:userId', getOneUser)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)

export default router
