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

const router: Router = express.Router()
router.use('/auth', auth)
router.use('/users', adminPassport, users)
router.use('/subscriptions', subscriptions)
router.use('/dashboard', dashboard)
router.use('/setting', admin)
router.use('/book-category', bookCategroy)
router.use('/book-summary', bookSummary)
router.use('/expert-curated', expertCurated)
router.use('/author', author)
export default router
