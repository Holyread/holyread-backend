import express, { Router } from 'express'
import {
  getBooksCountForDashboard,
  getDashboard,
  getTopReadsBooks,
  getUserAnaylatics,
} from '../../controllers/admin/dashboard.controller'

const router: Router = express.Router()

router.get('/', getDashboard)
router.get('/top-reads', getTopReadsBooks)
router.get('/analytics', getUserAnaylatics)
router.get('/books', getBooksCountForDashboard)

export default router
