import express, { Router } from 'express'
import {
  addSummary,
  getOneSummary,
  getAllSummaries,
  updateSummary,
  deleteSummary,
  getAllSummariesNames
} from '../../../controllers/admin/book/bookSummary.controller'

const router: Router = express.Router()

router.post('/', addSummary)
router.get('/:id', getOneSummary)
router.get('/', getAllSummaries)
router.get('/names/all', getAllSummariesNames)
router.put('/:id', updateSummary)
router.delete('/:id', deleteSummary)

export default router
