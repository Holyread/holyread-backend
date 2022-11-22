import express, { Router } from 'express'
import {
  getDashboard,
  getTopReadsBooks,
  getUserAnylatics,
} from '../../controllers/admin/dashboard.controller'

const router: Router = express.Router()

router.get('/', getDashboard)
router.get('/top-reads', getTopReadsBooks)
router.get('/anlytics', getUserAnylatics)

export default router
