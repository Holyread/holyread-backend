import express, { Router } from 'express'
import {
  getAllTestimonial,
} from '../../controllers/website/testimonial.controller'

const router: Router = express.Router()

router.get('/', getAllTestimonial)

export default router
