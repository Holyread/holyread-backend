import express, { Router } from 'express'
import {
  getLatestAppVersion,
} from '../../controllers/customers/appVersion.controller'

const router: Router = express.Router()

router.get('/', getLatestAppVersion)

export default router
