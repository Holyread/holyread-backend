import express, { Router } from 'express'

import bookCategories from './website/book/bookCategory.route'
import subscriptions from './website/subscriptions.route'
import testimonials from './website/testimonial.route'

import cms from './website/cms.route'

const router: Router = express.Router()

/** Routes for website */
router.use('/cms', cms)
router.use('/categories', bookCategories)
router.use('/subscriptions', subscriptions)
router.use('/testimonials', testimonials)

export default router
