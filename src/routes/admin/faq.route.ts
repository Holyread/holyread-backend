import express, { Router } from 'express'
import {
  addFaq,
  deleteFaq,
  getAllFaqs,
  getOneFaq,
  updateFaq,
} from '../../controllers/admin/faq.controller'

const router: Router = express.Router()

router.post('/', addFaq)
router.get('/:id', getOneFaq)
router.get('/', getAllFaqs)
router.put('/:id', updateFaq)
router.delete('/:id', deleteFaq)

export default router
