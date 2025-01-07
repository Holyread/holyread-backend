import express, { Router } from 'express'
import {
  addCronSchedule,
  deleteCronSchedule,
  getAllCronSchedule,
  getOneCronSchedule,
  updateCronSchedule
} from '../../controllers/admin/cronSchedule.controller'

const router: Router = express.Router()

router.post('/', addCronSchedule)
router.get('/:id', getOneCronSchedule)
router.get('/', getAllCronSchedule)
router.put('/:id', updateCronSchedule)
router.delete('/:id', deleteCronSchedule)

export default router
