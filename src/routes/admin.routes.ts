import express, { Router } from 'express'

import cms     from './admin/cms.route'
import faq     from './admin/faq.route'
import auth    from './admin/auth.route'
import users   from './admin/users.route'
import admin   from './admin/admin.route'
import setting from './admin/setting.route'
import rating  from './admin/book/rating.route'
import author  from './admin/book/author.route'

import dashboard  from './admin/dashboard.route'
import shareImage from './admin/shareImage.route'
import readsOfDay from './admin/readsOfDay.route'
import smallGroup from './admin/smallGroup.route'

import testimonial   from './admin/testimonial.route'
import transactions  from './admin/transactions.route'
import emailTemplate from './admin/emailTemplate.route'
import subscriptions from './admin/subscriptions.route'
import adminPassport from '../middleware/admin.passport'

import bookSummary     from './admin/book/bookSummary.route'
import bookCategroy    from './admin/book/bookCategory.route'
import expertCurated   from './admin/book/expertCurated.route'
import recommendedBook from './admin/book/recommendedBook.route'

const router: Router = express.Router()

router.use('/auth', auth)

router.use('/cms', adminPassport, cms)
router.use('/faq', adminPassport, faq)

router.use('/users', adminPassport, users)

router.use('/account', adminPassport, admin)
router.use('/author', adminPassport, author)

router.use('/ratings', adminPassport, rating)
router.use('/setting', adminPassport, setting)

router.use('/dashboard', adminPassport, dashboard)

router.use('/share-image', adminPassport, shareImage)
router.use('/small-group', adminPassport, smallGroup)

router.use('/reads-of-day', adminPassport, readsOfDay)
router.use('/testimonial', adminPassport, testimonial)

router.use('/book-summary', adminPassport, bookSummary)
router.use('/transactions', adminPassport, transactions)

router.use('/book-category', adminPassport, bookCategroy)
router.use('/subscriptions', adminPassport, subscriptions)

router.use('/expert-curated', adminPassport, expertCurated)
router.use('/email-template', adminPassport, emailTemplate)

router.use('/recommended-book', adminPassport, recommendedBook)

export default router
