import express, { Router } from 'express'
import {
  addSubscription,
  deleteSubcription,
  getAllSubscriptions,
  getOneSubscription,
  updateSubscription,
  getAllSubscriptionsNames
} from '../../controllers/admin/subscriptions.controller'

const router: Router = express.Router()

router.post('/', addSubscription)
router.get('/:id', getOneSubscription)
router.get('/', getAllSubscriptions)
router.get('/names/all', getAllSubscriptionsNames)
router.put('/:id', updateSubscription)
router.delete('/:id', deleteSubcription)

export default router
