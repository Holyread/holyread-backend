import express, { Router } from 'express'
import {
  getAllSummaries,
  getOneSummary,
  sendSummaryToKindle
} from '../../../controllers/customers/book/bookSummary.controller'

const router: Router = express.Router()

router.get('/', getAllSummaries)
router.get('/:id', getOneSummary)
router.post('/sent-to-kindle/:id', sendSummaryToKindle)

export default router
