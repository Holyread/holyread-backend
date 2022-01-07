import express, { Router } from 'express'
import {
  addSummary,
  getOneSummary,
  getAllSummaries,
  updateSummary,
  deleteSummary
} from '../../../controllers/admin/book/bookSummary.controller'

import adminPassport from '../../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addSummary)
router.get('/:id', adminPassport, getOneSummary)
router.get('/', adminPassport, getAllSummaries)
router.put('/:id', adminPassport, updateSummary)
router.delete('/:id', adminPassport, deleteSummary)

export default router
