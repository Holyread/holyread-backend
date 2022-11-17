import express, { Router } from 'express'

import customerPassport from '../../middleware/customers.passport'
import {
  logout,
  emailAuth,
  deleteUser,
  blessFriend,
  submitQuery,
  updateRating,
  subscribePlan,
  updateHandout,
  getUserAccount,
  getBlessFriend,
  changePassword,
  getUserLibrary,
  submitFeedback,
  verifyEmailAuth,
  updateUserAccount,
  updateUserLibrary,
  getUserSubscription,
  getShareOptionImageUrl,
  getEncodeImage,
} from '../../controllers/customers/users.controller'

const router: Router = express.Router()

router.get('/', customerPassport, getUserAccount)

router.delete('/', customerPassport, deleteUser)
router.post('/logout', customerPassport, logout)

router.post('/email-auth/verify', verifyEmailAuth)

router.post('/query', customerPassport, submitQuery)
router.put('/', customerPassport, updateUserAccount)

router.patch('/rate', customerPassport, updateRating)

router.post('/email-auth', customerPassport, emailAuth)
router.get('/library', customerPassport, getUserLibrary)

router.post('/feedback', customerPassport, submitFeedback)
router.post('/subscribe', customerPassport, subscribePlan)

router.post('/bless-friend', customerPassport, blessFriend)
router.patch('/library', customerPassport, updateUserLibrary)
router.put('/change-password', customerPassport, changePassword)
router.get('/subscription', customerPassport, getUserSubscription)
router.get('/bless-friend/:email', customerPassport, getBlessFriend)
router.patch('/handout/:smallGroup', customerPassport, updateHandout)

router.post('/encode-image', customerPassport, getEncodeImage)
router.post('/share-options-image', customerPassport, getShareOptionImageUrl)

export default router
