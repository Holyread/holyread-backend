import express, { Router } from 'express'
import {
  getOneCoupon,
  getAllCoupons
} from '../../controllers/customers/coupons.controller'

const router: Router = express.Router()

router.get('/', getAllCoupons)
router.get('/:id', getOneCoupon)

export default router
