import express, { Router } from 'express'
import {
  getUserAccount,
  getShareOptionImageUrl,
  changePassword,
  getUserSubscription,
  updateUserAccount,
  updateUserLibrary,
  getUserLibrary,
  submitFeedback,
  submitQuery,
  blessFriend
} from '../../controllers/customers/users.controller'

const router: Router = express.Router()

router.get('/', getUserAccount)
router.put('/', updateUserAccount)
router.post('/share-options-image', getShareOptionImageUrl)
router.post('/bless-friend', blessFriend)
router.put('/change-password', changePassword)
router.get('/subscription', getUserSubscription)
router.get('/library', getUserLibrary)
router.patch('/library', updateUserLibrary)
router.post('/query', submitQuery)
router.post('/feedback', submitFeedback)

export default router
