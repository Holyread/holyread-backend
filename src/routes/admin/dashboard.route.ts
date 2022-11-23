import express, { Router } from 'express'
import {
  getDashboard,
  getTopReadsBooks,
  getUserAnaylatics,
} from '../../controllers/admin/dashboard.controller'

const router: Router = express.Router()

router.get('/', getDashboard)
router.get('/top-reads', getTopReadsBooks)
router.get('/analytics', getUserAnaylatics)

export default router
