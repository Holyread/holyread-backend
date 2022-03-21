import express, { Router } from 'express'
import {
  getAllFaqs
} from '../../controllers/customers/faq.controller'

const router: Router = express.Router()

router.get('/', getAllFaqs)

export default router
