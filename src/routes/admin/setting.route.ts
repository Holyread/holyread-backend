import express, { Router } from 'express'
import {
  getSetting,
  updateSetting
} from '../../controllers/admin/setting.controller'

const router: Router = express.Router()

router.get('/', getSetting)
router.put('/', updateSetting)

export default router
