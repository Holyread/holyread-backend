import express, { Router } from 'express'
import adminPassport from '../middleware/admin.passport'
import auth from './admin/auth.route'
import users from './admin/users.route'
import subscriptions from './admin/subscriptions.route'
import dashboard from './admin/dashboard.route'
import admin from './admin/admin.route'
import bookCategroy from './admin/book/bookCategory.route'
import bookSummary from './admin/book/bookSummary.route'
import author from './admin/book/author.route'
import expertCurated from './admin/book/expertCurated.route'
import recommendedBook from './admin/book/recommendedBook.route'
import testimonial from './admin/testimonial.route'
import shareImage from './admin/shareImage.route'
import readsOfDay from './admin/readsOfDay.route'

const router: Router = express.Router()
router.use('/auth', auth)
router.use('/users', adminPassport, users)
router.use('/subscriptions', adminPassport, subscriptions)
router.use('/dashboard', adminPassport, dashboard)
router.use('/account', admin)
router.use('/book-category', adminPassport, bookCategroy)
router.use('/book-summary', adminPassport, bookSummary)
router.use('/expert-curated', adminPassport, expertCurated)
router.use('/author', adminPassport, author)
router.use('/recommended-book', adminPassport, recommendedBook)
router.use('/testimonial', adminPassport, testimonial)
router.use('/share-image', adminPassport, shareImage)
router.use('/reads-of-day', adminPassport, readsOfDay)

export default router
