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

router.use('/auth', auth)
router.use('/users', users)
router.use('/dashboard', dashboard)
router.use('/book-summary', bookSummary)
router.use('/high-lights', highLight)
router.use('/expert-curated', expertCurated)
router.use('/cms', cms)
router.use('/faq', faq)

export default router
