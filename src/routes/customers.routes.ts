import express, { Router } from 'express'

import cms from './customers/cms.route'
import faq from './customers/faq.route'

import auth from './customers/auth.route'
import users from './customers/users.route'
import coupons from './customers/coupons.route'

import dashboard from './customers/dashboard.route'
import authors from './customers/book/author.route'
import highLight from './customers/highLight.route'
import shareImage from './customers/shareImage.route'

import subscriptions from './customers/subscriptions.route'
import notifications from './customers/notifications.route'
import bookSummary from './customers/book/bookSummary.route'

import customerPassport from '../middleware/customers.passport'
import expertCurated from './customers/book/expertCurated.route'
import dailyDevotional from './customers/book/dailyDevotional.route'
import devotionalCategories from './customers/devotionalCategories.route'
import feedBack from './customers/userFeedBack.route'
import meditation from './customers/meditation.route'
import appVersion from './customers/appVersion.route'
import donation from './customers/donation.route'
import language from './customers/language.route'
import { languageMiddleware } from '../middleware/language.middleware'

const router: Router = express.Router()

router.use('/cms', languageMiddleware, cms)
router.use('/faq', languageMiddleware, faq)

router.use('/auth', auth)
router.use('/users', users)
router.use('/coupons', coupons)

router.use('/subscriptions', subscriptions)
router.use('/expert-curated', customerPassport, expertCurated)

router.use('/authors', customerPassport, authors)
router.use('/dashboard', customerPassport, dashboard)

router.use('/high-lights', customerPassport, highLight)
router.use('/share-image', customerPassport, shareImage)

router.use('/book-summary', customerPassport, bookSummary)
router.use('/notifications', customerPassport, notifications)

router.use('/reads-of-the-day', customerPassport, dailyDevotional)
router.use('/devotional-categories', customerPassport, devotionalCategories)

router.use('/feedBack', customerPassport, feedBack )
router.use('/meditation',customerPassport, meditation)

router.use('/app-version', customerPassport, appVersion)
router.use('/donation', customerPassport, donation)
router.use('/language', language)

export default router
