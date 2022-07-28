import express, { Router } from 'express'
import {
  getAllCms,
} from '../../controllers/customers/cms.controller'

const router: Router = express.Router()

router.get('/', getAllCms)

export default router
