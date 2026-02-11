import express, { Router } from 'express'

import testimonials from './website/testimonial.route'
import subscriptions from './website/subscriptions.route'
import bookCategories from './website/book/bookCategory.route'
import bookSummary from './website/book/bookSummary.route'
import subscriber from './website/subscriber.route'
import cms from './website/cms.route'
import { languageMiddleware } from '../middleware/language.middleware'

const router: Router = express.Router()

router.use(languageMiddleware);

/** Routes for website */
router.use('/cms', cms)
router.use('/categories', bookCategories)
router.use('/testimonials', testimonials)
router.use('/subscriptions', subscriptions)
router.use('/book-summary', bookSummary)
router.use('/subscribe', subscriber)

export default router
