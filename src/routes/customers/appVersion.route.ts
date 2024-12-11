import express, { Router } from 'express'
import {
  checkUserAppVersion,
} from '../../controllers/customers/appVersion.controller'

const router: Router = express.Router()

router.post('/', checkUserAppVersion)

export default router
