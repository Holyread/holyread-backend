import express, { Router } from 'express'

import auth from './customers/auth.route'
import users from './customers/users.route'
import dashboard from './customers/dashboard.route'
import bookSummary from './customers/book/bookSummary.route'
import highLight from './customers/highLight.route'
import expertCurated from './customers/book/expertCurated.route'
import cms from './customers/cms.route'
import faq from './customers/faq.route'
const router: Router = express.Router()
import customerPassport from '../middleware/customers.passport'
import shareImage from './customers/shareImage.route'
import subscriptions from './customers/subscriptions.route'
import notifications from './customers/notifications.route'

router.use('/auth', auth)
router.use('/users', users)
router.use('/dashboard', customerPassport, dashboard)
router.use('/book-summary', customerPassport, bookSummary)
router.use('/high-lights', customerPassport, highLight)
router.use('/expert-curated', expertCurated)
router.use('/cms', cms)
router.use('/faq', faq)
router.use('/share-image', customerPassport, shareImage)
router.use('/subscriptions', customerPassport, subscriptions)
router.use('/notifications', customerPassport, notifications)

export default router
