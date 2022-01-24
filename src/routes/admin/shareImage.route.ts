import express, { Router } from 'express'
import {
  addShareImage,
  deleteShareImage,
  getAllShareImages,
  getOneShareImage,
  updateShareImage
} from '../../controllers/admin/shareImage.controller'

const router: Router = express.Router()

router.post('/', addShareImage)
router.get('/:id', getOneShareImage)
router.get('/', getAllShareImages)
router.put('/:id', updateShareImage)
router.delete('/:id', deleteShareImage)

export default router
