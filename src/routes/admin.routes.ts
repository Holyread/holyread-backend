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
router.use('/:id/users', adminPassport, users)
router.use('/subscriptions', subscriptions)
router.use('/:id/dashboard', dashboard)
router.use('/', admin)
router.use('/:id/book-category', bookCategroy)
router.use('/:id/book-summary', bookSummary)
router.use('/:id/expert-curated', expertCurated)
router.use('/:id/author', author)
export default router
