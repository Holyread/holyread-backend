import express, { Router } from 'express'
import {
  addExpertCurated,
  getAllExpertCurated,
  getOneExpertCurated,
  updateExpertCurated,
  deleteExpertCurated
} from '../../../controllers/admin/book/expertCurated.controller';

const router: Router = express.Router()

router.post('/', addExpertCurated)
router.get('/:id', getOneExpertCurated)
router.get('/', getAllExpertCurated)
router.put('/:id', updateExpertCurated)
router.delete('/:id', deleteExpertCurated)

export default router
