import express, { Router } from 'express'
import {
  getUserAccount,
  getBlessFriend,
  getShareOptionImageUrl,
  changePassword,
  getUserSubscription,
  updateUserAccount,
  updateUserLibrary,
  getUserLibrary,
  submitFeedback,
  submitQuery,
  blessFriend,
  subscribePlan,
  updateRating,
  deleteUser
} from '../../controllers/customers/users.controller'

const router: Router = express.Router()

router.get('/', getUserAccount)
router.get('/bless-friend/:email', getBlessFriend)
router.put('/', updateUserAccount)
router.post('/share-options-image', getShareOptionImageUrl)
router.post('/bless-friend', blessFriend)
router.put('/change-password', changePassword)
router.get('/subscription', getUserSubscription)
router.get('/library', getUserLibrary)
router.patch('/library', updateUserLibrary)
router.post('/query', submitQuery)
router.post('/feedback', submitFeedback)
router.post('/subscribe', subscribePlan)
router.patch('/rate', updateRating)
router.delete('/', deleteUser)

export default router
