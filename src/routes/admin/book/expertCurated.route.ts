import express, { Router } from 'express'
import {
  addExpertCurated,
  getAllExpertCurated,
  getOneExpertCurated,
  updateExpertCurated,
  deleteExpertCurated
} from '../../../controllers/admin/book/expertCurated.controller';

import adminPassport from '../../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addExpertCurated)
router.get('/:id', adminPassport, getOneExpertCurated)
router.get('/', adminPassport, getAllExpertCurated)
router.put('/:id', adminPassport, updateExpertCurated)
router.delete('/:id', adminPassport, deleteExpertCurated)

export default router
