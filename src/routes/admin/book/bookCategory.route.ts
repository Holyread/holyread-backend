import express, { Router } from 'express'
import {
  addCategory,
  getOneCategory,
  getAllCategory,
  updateCateogry,
  deleteCategory,
  getAllCategoriesNames
} from '../../../controllers/admin/book/bookCategory.controller'

const router: Router = express.Router()

router.post('/', addCategory)
router.get('/:id', getOneCategory)
router.get('/', getAllCategory)
router.get('/names/all', getAllCategoriesNames)
router.put('/:id', updateCateogry)
router.delete('/:id', deleteCategory)

export default router
