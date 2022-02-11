import express, { Router } from 'express'
import {
  addAuthor,
  getOneAuthor,
  getAllAuthors,
  updateAuthor,
  deleteAuthor,
  getAllAuthorsOptionsList
} from '../../../controllers/admin/book/author.controller'

const router: Router = express.Router()

router.post('/', addAuthor)
router.get('/:id', getOneAuthor)
router.get('/', getAllAuthors)
router.get('/optionsList/all', getAllAuthorsOptionsList)
router.put('/:id', updateAuthor)
router.delete('/:id', deleteAuthor)

export default router
