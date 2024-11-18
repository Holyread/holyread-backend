import express, { Router } from 'express'

import testimonials from './website/testimonial.route'
import subscriptions from './website/subscriptions.route'
import bookCategories from './website/book/bookCategory.route'
import subscriber from './website/subscriber.route'

import cms from './website/cms.route'

const router: Router = express.Router()

/** Routes for website */
router.use('/cms', cms)
router.use('/categories', bookCategories)
router.use('/testimonials', testimonials)
router.use('/subscriptions', subscriptions)
router.use('/subscribe', subscriber)

export default router
