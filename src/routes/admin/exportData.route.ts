import express, { Router } from 'express'
import { exportData } from '../../controllers/admin/exportData.controller'

const router: Router = express.Router()

router.post('/', exportData)

export default router
