import express, { Router } from 'express'
import {
  getAllDevotionalCategories
} from '../../controllers/customers/devotionalCategories.controller'

const router: Router = express.Router()

router.get('/', getAllDevotionalCategories)

export default router
