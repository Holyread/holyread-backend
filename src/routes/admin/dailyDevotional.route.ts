import express, { Router } from 'express'
import {
  addDailyDevotional,
  getOneDailyDevotional,
  getAllDailyDevotional,
  updateDailyDevotional,
  deleteDailyDevotional,
} from '../../controllers/admin/dailyDevotional.controller'

const router: Router = express.Router()

router.post('/', addDailyDevotional)
router.get('/:id', getOneDailyDevotional)
router.get('/', getAllDailyDevotional)
router.put('/:id', updateDailyDevotional)
router.delete('/:id', deleteDailyDevotional)

export default router
