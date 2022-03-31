import express, { Router } from 'express'
import {
  getAllShareImages
} from '../../controllers/customers/shareImage.controller'

const router: Router = express.Router()

router.get('/', getAllShareImages)

export default router
