import express, { Router } from 'express'
import {
  getAllCms,
} from '../../controllers/website/cms.controller'

const router: Router = express.Router()

router.get('/', getAllCms)

export default router
