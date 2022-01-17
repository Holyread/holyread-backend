import express, { Router } from 'express'
import {
  addAuthor,
  getOneAuthor,
  getAllAuthors,
  updateAuthor,
  deleteAuthor
} from '../../../controllers/admin/book/author.controller'

import adminPassport from '../../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addAuthor)
router.get('/:id', adminPassport, getOneAuthor)
router.get('/', adminPassport, getAllAuthors)
router.put('/:id', adminPassport, updateAuthor)
router.delete('/:id', adminPassport, deleteAuthor)

export default router
