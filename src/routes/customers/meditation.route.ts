import express, { Router } from 'express'
import {
  getAllMeditations,
  getAllMeditationCategoriesList
} from '../../controllers/customers/meditation.controller'

const router: Router = express.Router()

router.get('/', getAllMeditations)
router.get('/categories', getAllMeditationCategoriesList)

export default router
