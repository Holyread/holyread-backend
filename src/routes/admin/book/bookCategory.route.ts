import express, { Router } from 'express'
import {
  addCategory,
  getOneCategory,
  getAllCategory,
  updateCateogry,
  deleteCategory
} from '../../../controllers/admin/book/bookCategory.controller'

const router: Router = express.Router()

router.post('/', addCategory)
router.get('/:id', getOneCategory)
router.get('/', getAllCategory)
router.put('/:id', updateCateogry)
router.delete('/:id', deleteCategory)

export default router
