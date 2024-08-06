import express, { Router } from 'express'
import {
  addUser,
  updateUser,
  deleteUser,
  getOneUser,
  getAllUsers,
  getCountries,
  getTimeZones
} from '../../controllers/admin/users.controller'

const router: Router = express.Router()

router.post('/', addUser)
router.get('/', getAllUsers)
router.get('/countries', getCountries)
router.get('/timezones', getTimeZones)
router.get('/:userId', getOneUser)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)

export default router
