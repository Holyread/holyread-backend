import express, { Router } from 'express'
import {
  getSetting
} from '../../controllers/customers/setting.controller'

const router: Router = express.Router()

router.get('/', getSetting)

export default router
