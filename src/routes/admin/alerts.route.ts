import express, { Router } from 'express'
import adminPassport from '../../middleware/admin.passport'
import { fetchPipelineAlerts } from '../../controllers/admin/alerts.controller'

const router: Router = express.Router()

router.get('/', adminPassport, fetchPipelineAlerts)

export default router
