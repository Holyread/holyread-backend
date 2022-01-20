import express, { Router } from 'express'
import {
  addAuthor,
  getOneAuthor,
  getAllAuthors,
  updateAuthor,
  deleteAuthor
} from '../../../controllers/admin/book/author.controller'

const router: Router = express.Router()

router.post('/', addAuthor)
router.get('/:id', getOneAuthor)
router.get('/', getAllAuthors)
router.put('/:id', updateAuthor)
router.delete('/:id', deleteAuthor)

export default router
