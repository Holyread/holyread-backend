import express, { Router } from 'express'
import {
  getAdmin,
  updateAdmin
} from '../../controllers/admin/admin.controller'
2
import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.get('/:id', adminPassport, getAdmin)
router.put('/:id', adminPassport, updateAdmin)

export default router
