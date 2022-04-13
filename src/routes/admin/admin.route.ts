import express, { Router } from 'express'
import {
  getAdmin,
  updateAdmin,
  changePassword
} from '../../controllers/admin/admin.controller'

import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.get('/', adminPassport, getAdmin)
router.put('/', adminPassport, updateAdmin)
router.post('/change-password', adminPassport, changePassword)
export default router
