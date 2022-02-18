import express, { Router } from 'express'
import {
  addHighLight,
  getHighLightsByFilter,
  updateHighLight,
  deleteHighLight
} from '../../controllers/customers/highLights.controller'

const router: Router = express.Router()

router.post('/', addHighLight)
router.get('/', getHighLightsByFilter)
router.put('/:highLightId', updateHighLight)
router.delete('/:id/:highLightId', deleteHighLight)

export default router
