import express, { Router } from 'express'
import {
  getAllAuthorsOptionsList
} from '../../../controllers/customers/book/author.controller'

const router: Router = express.Router()

router.get('/options', getAllAuthorsOptionsList)

export default router
