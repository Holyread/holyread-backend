import express, { Router } from 'express'
import {
  addSubscription,
  deleteSubcription,
  getAllSubscriptions,
  getOneSubscription,
  updateSubscription
} from '../../controllers/admin/subscriptions.controller'

import adminPassport from '../../middleware/admin.passport'

const router: Router = express.Router()

router.post('/', adminPassport, addSubscription)
router.get('/:id', adminPassport, getOneSubscription)
router.get('/', adminPassport, getAllSubscriptions)
router.put('/:id', adminPassport, updateSubscription)
router.delete('/:id', adminPassport, deleteSubcription)

export default router
