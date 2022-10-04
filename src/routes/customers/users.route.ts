import express, { Router } from 'express'

import customerPassport from '../../middleware/customers.passport'
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
  deleteUser,
  emailAuth,
  verifyEmailAuth,
  updateHandout
} from '../../controllers/customers/users.controller'

const router: Router = express.Router()

router.get('/', customerPassport, getUserAccount)
router.get('/bless-friend/:email', customerPassport, getBlessFriend)
router.put('/', customerPassport, updateUserAccount)
router.post('/share-options-image', customerPassport, getShareOptionImageUrl)
router.post('/bless-friend', customerPassport, blessFriend)
router.put('/change-password', customerPassport, changePassword)
router.get('/subscription', customerPassport, getUserSubscription)
router.get('/library', customerPassport, getUserLibrary)
router.patch('/library', customerPassport, updateUserLibrary)
router.post('/query', customerPassport, submitQuery)
router.post('/feedback', customerPassport, submitFeedback)
router.post('/subscribe', customerPassport, subscribePlan)
router.patch('/rate', customerPassport, updateRating)
router.delete('/', customerPassport, deleteUser)
router.post('/email-auth', customerPassport, emailAuth)
router.post('/email-auth/verify', verifyEmailAuth)
router.patch('/handout/:smallGroup', customerPassport, updateHandout)

export default router
