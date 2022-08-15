import express, { Router } from 'express'
import { getAllRatings } from '../../../controllers/admin/book/rating.controller'

const router: Router = express.Router()

router.get('/', getAllRatings)

export default router
