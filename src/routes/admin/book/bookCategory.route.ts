import express, { Router } from 'express'
import {
  addCategory,
  getOneCategory,
  getAllCategory,
  updateCateogry,
  deleteCategory,
  getAllCategoriesOptionsList
} from '../../../controllers/admin/book/bookCategory.controller'

const router: Router = express.Router()

router.post('/', addCategory)
router.get('/:id', getOneCategory)
router.get('/', getAllCategory)
router.get('/optionsList/all', getAllCategoriesOptionsList)
router.put('/:id', updateCateogry)
router.delete('/:id', deleteCategory)

export default router
