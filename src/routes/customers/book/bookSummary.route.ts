import express, { Router } from 'express'
import {
  getAllSummaries,
  getOneSummary
} from '../../../controllers/customers/book/bookSummary.controller'

const router: Router = express.Router()

router.get('/', getAllSummaries)
router.get('/:id', getOneSummary)

export default router
