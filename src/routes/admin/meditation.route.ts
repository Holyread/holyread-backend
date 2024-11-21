import express, { Router } from 'express'
import {
  addMeditation,
  deleteMeditation,
  getAllMeditations,
  updateMeditation,
  getOneMeditation
} from '../../controllers/admin/meditation.controller'

const router: Router = express.Router()

router.post('/', addMeditation)
router.get('/', getAllMeditations)
router.get('/:id', getOneMeditation)
router.put('/:id', updateMeditation)
router.delete('/:id', deleteMeditation)

export default router
