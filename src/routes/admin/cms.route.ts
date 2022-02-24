import express, { Router } from 'express'
import {
  addCms,
  deleteCms,
  getAllCms,
  getOneCms,
  updateCms
} from '../../controllers/admin/cms.controller'

const router: Router = express.Router()

router.post('/', addCms)
router.get('/:id', getOneCms)
router.get('/', getAllCms)
router.put('/:id', updateCms)
router.delete('/:id', deleteCms)

export default router
