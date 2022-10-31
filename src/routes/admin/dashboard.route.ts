import express, { Router } from 'express'
import {
  getDashboard,
  getTopReadsBooks
} from '../../controllers/admin/dashboard.controller'

const router: Router = express.Router()

router.get('/', getDashboard)
router.get('/top-reads', getTopReadsBooks)

export default router
