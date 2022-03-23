import express, { Router } from 'express'
import {
  getAllExpertCurated,
  getOneExpertCurated
} from '../../../controllers/customers/book/expertCurated.controller';

const router: Router = express.Router()

router.get('/:id', getOneExpertCurated)
router.get('/', getAllExpertCurated)

export default router
