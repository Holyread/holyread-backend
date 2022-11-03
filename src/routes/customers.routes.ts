import express, { Router } from 'express'

import cms from './customers/cms.route'
import faq from './customers/faq.route'
import auth from './customers/auth.route'
import users from './customers/users.route'
import dashboard from './customers/dashboard.route'
import authors from './customers/book/author.route'
import highLight from './customers/highLight.route'
import shareImage from './customers/shareImage.route'
import subscriptions from './customers/subscriptions.route'
import notifications from './customers/notifications.route'
import bookSummary from './customers/book/bookSummary.route'
import expertCurated from './customers/book/expertCurated.route'
import customerPassport from '../middleware/customers.passport'

const router: Router = express.Router()

router.use('/cms', cms)
router.use('/faq', faq)
router.use('/auth', auth)
router.use('/users', users)
router.use('/subscriptions', subscriptions)
router.use('/expert-curated', expertCurated)
router.use('/authors', customerPassport, authors)
router.use('/dashboard', customerPassport, dashboard)
router.use('/high-lights', customerPassport, highLight)
router.use('/share-image', customerPassport, shareImage)
router.use('/book-summary', customerPassport, bookSummary)
router.use('/notifications', customerPassport, notifications)

export default router
