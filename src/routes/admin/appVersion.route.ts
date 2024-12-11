import express, { Router } from 'express'
import {
    addAppVersion,
    deleteAppVersion,
    getOneAppVersion,
    updateAppVersion,
    getAllAppVersion,
} from '../../controllers/admin/appVersion.controller'

const router: Router = express.Router()

router.post('/', addAppVersion)
router.get('/:id', getOneAppVersion)
router.get('/', getAllAppVersion)
router.put('/:id', updateAppVersion)
router.delete('/:id', deleteAppVersion)

export default router
