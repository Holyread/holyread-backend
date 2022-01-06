import express, { Router } from 'express'
import {
  addCategory,
  getOneCategory,
  getAllCategory,
  updateCateogry,
  deleteCategory
} from '../../controllers/admin/bookCategory.controller'

import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addCategory)
router.get('/:id', adminPassport, getOneCategory)
router.get('/', adminPassport, getAllCategory)
router.put('/:id', adminPassport, updateCateogry)
router.delete('/:id', adminPassport, deleteCategory)

export default router
