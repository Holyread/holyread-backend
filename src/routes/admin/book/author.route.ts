import express, { Router } from 'express'
import {
  addAuthor,
  getOneAuthor,
  getAllAuthors,
  updateAuthor,
  deleteAuthor,
  getAllAuthorsNames
} from '../../../controllers/admin/book/author.controller'

const router: Router = express.Router()

router.post('/', addAuthor)
router.get('/:id', getOneAuthor)
router.get('/', getAllAuthors)
router.get('/names/all', getAllAuthorsNames)
router.put('/:id', updateAuthor)
router.delete('/:id', deleteAuthor)

export default router
