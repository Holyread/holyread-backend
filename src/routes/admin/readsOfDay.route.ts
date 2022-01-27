import express, { Router } from 'express'
import {
  addReadOfDay,
  getOneReadOfDay,
  getAllReadsOfDay,
  updateReadOfDay,
  deleteReadOfDay
} from '../../controllers/admin/readsOfDay.controller'

const router: Router = express.Router()

router.post('/', addReadOfDay)
router.get('/:id', getOneReadOfDay)
router.get('/', getAllReadsOfDay)
router.put('/:id', updateReadOfDay)
router.delete('/:id', deleteReadOfDay)

export default router
