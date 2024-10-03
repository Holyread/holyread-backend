import express, { Router } from 'express'
import {
  addMeditationCategory,
  deleteMeditationCategory,
  getAllMeditationCategories,
  updateMeditationCategory,
  getOneMeditationCategory,
  getAllMeditationCategoriesList
} from '../../controllers/admin/meditationCategory.controller'

const router: Router = express.Router()

router.post('/', addMeditationCategory)
router.get('/', getAllMeditationCategories)
router.get('/list', getAllMeditationCategoriesList)
router.get('/:id', getOneMeditationCategory)
router.put('/:id', updateMeditationCategory)
router.delete('/:id', deleteMeditationCategory)

export default router
