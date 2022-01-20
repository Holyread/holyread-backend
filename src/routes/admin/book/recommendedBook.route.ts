import express, { Router } from 'express'
import {
  addRecommendedBook,
  getOneRecommendedBook,
  getAllRecommendedBooks,
  deleteRecommendedBook
} from '../../../controllers/admin/book/recommendedBook.controller'

const router: Router = express.Router()

router.post('/', addRecommendedBook)
router.get('/:id', getOneRecommendedBook)
router.get('/', getAllRecommendedBooks)
router.delete('/:id', deleteRecommendedBook)

export default router
