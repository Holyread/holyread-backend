import express, { Router } from 'express'
import {
  addCoupon,
  getOneCoupon,
  deleteCoupon,
  getAllCoupons
} from '../../controllers/admin/coupons.controller'

const router: Router = express.Router()

router.post('/', addCoupon)
router.get('/', getAllCoupons)
router.get('/:id', getOneCoupon)
router.delete('/:id', deleteCoupon)

export default router
