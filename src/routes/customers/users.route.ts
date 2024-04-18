import express, { Router } from 'express'

import customerPassport from '../../middleware/customers.passport'
import {
  logout,
  getCoupon,
  emailAuth,
  deleteUser,
  blessFriend,
  submitQuery,
  updateRating,
  paymentSheet,
  subscribePlan,
  updateHandout,
  getUserAccount,
  getEncodeImage,
  getBlessFriend,
  changePassword,
  getUserLibrary,
  submitFeedback,
  verifyEmailAuth,
  updateUserAccount,
  updateUserLibrary,
  getUserSubscription,
  getChangePasswordCode,
  getShareOptionImageUrl,
  addCategoryToUserLibrary,
  getUserSelectedCategory
} from '../../controllers/customers/users.controller'

const router: Router = express.Router()

router.delete('/', customerPassport, deleteUser)
router.post('/logout', customerPassport, logout)

router.get('/', customerPassport, getUserAccount)

router.post('/query', customerPassport, submitQuery)
router.put('/', customerPassport, updateUserAccount)

router.patch('/rate', customerPassport, updateRating)

router.post('/email-auth', customerPassport, emailAuth)
router.get('/library', customerPassport, getUserLibrary)

router.post('/feedback', customerPassport, submitFeedback)
router.post('/subscribe', customerPassport, subscribePlan)
router.post('/payment-sheet', customerPassport, paymentSheet)

router.get('/coupons/:coupon', customerPassport, getCoupon)
router.post('/bless-friend', customerPassport, blessFriend)
router.patch('/library', customerPassport, updateUserLibrary)
router.put('/change-password', customerPassport, changePassword)
router.get('/subscription', customerPassport, getUserSubscription)
router.get('/bless-friend/:email', customerPassport, getBlessFriend)
router.patch('/handout/:smallGroup', customerPassport, updateHandout)

router.post('/encode-image', customerPassport, getEncodeImage)
router.post('/email-auth/verify', customerPassport, verifyEmailAuth)
router.get('/change-password/code', customerPassport, getChangePasswordCode)
router.post('/share-options-image', customerPassport, getShareOptionImageUrl)

router.post('/categories',customerPassport, addCategoryToUserLibrary)
router.get('/categories',customerPassport, getUserSelectedCategory)

export default router
