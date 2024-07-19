import express, { Router } from 'express'
import { exportData, exportUsersData } from '../../controllers/admin/exportData.controller'

const router: Router = express.Router()

router.post('/', exportData)
router.post('/users', exportUsersData )

export default router
