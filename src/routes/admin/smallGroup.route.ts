import express, { Router } from 'express'
import {
  addSmallGroup,
  deleteSmallGroup,
  getAllSmallGroups,
  getOneSmallGroup,
  updateSmallGroup
} from '../../controllers/admin/smallGroup.controller'

const router: Router = express.Router()

router.post('/', addSmallGroup)
router.get('/:id', getOneSmallGroup)
router.get('/', getAllSmallGroups)
router.put('/:id', updateSmallGroup)
router.delete('/:id', deleteSmallGroup)

export default router
