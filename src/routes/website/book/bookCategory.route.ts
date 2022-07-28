import express, { Router } from 'express'
import {
  getAllCategory,
} from '../../../controllers/website/book/bookCategory.controller'

const router: Router = express.Router()

router.get('/', getAllCategory)

export default router
