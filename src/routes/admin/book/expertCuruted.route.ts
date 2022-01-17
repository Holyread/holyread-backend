import express, { Router } from 'express'
import {
  addExpertCuruted,
  getAllExpertCuruted,
  getOneExpertCuruted,
  updateExpertCuruted,
  deleteExpertCuruted
} from '../../../controllers/admin/book/expertCuruted.controller';

import adminPassport from '../../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addExpertCuruted)
router.get('/:id', adminPassport, getOneExpertCuruted)
router.get('/', adminPassport, getAllExpertCuruted)
router.put('/:id', adminPassport, updateExpertCuruted)
router.delete('/:id', adminPassport, deleteExpertCuruted)

export default router
