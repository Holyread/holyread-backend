import express, { Router } from 'express'
import {
  addUser,
  updateUser,
  deleteUser,
  getOneUser,
  getAllUsers,
  getUsersCsv,
} from '../../controllers/admin/users.controller'

const router: Router = express.Router()

router.post('/', addUser)
router.get('/', getAllUsers)
router.get('/:userId', getOneUser)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)
router.get('/exports/csv', getUsersCsv)

export default router
