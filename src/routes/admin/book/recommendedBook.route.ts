import express, { Router } from 'express'
import {
  addRecommendedBook,
  getOneRecommendedBook,
  getAllRecommendedBooks,
  deleteRecommendedBook
} from '../../../controllers/admin/book/recommendedBook.controller'

import adminPassport from '../../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addRecommendedBook)
router.get('/:id', adminPassport, getOneRecommendedBook)
router.get('/', adminPassport, getAllRecommendedBooks)
router.delete('/:id', adminPassport, deleteRecommendedBook)

export default router
