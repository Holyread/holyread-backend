import express, { Router } from 'express'
import {
  getAllBooks,
} from '../../../controllers/website/book/bookSummary.controller'

const router: Router = express.Router()

router.get('/', getAllBooks)

export default router
