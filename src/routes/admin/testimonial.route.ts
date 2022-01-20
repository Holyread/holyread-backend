import express, { Router } from 'express'
import {
  addTestimonial,
  getOneTestimonial,
  getAllTestimonial,
  updateTestimonial,
  deleteTestimonial
} from '../../controllers/admin/testimonial.controller'

const router: Router = express.Router()

router.post('/', addTestimonial)
router.get('/:id', getOneTestimonial)
router.get('/', getAllTestimonial)
router.put('/:id', updateTestimonial)
router.delete('/:id', deleteTestimonial)

export default router
